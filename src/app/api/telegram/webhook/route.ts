import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { parseMessage } from "@/lib/telegram/parse-message";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import type { Category } from "@/lib/types";

const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

type TgPhotoSize = { file_id: string; file_size?: number; width: number; height: number };
type TgMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  photo?: TgPhotoSize[];
  caption?: string;
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
      await handleText(message.text, message.message_id, chatId);
    }
  } catch (err) {
    console.error("telegram webhook error", err);
    await sendTelegramMessage(chatId, "Gagal menyimpan transaksi, coba lagi.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
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

  const { error } = await supabaseAdmin().from("transactions").insert({
    amount: parsed.amount,
    type: parsed.type,
    category_id: parsed.categoryId,
    note: parsed.note,
    source: "telegram",
    telegram_message_id: messageId,
    raw_input: text,
  });
  if (error) throw error;

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
  const { data: publicUrl } = supabase.storage.from("receipts").getPublicUrl(objectPath);
  const receiptUrl = publicUrl.publicUrl;

  const ocrConfigured = process.env.OCR_API_BASE_URL && process.env.OCR_API_KEY && process.env.OCR_MODEL;
  const categories = await fetchCategories();

  if (!ocrConfigured) {
    // ponytail: no OCR configured — save a placeholder expense row so the
    // receipt isn't lost, ask the user to reply with the real amount as text.
    // Upgrade: when OCR_* env vars are set, extractReceiptData() below fills
    // amount/note automatically instead of this fallback.
    const fallbackCategory = categories.find((c) => c.type === "expense" && c.name.startsWith("Lainnya"));
    const { error } = await supabaseAdmin().from("transactions").insert({
      amount: 0.01,
      type: "expense",
      category_id: fallbackCategory?.id ?? null,
      note: "[struk]",
      source: "telegram",
      telegram_message_id: message.message_id,
      receipt_url: receiptUrl,
      raw_input: message.caption ?? null,
    });
    if (error) throw error;
    await sendTelegramMessage(
      chatId,
      "Struk tersimpan. Balas pesan ini dengan nominalnya, mis. '25rb', biar tercatat benar."
    );
    return;
  }

  const extracted = await extractReceiptData(receiptUrl);
  const amount = extracted?.amount && extracted.amount > 0 ? extracted.amount : 0.01;
  const note = extracted?.description ?? "[struk]";
  const matched = categories.find(
    (c) => c.type === "expense" && note.toLowerCase().includes(c.name.toLowerCase())
  );
  const fallbackCategory = categories.find((c) => c.type === "expense" && c.name.startsWith("Lainnya"));
  const categoryId = (matched ?? fallbackCategory)?.id ?? null;

  const { error } = await supabaseAdmin().from("transactions").insert({
    amount,
    type: "expense",
    category_id: categoryId,
    note,
    source: "telegram",
    telegram_message_id: message.message_id,
    receipt_url: receiptUrl,
    raw_input: message.caption ?? null,
  });
  if (error) throw error;

  await sendTelegramMessage(
    chatId,
    `Tersimpan: ${idr.format(amount)} (${(matched ?? fallbackCategory)?.name ?? "Lainnya"})\n${note}`
  );
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
