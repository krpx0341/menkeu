"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Category, Transaction, TxType } from "@/lib/types";
import { createTransaction, updateTransaction } from "./actions";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

// Formats a raw integer amount with thousand separators (5000 -> "5.000").
function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
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
  const [categoryId, setCategoryId] = useState(categoryStillValid ? transaction?.category_id ?? "" : "");
  // Remembers the last category picked per type, so toggling the type
  // select back and forth (an adjacent, easy-to-fat-finger control) doesn't
  // throw away what you already picked.
  const rememberedCategory = useRef<Partial<Record<TxType, string>>>({});

  function handleTypeChange(next: TxType) {
    rememberedCategory.current[type] = categoryId;
    setType(next);
    setCategoryId(rememberedCategory.current[next] ?? "");
  }

  // Display value keeps thousand separators while typing; the hidden input
  // carries the clean digits so the server receives a valid number.
  const [amountDisplay, setAmountDisplay] = useState(
    transaction ? formatAmount(String(transaction.amount)) : ""
  );
  const amountRaw = amountDisplay.replace(/\D/g, "");

  const [date, setDate] = useState(transaction ? transaction.occurred_at.slice(0, 10) : todayISODate());
  const [isRecurring, setIsRecurring] = useState(transaction?.is_recurring ?? false);
  // Editing an existing transaction shows everything up front; a brand-new
  // entry (the 90% "beli kopi 20rb" case) starts collapsed to just
  // amount+type+category, with note/date/recurring tucked away.
  const [moreOpen, setMoreOpen] = useState(
    Boolean(transaction && (transaction.note || transaction.is_recurring || date !== todayISODate()))
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Jumlah</label>
          <input
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(formatAmount(e.target.value))}
            inputMode="numeric"
            placeholder="0"
            required
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
          <input type="hidden" name="amount" value={amountRaw} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipe</label>
          <select
            name="type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as TxType)}
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
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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

      {/* Date always posts (defaults to today) even while the panel below is
          collapsed — only the visible editable field is hidden. */}
      {!moreOpen && <input type="hidden" name="occurred_at" value={date} />}

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        className="flex items-center gap-1 self-start text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {moreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Opsi lainnya (catatan, tanggal, berulang)
      </button>

      {moreOpen && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Catatan</label>
            <input
              name="note"
              defaultValue={transaction?.note ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tanggal</label>
            <input
              name="occurred_at"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="is_recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Transaksi berulang
            </label>
            {isRecurring && (
              <select
                name="recurring_interval"
                defaultValue={transaction?.recurring_interval ?? "monthly"}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            )}
          </div>
        </div>
      )}

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
