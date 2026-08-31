import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { parseAmount, parseMessage } from "@/lib/telegram/parse-message";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import type { Category } from "@/lib/types";

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
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TgUpdate;
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  if (String(chatId) !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
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
  const { data: pending } = await supabaseAdmin()
    .from("transactions")
    .select("id")
    .eq("telegram_confirm_message_id", replyToMessageId)
    .eq("amount", PENDING_AMOUNT)
    .maybeSingle();
  if (!pending) return false;

  const { amount } = parseAmount(text);
  if (amount == null) return false;

  const { error } = await supabaseAdmin()
    .from("transactions")
    .update({ amount, note: text.trim(), telegram_confirm_message_id: null })
    .eq("id", pending.id);
  if (error) throw error;

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
}

async function handlePhoto(message: TgMessage, chatId: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN env var");

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

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(objectPath, bytes, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: true });
  if (uploadError) throw uploadError;
  // The bucket is private (see 0005_private_receipts.sql): store the object
  // path and only mint a short-lived signed URL when something actually
  // needs to fetch the image (OCR below, or the UI when rendering it).
  const receiptPath = objectPath;

  const ocrConfigured = process.env.OCR_API_BASE_URL && process.env.OCR_API_KEY && process.env.OCR_MODEL;
  const categories = await fetchCategories();

  const fallbackCategory = categories.find((c) => c.type === "expense" && c.name.startsWith("Lainnya"));

  if (!ocrConfigured) {
    // No OCR configured — save a placeholder expense row so the receipt
    // isn't lost, ask the user to reply with the real amount as text, and
    // remember which confirmation message that reply should land on (see
    // tryApplyReplyCorrection above) so it updates this row instead of
    // creating a second, disconnected transaction.
    await savePendingReceipt(message, chatId, receiptPath, fallbackCategory?.id ?? null);
    return;
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receiptPath, 300);
  if (signedError) throw signedError;

  const extracted = await extractReceiptData(signed.signedUrl);
  if (!extracted?.amount || extracted.amount <= 0) {
    // OCR configured but couldn't read an amount — same pending-correction
    // path as the no-OCR case, just with OCR's description as a starting note.
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

async function extractReceiptData(imageUrl: string): Promise<{ amount: number | null; description: string | null } | null> {
  const base = process.env.OCR_API_BASE_URL!;
  const key = process.env.OCR_API_KEY!;
  const model = process.env.OCR_MODEL!;

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the total amount (IDR, number only) and a short merchant/description from this receipt. Reply with ONLY JSON: {\"amount\": number, \"description\": string}.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : content);
    return { amount: Number(parsed.amount) || null, description: parsed.description ?? null };
  } catch {
    return null;
  }
}
