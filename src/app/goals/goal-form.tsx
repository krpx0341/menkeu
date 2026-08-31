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
        <label className="mb-1 block text-xs text-neutral-400">Nama</label>
        <input
          name="name"
          required
          defaultValue={goal?.name}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Target (Rp)</label>
          <input
            name="target_amount"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={goal?.target_amount}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Prioritas</label>
          <select
            name="priority"
            defaultValue={goal?.priority ?? "medium"}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Tenggat (opsional)</label>
        <input
          name="deadline"
          type="date"
          defaultValue={goal?.deadline ? goal.deadline.slice(0, 10) : ""}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Gambar URL</label>
        <input
          name="image_url"
          placeholder="https://... (opsional)"
          defaultValue={goal?.image_url ?? ""}
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
