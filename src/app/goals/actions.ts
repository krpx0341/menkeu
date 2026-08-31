"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Goal } from "@/lib/types";

function parseForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const target_amount = Number(formData.get("target_amount"));
  const priority = String(formData.get("priority") ?? "") as Goal["priority"];
  const deadline_raw = String(formData.get("deadline") ?? "").trim();
  const image_url_raw = String(formData.get("image_url") ?? "").trim();

  if (!name) throw new Error("Nama goal wajib diisi.");
  if (!Number.isFinite(target_amount) || target_amount <= 0) {
    throw new Error("Target harus lebih dari 0.");
  }
  if (priority !== "low" && priority !== "medium" && priority !== "high") {
    throw new Error("Prioritas tidak valid.");
  }

  const deadline = deadline_raw || null;
  const image_url = image_url_raw || null;

  return { name, target_amount, priority, deadline, image_url };
}

export async function createGoal(_prev: string | undefined, formData: FormData) {
  try {
    const values = parseForm(formData);
    const { error } = await supabaseAdmin()
      .from("goals")
      .insert({ ...values, current_amount: 0 });
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal menyimpan goal.";
  }
  revalidatePath("/goals");
  return undefined;
}

export async function updateGoal(id: string, _prev: string | undefined, formData: FormData) {
  try {
    const values = parseForm(formData);
    const { error } = await supabaseAdmin()
      .from("goals")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal memperbarui goal.";
  }
  revalidatePath("/goals");
  return undefined;
}

export async function addProgress(id: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Jumlah progres harus lebih dari 0.");
  }
  const { data: goal, error: fetchError } = await supabaseAdmin()
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (fetchError || !goal) throw new Error(fetchError?.message ?? "Goal tidak ditemukan.");

  const { error } = await supabaseAdmin()
    .from("goals")
    .update({
      current_amount: Number(goal.current_amount) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const { error } = await supabaseAdmin().from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}
