"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/types";

const ACCOUNT_TYPES: AccountType[] = ["cash", "bank", "ewallet", "investment", "other"];

function parseForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as AccountType;
  const balance = Number(formData.get("balance"));
  const is_debt = formData.get("is_debt") === "on";
  const interest_rate_raw = String(formData.get("interest_rate") ?? "").trim();
  const min_payment_raw = String(formData.get("min_payment") ?? "").replace(/\D/g, "");

  if (!name) throw new Error("Nama akun wajib diisi.");
  if (!ACCOUNT_TYPES.includes(type)) throw new Error("Tipe akun tidak valid.");
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Saldo tidak valid.");

  let interest_rate: number | null = null;
  let min_payment: number | null = null;
  if (is_debt) {
    if (interest_rate_raw) {
      interest_rate = Number(interest_rate_raw);
      if (!Number.isFinite(interest_rate) || interest_rate < 0) throw new Error("Suku bunga tidak valid.");
    }
    if (min_payment_raw) {
      min_payment = Number(min_payment_raw);
      if (!Number.isFinite(min_payment) || min_payment < 0) throw new Error("Pembayaran minimum tidak valid.");
    }
  }

  return { name, type, balance, is_debt, interest_rate, min_payment };
}

export async function createAccount(_prev: string | undefined, formData: FormData) {
  try {
    const values = parseForm(formData);
    const { error } = await supabaseAdmin().from("accounts").insert(values);
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal menyimpan akun.";
  }
  revalidatePath("/accounts");
  revalidatePath("/");
  return undefined;
}

export async function updateAccount(id: string, _prev: string | undefined, formData: FormData) {
  try {
    const values = parseForm(formData);
    const { error } = await supabaseAdmin()
      .from("accounts")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return error.message;
  } catch (e) {
    return e instanceof Error ? e.message : "Gagal memperbarui akun.";
  }
  revalidatePath("/accounts");
  revalidatePath("/");
  return undefined;
}

export async function deleteAccount(id: string) {
  const { error } = await supabaseAdmin().from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
  revalidatePath("/");
}
