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
      className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="month" value={month} />
      <div className="flex-1">
        <label className="mb-1 block text-xs text-neutral-400">Kategori</label>
        <select
          name="category_id"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-neutral-400">Limit (Rp)</label>
        <input
          type="number"
          name="amount_limit"
          min="1"
          step="1"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Budget"}
      </button>
      {state?.error && <p className="text-sm text-red-400 sm:ml-3">{state.error}</p>}
    </form>
  );
}
