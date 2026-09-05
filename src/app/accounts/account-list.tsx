"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Account } from "@/lib/types";
import { AccountCard } from "./account-card";
import { AccountForm } from "./account-form";

export function AccountList({ accounts }: { accounts: Account[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const assets = accounts.filter((a) => !a.is_debt);
  const debts = accounts.filter((a) => a.is_debt);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setAddOpen(true)}
        className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99]"
      >
        <Plus size={16} /> Tambah Akun
      </button>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Belum ada akun. Tambahkan rekening, dompet, atau utangmu.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Aset</h2>
            {assets.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada aset.</p>
            ) : (
              assets.map((a) => <AccountCard key={a.id} account={a} />)
            )}
          </div>

          {debts.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Utang</h2>
              {debts.map((a) => (
                <AccountCard key={a.id} account={a} />
              ))}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:items-center md:justify-center md:p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Tambah Akun</h2>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <AccountForm onDone={() => setAddOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
