// Minimal wrapper around Telegram's sendMessage Bot API call.
// Returns the sent message's id so callers can later match a reply back to it.
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<number> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN env var");

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
