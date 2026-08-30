"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

export type UpsertBudgetState = { error?: string } | undefined;

export async function upsertBudget(
  _prev: UpsertBudgetState,
  formData: FormData
): Promise<UpsertBudgetState> {
  const categoryId = String(formData.get("category_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const amountLimit = Number(formData.get("amount_limit"));

  if (!categoryId || !month) return { error: "Kategori dan bulan wajib diisi." };
  if (!Number.isFinite(amountLimit) || amountLimit <= 0) {
    return { error: "Jumlah limit harus lebih dari 0." };
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      { category_id: categoryId, month, amount_limit: amountLimit },
      { onConflict: "category_id,month" }
    );

  if (error) return { error: error.message };

  revalidatePath("/budgets");
  return undefined;
}
