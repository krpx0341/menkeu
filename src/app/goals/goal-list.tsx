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
        className="flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        <Plus size={16} /> Tambah Goal
      </button>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Belum ada goal. Tambahkan target menabungmu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">Tambah Goal</h2>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800"
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
