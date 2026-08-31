import { supabaseAdmin } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data } = await supabaseAdmin().from("app_settings").select("*").eq("id", true).maybeSingle();
  const settings = data as AppSettings | null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Pengaturan</h1>
        <p className="text-sm text-neutral-500">Kelola API key AI Advisor.</p>
      </div>
      <SettingsForm
        hasKey={!!settings?.gemini_api_key}
        model={settings?.gemini_model ?? "gemini-2.5-flash"}
      />
    </div>
  );
}
