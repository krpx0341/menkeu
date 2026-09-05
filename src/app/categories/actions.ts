"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BudgetGroup, TxType } from "@/lib/types";

function parseBudgetGroup(value: FormDataEntryValue | null): BudgetGroup | null {
  const v = String(value ?? "");
  return v === "needs" || v === "wants" || v === "savings" ? v : null;
}

export async function createCategory(_prev: string | undefined, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TxType;
  const color = String(formData.get("color") ?? "#6366f1");
  const icon = String(formData.get("icon") ?? "circle").trim() || "circle";
  const budgetGroup = type === "expense" ? parseBudgetGroup(formData.get("budget_group")) : null;

  if (!name) return "Nama wajib diisi.";
  if (type !== "income" && type !== "expense") return "Tipe tidak valid.";

  const { error } = await supabaseAdmin()
    .from("categories")
    .insert({ name, type, color, icon, budget_group: budgetGroup });
  if (error) return error.message;

  revalidatePath("/categories");
  revalidatePath("/budgets");
  return undefined;
}

export async function renameCategory(
  id: string,
  name: string,
  color: string,
  icon: string,
  budgetGroup: BudgetGroup | null
) {
  if (!name.trim()) throw new Error("Nama wajib diisi.");
  const { error } = await supabaseAdmin()
    .from("categories")
    .update({ name: name.trim(), color, icon: icon.trim() || "circle", budget_group: budgetGroup })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
  revalidatePath("/budgets");
}

export async function setCategoryArchived(id: string, archived: boolean) {
  const { error } = await supabaseAdmin().from("categories").update({ is_archived: archived }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}
