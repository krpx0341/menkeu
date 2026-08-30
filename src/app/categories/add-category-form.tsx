"use client";

import { useActionState } from "react";
import { createCategory } from "./actions";

export function AddCategoryForm() {
  const [error, formAction, pending] = useActionState(createCategory, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:flex-row sm:items-end sm:gap-4"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs text-neutral-400">Nama</label>
        <input
          name="name"
          required
          placeholder="mis. Hobi"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Tipe</label>
        <select
          name="type"
          defaultValue="expense"
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        >
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Warna</label>
        <input
          type="color"
          name="color"
          defaultValue="#6366f1"
          className="h-[38px] w-14 rounded-lg border border-neutral-700 bg-neutral-800 p-1"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400">Icon (lucide)</label>
        <input
          name="icon"
          placeholder="circle"
          className="w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah"}
      </button>
      {error && <p className="text-sm text-red-400 sm:basis-full">{error}</p>}
    </form>
  );
}
