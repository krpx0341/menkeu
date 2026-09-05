"use client";

import { useActionState, useState } from "react";
import { createCategory } from "./actions";
import type { TxType } from "@/lib/types";

export function AddCategoryForm() {
  const [error, formAction, pending] = useActionState(createCategory, undefined);
  const [type, setType] = useState<TxType>("expense");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:gap-4"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-500">Nama</label>
        <input
          name="name"
          required
          placeholder="mis. Hobi"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tipe</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
      </div>
      {type === "expense" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Kelompok 50/30/20</label>
          <select
            name="budget_group"
            defaultValue=""
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="">Belum dikelompokkan</option>
            <option value="needs">Kebutuhan (50%)</option>
            <option value="wants">Keinginan (30%)</option>
            <option value="savings">Tabungan (20%)</option>
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Warna</label>
        <input
          type="color"
          name="color"
          defaultValue="#6366f1"
          className="h-[42px] w-14 rounded-xl border border-slate-200 bg-slate-50 p-1"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Icon (lucide)</label>
        <input
          name="icon"
          placeholder="circle"
          className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah"}
      </button>
      {error && <p className="text-sm text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
