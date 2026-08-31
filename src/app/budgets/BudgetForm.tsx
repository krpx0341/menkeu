"use client";

import { useActionState } from "react";
import { upsertBudget } from "./actions";
import type { Category } from "@/lib/types";

export default function BudgetForm({
  categories,
  month,
}: {
  categories: Category[];
  month: string;
}) {
  const [state, formAction, pending] = useActionState(upsertBudget, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
    >
      <input type="hidden" name="month" value={month} />
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-500">Kategori</label>
        <select
          name="category_id"
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-500">Limit (Rp)</label>
        <input
          type="number"
          name="amount_limit"
          min="1"
          step="1"
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Budget"}
      </button>
      {state?.error && <p className="text-sm text-red-600 sm:ml-3">{state.error}</p>}
    </form>
  );
}
