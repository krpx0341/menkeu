"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

async function parseForm(formData: FormData) {
  const amount = Number(formData.get("amount"));
  const type = String(formData.get("type") ?? "") as TxType;
  const category_id = String(formData.get("category_id") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const occurred_at_raw = String(formData.get("occurred_at") ?? "");

  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Jumlah harus lebih dari 0.");
  if (type !== "income" && type !== "expense") throw new Error("Tipe tidak valid.");
  if (!occurred_at_raw) throw new Error("Tanggal wajib diisi.");

  if (category_id) {
    const { data: category, error } = await supabaseAdmin()
      .from("categories")
      .select("type")
      .eq("id", category_id)
      .single();
    if (error || !category) throw new Error("Kategori tidak ditemukan.");
    if (category.type !== type) throw new Error("Kategori tidak cocok dengan tipe transaksi.");
  }

  const occurred_at = new Date(occurred_at_raw).toISOString();

  return { amount, type, category_id, note, occurred_at };
}

export async function createTransaction(_prev: string | undefined, formData: FormData) {
  try {
    const values = await parseForm(formData);
    const { error } = await supabaseAdmin().from("transactions").insert({ ...values, source: "web" });
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal menyimpan transaksi.";
  }
  revalidatePath("/transactions");
  revalidatePath("/");
  return undefined;
}

export async function updateTransaction(id: string, _prev: string | undefined, formData: FormData) {
  try {
    const values = await parseForm(formData);
    const { error } = await supabaseAdmin().from("transactions").update(values).eq("id", id);
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal memperbarui transaksi.";
  }
  revalidatePath("/transactions");
  revalidatePath("/");
  return undefined;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabaseAdmin().from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transactions");
  revalidatePath("/");
}
