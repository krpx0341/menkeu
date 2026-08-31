"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function saveGeminiSettings(_prev: string | undefined, formData: FormData) {
  const apiKey = String(formData.get("gemini_api_key") ?? "").trim();
  const model = String(formData.get("gemini_model") ?? "").trim();

  if (!apiKey) return "API key wajib diisi.";
  if (!model) return "Nama model wajib diisi.";

  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ id: true, gemini_api_key: apiKey, gemini_model: model, updated_at: new Date().toISOString() });
  if (error) return error.message;

  revalidatePath("/settings");
  return undefined;
}

export async function clearGeminiApiKey() {
  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ id: true, gemini_api_key: null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
