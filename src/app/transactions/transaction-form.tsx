"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Category, Transaction, TxType } from "@/lib/types";
import { createTransaction, updateTransaction } from "./actions";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: Transaction;
  onDone: () => void;
}) {
  const action = transaction ? updateTransaction.bind(null, transaction.id) : createTransaction;
  const [error, formAction, pending] = useActionState(action, undefined);
  // Tracks pending across renders in an effect (not during render) so we can
  // close the modal only right after a real submit finishes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) onDone();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, error]);

  const defaultType: TxType = transaction?.type ?? "expense";
  const [type, setType] = useState<TxType>(defaultType);
  const availableCategories = categories.filter((c) => !c.is_archived && c.type === type);
  const categoryStillValid =
    transaction?.category_id && availableCategories.some((c) => c.id === transaction.category_id);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Jumlah</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={transaction?.amount}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipe</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TxType)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Kategori</label>
        <select
          name="category_id"
          defaultValue={categoryStillValid ? transaction?.category_id ?? "" : ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="">Tanpa kategori</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
        <input
          name="note"
          defaultValue={transaction?.note ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tanggal</label>
        <input
          name="occurred_at"
          type="date"
          required
          defaultValue={transaction ? transaction.occurred_at.slice(0, 10) : todayISODate()}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
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
