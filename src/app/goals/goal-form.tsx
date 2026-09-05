"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Goal } from "@/lib/types";
import { createGoal, updateGoal } from "./actions";

export function GoalForm({
  goal,
  suggestedEmergencyTarget,
  onDone,
}: {
  goal?: Goal;
  suggestedEmergencyTarget?: number | null;
  onDone: () => void;
}) {
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

  const [goalType, setGoalType] = useState<Goal["goal_type"]>(goal?.goal_type ?? "discretionary");
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount ?? "");

  function handleTypeChange(next: Goal["goal_type"]) {
    setGoalType(next);
    // Pre-fill a sensible target (3 months of expense) for a brand-new
    // emergency-fund goal instead of leaving it blank.
    if (!goal && next === "emergency_fund" && !targetAmount && suggestedEmergencyTarget) {
      setTargetAmount(Math.round(suggestedEmergencyTarget));
    }
  }

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

      <div>
        <label className="mb-1 block text-xs text-slate-500">Tipe Goal</label>
        <select
          name="goal_type"
          value={goalType}
          onChange={(e) => handleTypeChange(e.target.value as Goal["goal_type"])}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="discretionary">Bebas (keinginan)</option>
          <option value="emergency_fund">Dana Darurat</option>
        </select>
        {goalType === "emergency_fund" && !!suggestedEmergencyTarget && (
          <p className="mt-1 text-xs text-slate-400">
            Saran target: 3x rata-rata pengeluaran bulanan.
          </p>
        )}
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
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))}
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
