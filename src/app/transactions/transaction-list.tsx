"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import type { Category, Transaction } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { deleteTransaction } from "./actions";
import { TransactionForm } from "./transaction-form";

export function TransactionList({
  transactions,
  categories,
  receiptUrlByPath,
  autoOpenAdd,
}: {
  transactions: Transaction[];
  categories: Category[];
  receiptUrlByPath: Record<string, string>;
  autoOpenAdd?: boolean;
}) {
  const [modal, setModal] = useState<"add" | Transaction | null>(autoOpenAdd ? "add" : null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setModal("add")}
        className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99]"
      >
        <Plus size={16} /> Tambah Transaksi
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {transactions.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Belum ada transaksi.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {transactions.map((t) => {
              const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 active:bg-slate-100">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: (cat?.color ?? "#94a3b8") + "1f" }}
                  >
                    <CategoryIcon name={cat?.icon ?? "circle"} size={16} color={cat?.color ?? "#64748b"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{cat?.name ?? "Tanpa kategori"}</p>
                    <p className="truncate text-xs text-slate-400">
                      {formatDate(t.occurred_at)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {rupiah.format(t.amount)}
                  </span>
                  {t.receipt_path && receiptUrlByPath[t.receipt_path] && (
                    <button
                      onClick={() => setReceiptPreview(receiptUrlByPath[t.receipt_path!])}
                      aria-label="Lihat struk"
                      className="shrink-0 rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ImageIcon size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setModal(t)}
                    aria-label="Edit transaksi"
                    className="shrink-0 rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (confirm("Hapus transaksi ini?")) startTransition(() => deleteTransaction(t.id));
                    }}
                    aria-label="Hapus transaksi"
                    className="shrink-0 rounded-full p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:items-center md:justify-center"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {modal === "add" ? "Tambah Transaksi" : "Edit Transaksi"}
              </h2>
              <button
                onClick={() => setModal(null)}
                aria-label="Tutup"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
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

      {receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setReceiptPreview(null)}
        >
          <div className="relative max-h-[85vh] max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setReceiptPreview(null)}
              aria-label="Tutup"
              className="absolute -top-10 right-0 rounded-full p-2.5 text-white/90 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL is short-lived, not a static asset next/image should cache/optimize */}
            <img
              src={receiptPreview}
              alt="Struk"
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
