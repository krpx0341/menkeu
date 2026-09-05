"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Wallet, Landmark, Smartphone, TrendingUp, CircleDollarSign } from "lucide-react";
import type { Account, AccountType } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { deleteAccount } from "./actions";
import { AccountForm } from "./account-form";

const TYPE_LABELS: Record<AccountType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  investment: "Investasi",
  other: "Lainnya",
};

const TYPE_ICONS: Record<AccountType, typeof Wallet> = {
  cash: Wallet,
  bank: Landmark,
  ewallet: Smartphone,
  investment: TrendingUp,
  other: CircleDollarSign,
};

export function AccountCard({ account }: { account: Account }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const Icon = TYPE_ICONS[account.type];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          account.is_debt ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"
        }`}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{account.name}</p>
        <p className="text-xs text-slate-500">{TYPE_LABELS[account.type]}</p>
      </div>
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${account.is_debt ? "text-red-600" : "text-slate-900"}`}>
        {account.is_debt ? "-" : ""}
        {rupiah.format(account.balance)}
      </p>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => setEditOpen(true)}
          aria-label="Edit akun"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Hapus akun ini?")) startTransition(() => deleteAccount(account.id));
          }}
          aria-label="Hapus akun"
          className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:items-center md:justify-center md:p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Edit Akun</h2>
              <button
                onClick={() => setEditOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <AccountForm account={account} onDone={() => setEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
