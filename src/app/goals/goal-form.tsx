"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Goal } from "@/lib/types";
import { createGoal, updateGoal } from "./actions";

export function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const action = goal ? updateGoal.bind(null, goal.id) : createGoal;
  const [error, formAction, pending] = useActionState(action, undefined);
  // Tracks pending across renders in an effect (not during render) so we can
  // close the modal only right after a real submit finishes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) onDone();
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, error]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Nama</label>
        <input
          name="name"
          required
          defaultValue={goal?.name}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Target (Rp)</label>
          <input
            name="target_amount"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={goal?.target_amount}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Prioritas</label>
          <select
            name="priority"
            defaultValue={goal?.priority ?? "medium"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Tenggat (opsional)</label>
        <input
          name="deadline"
          type="date"
          defaultValue={goal?.deadline ? goal.deadline.slice(0, 10) : ""}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Gambar URL</label>
        <input
          name="image_url"
          placeholder="https://... (opsional)"
          defaultValue={goal?.image_url ?? ""}
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
