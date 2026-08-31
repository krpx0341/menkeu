"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, X, Target as TargetIcon } from "lucide-react";
import type { Goal } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { addProgress, deleteGoal } from "./actions";
import { GoalForm } from "./goal-form";

const PRIORITY_LABEL: Record<Goal["priority"], string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

const PRIORITY_BADGE_CLASS: Record<Goal["priority"], string> = {
  low: "bg-neutral-800 text-neutral-300",
  medium: "bg-indigo-500/20 text-indigo-300",
  high: "bg-red-500/20 text-red-300",
};

const PRIORITY_BANNER_CLASS: Record<Goal["priority"], string> = {
  low: "bg-neutral-800",
  medium: "bg-indigo-500/10",
  high: "bg-red-500/10",
};

function daysBetween(fromISO: string, toISO: string) {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStatusBadge(goal: Goal): { label: string; className: string } | null {
  if (!goal.deadline) return null;

  const totalDays = daysBetween(goal.created_at, goal.deadline);
  const elapsedDays = daysBetween(goal.created_at, new Date().toISOString());
  const expectedPct = totalDays <= 0 ? 100 : clamp((elapsedDays / totalDays) * 100, 0, 100);
  const actualPct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  if (actualPct >= 100) return { label: "Tercapai", className: "bg-emerald-500/20 text-emerald-400" };
  if (actualPct >= expectedPct - 10) return { label: "On Track", className: "bg-emerald-500/20 text-emerald-400" };
  return { label: "Perlu Dikejar", className: "bg-amber-500/20 text-amber-400" };
}

export function GoalCard({ goal }: { goal: Goal }) {
  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [progressError, setProgressError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pct = goal.target_amount > 0 ? clamp((goal.current_amount / goal.target_amount) * 100, 0, 100) : 0;
  const statusBadge = getStatusBadge(goal);

  function handleAddProgress() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setProgressError("Jumlah harus lebih dari 0.");
      return;
    }
    setProgressError(null);
    startTransition(async () => {
      await addProgress(goal.id, value);
      setAmount("");
      setProgressOpen(false);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="relative">
        {goal.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied external URL, not a static/optimizable asset
          <img src={goal.image_url} alt={goal.name} className="h-32 w-full object-cover" />
        ) : (
          <div className={`flex h-32 w-full items-center justify-center ${PRIORITY_BANNER_CLASS[goal.priority]}`}>
            <TargetIcon size={32} className="text-neutral-500" />
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASS[goal.priority]}`}
        >
          {PRIORITY_LABEL[goal.priority]}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-100">{goal.name}</h3>
          {statusBadge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Terkumpul {rupiah.format(goal.current_amount)}</span>
            <span>Target {rupiah.format(goal.target_amount)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-neutral-500">{pct.toFixed(0)}%</p>
        </div>

        {progressOpen ? (
          <div className="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <label className="text-xs text-neutral-400">Jumlah progres (Rp)</label>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
            />
            {progressError && <p className="text-xs text-red-400">{progressError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProgressOpen(false);
                  setProgressError(null);
                  setAmount("");
                }}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleAddProgress}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setProgressOpen(true)}
            className="flex w-fit items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
          >
            <Plus size={14} /> Tambah Progres
          </button>
        )}

        <div className="flex items-center justify-end gap-1 border-t border-neutral-800 pt-3">
          <button
            onClick={() => setEditOpen(true)}
            aria-label="Edit goal"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          >
            <Pencil size={15} />
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Hapus goal ini?")) startTransition(() => deleteGoal(goal.id));
            }}
            aria-label="Hapus goal"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">Edit Goal</h2>
              <button
                onClick={() => setEditOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>
            <GoalForm goal={goal} onDone={() => setEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
