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
          <label className="mb-1 block text-xs text-neutral-400">Jumlah</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={transaction?.amount}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Tipe</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TxType)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Kategori</label>
        <select
          name="category_id"
          defaultValue={categoryStillValid ? transaction?.category_id ?? "" : ""}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
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
        <label className="mb-1 block text-xs text-neutral-400">Catatan</label>
        <input
          name="note"
          defaultValue={transaction?.note ?? ""}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Tanggal</label>
        <input
          name="occurred_at"
          type="date"
          required
          defaultValue={transaction ? transaction.occurred_at.slice(0, 10) : todayISODate()}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
