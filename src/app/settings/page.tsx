import { supabaseAdmin } from "@/lib/supabase/server";
import type { AppSettings, TelegramSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";
import { TelegramSettingsForm } from "./telegram-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [{ data }, { data: tg }] = await Promise.all([
    supabaseAdmin().from("app_settings").select("*").eq("id", true).maybeSingle(),
    supabaseAdmin().from("telegram_settings").select("*").eq("id", true).maybeSingle(),
  ]);
  const settings = data as AppSettings | null;
  const tgSettings = tg as TelegramSettings | null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Pengaturan</h1>
        <p className="text-sm text-slate-500">Kelola API key AI Advisor dan bot Telegram.</p>
      </div>
      <SettingsForm
        hasKey={!!settings?.gemini_api_key}
        hasGeminiOcrKey={!!settings?.gemini_api_key_real}
        model={settings?.gemini_model ?? "gemini-2.5-flash"}
        provider={settings?.ai_provider ?? "gemini"}
        baseUrl={settings?.ai_base_url ?? ""}
      />
      <TelegramSettingsForm
        hasToken={!!tgSettings?.bot_token}
        chatId={tgSettings?.chat_id ?? ""}
        webhookUrl={tgSettings?.webhook_url ?? ""}
      />
    </div>
  );
}
