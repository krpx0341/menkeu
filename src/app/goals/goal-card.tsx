"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, X, Target as TargetIcon, ShieldAlert } from "lucide-react";
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
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-red-50 text-red-600",
};

const PRIORITY_BANNER_CLASS: Record<Goal["priority"], string> = {
  low: "bg-slate-100",
  medium: "bg-blue-50",
  high: "bg-red-50",
};

const PRIORITY_ICON_CLASS: Record<Goal["priority"], string> = {
  low: "text-slate-400",
  medium: "text-blue-300",
  high: "text-red-300",
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

  if (actualPct >= 100) return { label: "Tercapai", className: "bg-emerald-50 text-emerald-600" };
  if (actualPct >= expectedPct - 10) return { label: "On Track", className: "bg-emerald-50 text-emerald-600" };
  return { label: "Perlu Dikejar", className: "bg-amber-50 text-amber-600" };
}

export function GoalCard({
  goal,
  suggestedEmergencyTarget,
}: {
  goal: Goal;
  suggestedEmergencyTarget?: number | null;
}) {
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        {goal.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied external URL, not a static/optimizable asset
          <img src={goal.image_url} alt={goal.name} className="h-32 w-full object-cover" />
        ) : (
          <div className={`flex h-32 w-full items-center justify-center ${PRIORITY_BANNER_CLASS[goal.priority]}`}>
            <TargetIcon size={32} className={PRIORITY_ICON_CLASS[goal.priority]} />
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASS[goal.priority]}`}
        >
          {PRIORITY_LABEL[goal.priority]}
        </span>
        {goal.goal_type === "emergency_fund" && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
            <ShieldAlert size={12} /> Dana Darurat
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{goal.name}</h3>
          {statusBadge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">Terkumpul {rupiah.format(goal.current_amount)}</span>
            <span className="tabular-nums">Target {rupiah.format(goal.target_amount)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs tabular-nums text-slate-400">{pct.toFixed(0)}%</p>
        </div>

        {progressOpen ? (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="text-xs text-slate-500">Jumlah progres (Rp)</label>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
            {progressError && <p className="text-xs text-red-600">{progressError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProgressOpen(false);
                  setProgressError(null);
                  setAmount("");
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleAddProgress}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
              >
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setProgressOpen(true)}
            className="flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
          >
            <Plus size={14} /> Tambah Progres
          </button>
        )}

        <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
          <button
            onClick={() => setEditOpen(true)}
            aria-label="Edit goal"
            className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={15} />
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Hapus goal ini?")) startTransition(() => deleteGoal(goal.id));
            }}
            aria-label="Hapus goal"
            className="rounded-full p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:items-center md:justify-center md:p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Edit Goal</h2>
              <button
                onClick={() => setEditOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <GoalForm goal={goal} suggestedEmergencyTarget={suggestedEmergencyTarget} onDone={() => setEditOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
