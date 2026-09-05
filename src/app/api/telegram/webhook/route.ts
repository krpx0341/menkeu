import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { parseAmount, parseMessage } from "@/lib/telegram/parse-message";
import { getBotToken, getTelegramSettings } from "@/lib/telegram/settings";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import { checkBudgetThreshold } from "@/lib/telegram/budget-alerts";
import type { AppSettings, Category } from "@/lib/types";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

// Placeholder amount used when a receipt's real total isn't known yet
// (no OCR configured, or OCR failed to extract a number). Kept below any
// realistic real transaction so it's easy to filter/spot if a reply-based
// correction never came through.
const PENDING_AMOUNT = 0.01;

type TgPhotoSize = { file_id: string; file_size?: number; width: number; height: number };
type TgMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  photo?: TgPhotoSize[];
  caption?: string;
  reply_to_message?: { message_id: number };
};
type TgUpdate = { message?: TgMessage };

export async function POST(req: NextRequest) {
  // Secret verification: env var if set (legacy setups), else the settings
  // row — the same value the registration step persisted, so UI-only setups
  // work without any env var.
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? (await getTelegramSettings())?.webhook_secret;
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TgUpdate;
  const message = update.message;
  if (!message) {
    console.error("telegram webhook: no message in update");
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const allowedChatId = (await getTelegramSettings())?.chat_id;
  console.error("telegram webhook: chatId=", chatId, "allowed=", allowedChatId, "photo=", message.photo?.length, "text=", message.text?.substring(0, 50));
  if (String(chatId) !== allowedChatId) {
    console.error("telegram webhook: chat id mismatch");
    return NextResponse.json({ ok: true }); // silently ignore other chats
  }

  try {
    if (message.photo?.length) {
      await handlePhoto(message, chatId);
    } else if (message.text) {
      const corrected = message.reply_to_message
        ? await tryApplyReplyCorrection(message.text, message.reply_to_message.message_id, chatId)
        : false;
      if (!corrected) await handleText(message.text, message.message_id, chatId);
    }
  } catch (err) {
    console.error("telegram webhook error", err);
    await sendTelegramMessage(chatId, "Gagal menyimpan transaksi, coba lagi.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

// Handles a reply to a "struk tersimpan, balas dengan nominal" prompt: finds
// the pending-amount transaction that prompt was attached to and fills in
// the real amount instead of creating a duplicate transaction. Returns false
// (falls through to normal handleText) if the reply doesn't match a pending
// correction, e.g. the user replied to some other message or with no number.
async function tryApplyReplyCorrection(text: string, replyToMessageId: number, chatId: number): Promise<boolean> {
  console.error("tryApplyReplyCorrection: text=", text, "replyToMessageId=", replyToMessageId);
  const { data: pending } = await supabaseAdmin()
    .from("transactions")
    .select("id, telegram_message_id, telegram_confirm_message_id, amount")
    .eq("telegram_confirm_message_id", replyToMessageId)
    .eq("amount", PENDING_AMOUNT)
    .maybeSingle();
  console.error("tryApplyReplyCorrection: pending=", pending);
  if (!pending) {
    console.error("tryApplyReplyCorrection: no pending transaction found");
    return false;
  }

  const { amount } = parseAmount(text);
  console.error("tryApplyReplyCorrection: parsed amount=", amount);
  if (amount == null) return false;

  const { error } = await supabaseAdmin()
    .from("transactions")
    .update({ amount, note: text.trim(), telegram_confirm_message_id: null })
    .eq("id", pending.id);
  if (error) throw error;
  console.error("tryApplyReplyCorrection: updated id=", pending.id, "amount=", amount);

  await sendTelegramMessage(chatId, `Diperbarui: ${idr.format(amount)}`);
  return true;
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin()
    .from("categories")
    .select("*")
    .eq("is_archived", false);
  if (error) throw error;
  return data as Category[];
}

async function handleText(text: string, messageId: number, chatId: number) {
  console.error("handleText: processing text=", text.substring(0, 50), "messageId=", messageId);
  const categories = await fetchCategories();
  const parsed = parseMessage(text, categories);

  if (parsed.amount == null) {
    await sendTelegramMessage(chatId, "Jumlahnya belum kebaca. Kirim ulang dengan nominal, mis. '50rb makan siang'.");
    return;
  }

  const { data, error } = await supabaseAdmin()
    .from("transactions")
    .upsert(
      {
        amount: parsed.amount,
        type: parsed.type,
        category_id: parsed.categoryId,
        note: parsed.note,
        source: "telegram",
        telegram_message_id: messageId,
        raw_input: text,
      },
      { onConflict: "telegram_message_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw error;
  // Telegram redelivered a message we already saved — a confirmation was
  // already sent the first time, so stay silent instead of sending it twice.
  if (!data?.length) return;

  await sendTelegramMessage(
    chatId,
    `Tersimpan: ${idr.format(parsed.amount)} (${parsed.categoryName})\n${parsed.note}`
  );

  if (parsed.type === "expense" && parsed.categoryId) {
    await checkBudgetThreshold(parsed.categoryId, currentMonthValue()).catch(() => {});
  }
}

async function handlePhoto(message: TgMessage, chatId: number) {
  const token = await getBotToken();

  // Largest photo size is last in Telegram's array.
  const largest = message.photo![message.photo!.length - 1];
  const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${largest.file_id}`);
  const fileInfo = await fileInfoRes.json();
  const filePath = fileInfo?.result?.file_path;
  if (!filePath) throw new Error("Telegram getFile returned no file_path");

  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  const ext = filePath.split(".").pop() || "jpg";
  const objectPath = `${chatId}/${message.message_id}.${ext}`;
  const mimeType = ext === "jpg" ? "jpeg" : ext;

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(objectPath, bytes, { contentType: `image/${mimeType}`, upsert: true });
  if (uploadError) throw uploadError;
  // The bucket is private (see 0005_private_receipts.sql): store the object
  // path and only mint a short-lived signed URL when the UI renders it.
  const receiptPath = objectPath;

  // OCR uses its own Gemini key (gemini_api_key_real), independent of the AI
  // Advisor's key/provider — the Advisor may run on OpenAI-compatible
  // endpoints that don't support vision, so OCR always needs the real key.
  const settings = await getAppSettings();
  const aiConfigured = !!settings?.gemini_api_key_real;
  const categories = await fetchCategories();

  const fallbackCategory = categories.find((c) => c.type === "expense" && c.name.startsWith("Lainnya"));

  if (!aiConfigured) {
    // No AI key — save a placeholder expense row so the receipt
    // isn't lost, ask the user to reply with the real amount as text, and
    // remember which confirmation message that reply should land on (see
    // tryApplyReplyCorrection above) so it updates this row instead of
    // creating a second, disconnected transaction.
    await savePendingReceipt(message, chatId, receiptPath, fallbackCategory?.id ?? null);
    return;
  }

  const extracted = await extractReceiptData(bytes, mimeType, settings!).catch((err) => {
    console.error("handlePhoto: extractReceiptData caught error, using fallback:", err instanceof Error ? err.message : String(err));
    return null;
  });
  if (!extracted?.amount || extracted.amount <= 0) {
    // OCR couldn't read an amount — same pending-correction path as the
    // no-AI case, just with the AI's description as a starting note.
    await savePendingReceipt(message, chatId, receiptPath, fallbackCategory?.id ?? null, extracted?.description);
    return;
  }

  const amount = extracted.amount;
  const note = extracted.description ?? "[struk]";
  const matched = categories.find(
    (c) => c.type === "expense" && note.toLowerCase().includes(c.name.toLowerCase())
  );
  const categoryId = (matched ?? fallbackCategory)?.id ?? null;

  const { data, error } = await supabaseAdmin()
    .from("transactions")
    .upsert(
      {
        amount,
        type: "expense",
        category_id: categoryId,
        note,
        source: "telegram",
        telegram_message_id: message.message_id,
        receipt_path: receiptPath,
        raw_input: message.caption ?? null,
      },
      { onConflict: "telegram_message_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw error;
  if (!data?.length) return;

  await sendTelegramMessage(
    chatId,
    `Tersimpan: ${idr.format(amount)} (${(matched ?? fallbackCategory)?.name ?? "Lainnya"})\n${note}`
  );

  if (categoryId) {
    await checkBudgetThreshold(categoryId, currentMonthValue()).catch(() => {});
  }
}

// Inserts a placeholder (unknown-amount) expense for a receipt photo, then
// sends the "reply with the amount" prompt and links its message id back to
// the row so a later reply can correct it in place (tryApplyReplyCorrection).
async function savePendingReceipt(
  message: TgMessage,
  chatId: number,
  receiptPath: string,
  categoryId: string | null,
  note?: string | null
) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("transactions")
    .upsert(
      {
        amount: PENDING_AMOUNT,
        type: "expense",
        category_id: categoryId,
        note: note ?? "[struk]",
        source: "telegram",
        telegram_message_id: message.message_id,
        receipt_path: receiptPath,
        raw_input: message.caption ?? null,
      },
      { onConflict: "telegram_message_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw error;
  // Already saved on a prior delivery of this same update — don't re-prompt.
  if (!data?.length) return;

  const confirmMessageId = await sendTelegramMessage(
    chatId,
    "Struk tersimpan. Balas pesan ini dengan nominalnya, mis. '25rb', biar tercatat benar."
  );

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ telegram_confirm_message_id: confirmMessageId })
    .eq("id", data[0].id);
  if (updateError) throw updateError;
}

async function getAppSettings(): Promise<AppSettings | null> {
  const { data } = await supabaseAdmin()
    .from("app_settings")
    .select("gemini_api_key, gemini_api_key_real, gemini_model, ai_provider, ai_base_url, updated_at")
    .eq("id", true)
    .maybeSingle();
  return (data as AppSettings | null) ?? null;
}

// Extracts the receipt total via Gemini's vision (always, regardless of the user's
// chosen AI provider). OCR requires vision capability; Gemini 3.6 Flash is the
// current free-tier vision model (gemini-2.5-flash was retired for new API keys —
// requires real Google Gemini API key in app_settings.gemini_api_key_real).
// Returns null if vision fails, no API key configured, or can't extract an amount.
async function extractReceiptData(
  bytes: Uint8Array,
  mimeType: string,
  settings: AppSettings
): Promise<{ amount: number | null; description: string | null } | null> {
  // Require the real Gemini API key (separate from Vikey token).
  const geminiKey = settings.gemini_api_key_real;
  if (!geminiKey) {
    console.error("extractReceiptData: no gemini_api_key_real configured, skipping OCR");
    return null;
  }

  const base64 = Buffer.from(bytes).toString("base64");
  console.error("extractReceiptData: using Gemini vision, base64 len=", base64.length);
  
  const schema = {
    type: "OBJECT",
    properties: {
      amount: { type: "NUMBER", description: "Total amount in IDR (number only, no currency symbol)." },
      description: { type: "STRING", description: "Short merchant/description from the receipt." },
    },
    required: ["amount", "description"],
  };

  try {
    // Call Gemini directly (not through Vikey).
    const { generateContent } = await import("@/lib/gemini");
    const raw = await generateContent({
      apiKey: geminiKey,
      model: "gemini-3.6-flash",
      systemInstruction:
        "Kamu membaca struk/nota belanja. Ekstrak total nominal (IDR, angka saja) dan nama toko/deskripsi singkat. Jawab HANYA JSON, dalam format {\"amount\": <number>, \"description\": \"<string>\"}. Jangan ada teks lain.",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Baca total nominal dari struk ini." },
            { inline_data: { mime_type: `image/${mimeType}`, data: base64 } },
          ],
        },
      ],
      responseSchema: schema,
    });
    console.error("extractReceiptData: raw response=", raw.substring(0, 200));

    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    console.error("extractReceiptData: parsed=", parsed);
    return { amount: Number(parsed.amount) || null, description: parsed.description ?? null };
  } catch (err) {
    console.error("extractReceiptData: error=", err instanceof Error ? err.message : String(err));
    return null;
  }
}
