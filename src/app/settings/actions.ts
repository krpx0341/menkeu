"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callTelegramApi, getTelegramSettings, type BotInfo, type UpdatesResult } from "@/lib/telegram/settings";
import { sendTelegramMessage } from "@/lib/telegram/send-message";

// --- Gemini (AI Advisor) ---

export async function saveGeminiSettings(_prev: string | undefined, formData: FormData) {
  const apiKey = String(formData.get("gemini_api_key") ?? "").trim();
  const model = String(formData.get("gemini_model") ?? "").trim();
  const provider = String(formData.get("ai_provider") ?? "gemini").trim();
  const baseUrl = String(formData.get("ai_base_url") ?? "").trim();

  if (!apiKey) return "API key wajib diisi.";
  if (!model) return "Nama model wajib diisi.";
  if (provider !== "gemini" && provider !== "openai") return "Provider tidak dikenal.";
  if (baseUrl && !/^https?:\/\//.test(baseUrl)) return "Base URL harus dimulai http(s)://.";

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({
      id: true,
      gemini_api_key: apiKey,
      gemini_model: model,
      ai_provider: provider,
      ai_base_url: baseUrl || null,
      updated_at: new Date().toISOString(),
    });
  if (error) return error.message;

  revalidatePath("/settings");
  return undefined;
}

// Save ONLY the Gemini OCR key (receipt photo reading), independent of the
// AI Advisor provider key so each can be edited/cleared without touching the other.
export async function saveGeminiOcrKey(_prev: string | undefined, formData: FormData) {
  const ocrKey = String(formData.get("gemini_api_key_real") ?? "").trim();

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({
      id: true,
      gemini_api_key_real: ocrKey || null,
      updated_at: new Date().toISOString(),
    });
  if (error) return error.message;

  revalidatePath("/settings");
  return undefined;
}

export async function clearGeminiOcrKey() {
  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ id: true, gemini_api_key_real: null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function clearGeminiApiKey() {
  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ id: true, gemini_api_key: null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

// Steps 1-4: persist the bot token and allowed chat id, then (when a
// deployment URL is reachable) register the webhook so Telegram starts
// delivering updates. Token validation happens before any write.
export async function saveTelegramSettings(_prev: string | undefined, formData: FormData) {
  const botToken = String(formData.get("bot_token") ?? "").trim();
  const chatId = String(formData.get("chat_id") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();

  if (!botToken) return "Bot token wajib diisi.";
  if (!chatId) return "Chat ID wajib diisi.";
  if (!/^\d+$/.test(chatId)) return "Chat ID harus berupa angka (dari @userinfobot atau getUpdates).";
  if (baseUrl && !/^https:\/\//.test(baseUrl)) return "URL aplikasi harus https://.";

  try {
    await callTelegramApi<BotInfo>("getMe", botToken);
  } catch (err) {
    return `Token tidak valid: ${err instanceof Error ? err.message : "gagal menghubungi Telegram"}`;
  }

  // Rotate the webhook secret on every save so a leaked one expires.
  const webhookSecret = crypto.randomUUID();

  // Auto-register the webhook only when a deployment URL is known; otherwise
  // register later from the Settings page ("Pasang webhook").
  let webhookUrl: string | null = null;
  if (baseUrl) {
    try {
      webhookUrl = await registerWebhook(botToken, baseUrl, webhookSecret);
    } catch (err) {
      return `Token valid, tapi gagal pasang webhook: ${err instanceof Error ? err.message : "error"}`;
    }
  }

  const { error } = await supabaseAdmin()
    .from("telegram_settings")
    .upsert({
      id: true,
      bot_token: botToken,
      chat_id: chatId,
      webhook_url: webhookUrl ?? undefined,
      webhook_secret: webhookSecret,
      updated_at: new Date().toISOString(),
    });
  if (error) return error.message;

  revalidatePath("/settings");
  return undefined;
}

// Step 5 (manual): register/refresh the webhook against the current
// deployment URL when setup was done without one.
export async function registerTelegramWebhook(_prev: string | undefined, formData: FormData) {
  const baseUrl = String(formData.get("base_url") ?? "").trim();
  if (!baseUrl) return "Isi URL aplikasi dulu (mis. https://menkeu.example.com).";
  if (!/^https:\/\//.test(baseUrl)) return "URL aplikasi harus https://.";

  const settings = await getTelegramSettings();
  if (!settings?.bot_token) return "Belum ada bot token. Simpan pengaturan bot dulu.";

  try {
    const webhookSecret = settings.webhook_secret ?? crypto.randomUUID();
    const url = await registerWebhook(settings.bot_token, baseUrl, webhookSecret);
    if (!settings.webhook_secret) {
      await supabaseAdmin().from("telegram_settings").update({
        webhook_secret: webhookSecret,
        webhook_url: url,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    return `Gagal pasang webhook: ${err instanceof Error ? err.message : "error"}`;
  }
  revalidatePath("/settings");
  return undefined;
}

async function registerWebhook(botToken: string, baseUrl: string, webhookSecret: string): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  await callTelegramApi("setWebhook", botToken, {
    url,
    secret_token: webhookSecret,
  });
  return url;
}

// Test connection: resolves the bot's username and, when a chat has messaged
// the bot at least once, returns the chat id so the user can paste it.
export async function testTelegramBot(_prev: string | undefined, formData: FormData) {
  const botToken = String(formData.get("bot_token") ?? "").trim();
  if (!botToken) return "Bot token wajib diisi.";

  try {
    const info = await callTelegramApi<BotInfo>("getMe", botToken);
    const username = info?.username ?? "bot";
    const updates = await callTelegramApi<UpdatesResult>("getUpdates", botToken);
    const candidate = updates?.result?.find((u) => u.message?.chat?.id)?.message?.chat?.id;
    if (candidate) return `@${username} terhubung. Chat ID terdeteksi: ${candidate} — pakai angka ini di kolom Chat ID.`;
    return `@${username} terhubung. Chat ID belum terdeteksi — kirim pesan apa saja ke bot dulu, lalu tes lagi.`;
  } catch (err) {
    return `Gagal: ${err instanceof Error ? err.message : "error"}`;
  }
}

// Send a test message to the saved chat to confirm end-to-end delivery.
export async function sendTelegramTestMessage() {
  const settings = await getTelegramSettings();
  if (!settings?.bot_token || !settings?.chat_id) {
    throw new Error("Simpan pengaturan bot dulu sebelum kirim pesan tes.");
  }
  try {
    await sendTelegramMessage(settings.chat_id, "Halo dari Menkeu! Bot Telegram siap dipakai. 📊");
  } catch (err) {
    throw new Error(`Gagal kirim pesan tes: ${err instanceof Error ? err.message : "error"}`);
  }
}

// Remove the saved bot credentials; the webhook is cleared too so Telegram
// stops delivering updates to this app.
export async function clearTelegramSettings() {
  const settings = await getTelegramSettings();
  if (settings?.bot_token) {
    try {
      await callTelegramApi("deleteWebhook", settings.bot_token);
    } catch (err) {
      console.error("deleteWebhook failed", err);
    }
  }
  const { error } = await supabaseAdmin().from("telegram_settings").upsert({
    id: true,
    bot_token: null,
    chat_id: null,
    webhook_url: null,
    webhook_secret: null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

