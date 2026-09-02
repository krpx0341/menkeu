import { supabaseAdmin } from "@/lib/supabase/server";

// Bot helpers shared by the settings actions and the webhook route: the bot
// token now lives in telegram_settings (set from the Settings page), so the
// webhook can no longer read it from an env var.
export type TelegramSettings = {
  bot_token: string | null;
  chat_id: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  updated_at: string;
};

export async function getTelegramSettings(): Promise<TelegramSettings | null> {
  const { data } = await supabaseAdmin()
    .from("telegram_settings")
    .select("bot_token, chat_id, webhook_url, webhook_secret, updated_at")
    .eq("id", true)
    .maybeSingle();
  return (data as TelegramSettings | null) ?? null;
}

export async function getBotToken(): Promise<string> {
  const settings = await getTelegramSettings();
  const token = settings?.bot_token;
  if (!token) throw new Error("Missing bot token in telegram_settings");
  return token;
}

// Calls Telegram's Bot API. token may come from settings (webhook path) or
// from a just-typed form value (setup path) — caller decides which.
export async function callTelegramApi<T>(
  method: string,
  token: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !json?.ok) {
    throw new Error(
      `Telegram ${method} failed: ${res.status} ${json?.description ?? res.statusText}`
    );
  }
  return json.result as T;
}

export type BotInfo = { id: number; username: string; first_name?: string };
export type UpdatesResult = { result: Array<{ message?: { chat?: { id?: number } } }> };
