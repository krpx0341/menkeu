"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Account, AccountType } from "@/lib/types";
import { createAccount, updateAccount } from "./actions";

const TYPE_LABELS: Record<AccountType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  investment: "Investasi",
  other: "Lainnya",
};

// Formats a raw integer amount with thousand separators (5000 -> "5.000").
function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export function AccountForm({ account, onDone }: { account?: Account; onDone: () => void }) {
  const action = account ? updateAccount.bind(null, account.id) : createAccount;
  const [error, formAction, pending] = useActionState(action, undefined);
  // Tracks pending across renders in an effect (not during render) so we can
  // close the modal only right after a real submit finishes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) onDone();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, error]);

  const [balanceDisplay, setBalanceDisplay] = useState(
    account ? formatAmount(String(account.balance)) : ""
  );
  const balanceRaw = balanceDisplay.replace(/\D/g, "");

  const [isDebt, setIsDebt] = useState(account?.is_debt ?? false);
  const [minPaymentDisplay, setMinPaymentDisplay] = useState(
    account?.min_payment ? formatAmount(String(account.min_payment)) : ""
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Nama Akun</label>
        <input
          name="name"
          required
          defaultValue={account?.name}
          placeholder="mis. BCA, Dompet, GoPay"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Tipe</label>
          <select
            name="type"
            defaultValue={account?.type ?? "bank"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Saldo (Rp)</label>
          <input
            value={balanceDisplay}
            onChange={(e) => setBalanceDisplay(formatAmount(e.target.value))}
            inputMode="numeric"
            placeholder="0"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
          <input type="hidden" name="balance" value={balanceRaw} />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="is_debt"
            checked={isDebt}
            onChange={(e) => setIsDebt(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Ini utang/pinjaman (mengurangi kekayaan bersih)
        </label>

        {isDebt && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Suku Bunga (%/tahun)</label>
              <input
                name="interest_rate"
                type="number"
                min="0"
                step="0.1"
                defaultValue={account?.interest_rate ?? ""}
                placeholder="mis. 24"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Cicilan Min. (Rp)</label>
              <input
                value={minPaymentDisplay}
                onChange={(e) => setMinPaymentDisplay(formatAmount(e.target.value))}
                inputMode="numeric"
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
              <input type="hidden" name="min_payment" value={minPaymentDisplay.replace(/\D/g, "")} />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
