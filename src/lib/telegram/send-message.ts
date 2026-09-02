import { getBotToken } from "@/lib/telegram/settings";

// Minimal wrapper around Telegram's sendMessage Bot API call.
// Returns the sent message's id so callers can later match a reply back to it.
// The bot token comes from telegram_settings (set on the Settings page).
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<number> {
  const token = await getBotToken();

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  return json.result.message_id as number;
}
