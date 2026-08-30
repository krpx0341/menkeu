"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { Category, Transaction } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { deleteTransaction } from "./actions";
import { TransactionForm } from "./transaction-form";

export function TransactionList({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const [modal, setModal] = useState<"add" | Transaction | null>(null);
  const [pending, startTransition] = useTransition();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setModal("add")}
        className="flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        <Plus size={16} /> Tambah Transaksi
      </button>

      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        {transactions.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">Belum ada transaksi.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-800">
            {transactions.map((t) => {
              const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: (cat?.color ?? "#525252") + "33" }}
                  >
                    <CategoryIcon name={cat?.icon ?? "circle"} size={16} color={cat?.color ?? "#a3a3a3"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-200">{cat?.name ?? "Tanpa kategori"}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {formatDate(t.occurred_at)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {rupiah.format(t.amount)}
                  </span>
                  <button
                    onClick={() => setModal(t)}
                    className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (confirm("Hapus transaksi ini?")) startTransition(() => deleteTransaction(t.id));
                    }}
                    className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">
                {modal === "add" ? "Tambah Transaksi" : "Edit Transaksi"}
              </h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800">
                <X size={18} />
              </button>
            </div>
            <TransactionForm
              categories={categories}
              transaction={modal === "add" ? undefined : modal}
              onDone={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
