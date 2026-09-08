"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Account } from "@/lib/types";
import { saveDefaultAccount } from "./actions";

export function DefaultAccountForm({ accounts, defaultAccountId }: { accounts: Account[]; defaultAccountId: string | null }) {
  const [error, formAction, pending] = useActionState(saveDefaultAccount, undefined);
  const wasPending = useRef(false);
  useEffect(() => {
    wasPending.current = pending;
  }, [pending]);

  if (accounts.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Akun Default</h2>
        <p className="text-xs text-slate-400">
          Tambahkan akun dulu di halaman Akun, lalu pilih akun default di sini untuk transaksi via Telegram/AI Advisor.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Akun Default</h2>
      <p className="mb-3 text-xs text-slate-400">
        Dipakai untuk transaksi yang dicatat lewat bot Telegram atau AI Advisor (tidak ada UI pilih akun per pesan).
      </p>
      <form action={formAction} className="flex items-center gap-2">
        <select
          name="default_account_id"
          defaultValue={defaultAccountId ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
