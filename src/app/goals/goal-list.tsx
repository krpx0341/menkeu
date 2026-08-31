"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Goal } from "@/lib/types";
import { GoalCard } from "./goal-card";
import { GoalForm } from "./goal-form";

export function GoalList({ goals }: { goals: Goal[] }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setAddOpen(true)}
        className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99]"
      >
        <Plus size={16} /> Tambah Goal
      </button>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Belum ada goal. Tambahkan target menabungmu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:items-center md:justify-center md:p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-md md:rounded-3xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Tambah Goal</h2>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <GoalForm onDone={() => setAddOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
