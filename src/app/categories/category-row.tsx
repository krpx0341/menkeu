"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Check, X } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import type { BudgetGroup, Category } from "@/lib/types";
import { renameCategory, setCategoryArchived } from "./actions";

const BUDGET_GROUP_LABEL: Record<BudgetGroup, string> = {
  needs: "Kebutuhan",
  wants: "Keinginan",
  savings: "Tabungan",
};

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup | null>(category.budget_group);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex flex-col gap-2 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Warna kategori"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          />
          <input
            aria-label="Nama kategori"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
          <input
            aria-label="Icon (lucide)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => {
              await renameCategory(category.id, name, color, icon, budgetGroup);
              setEditing(false);
            })}
            aria-label="Simpan"
            className="rounded-full p-2.5 text-emerald-600 hover:bg-emerald-50"
          >
            <Check size={16} />
          </button>
          <button onClick={() => setEditing(false)} aria-label="Batal" className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        {category.type === "expense" && (
          <select
            aria-label="Kelompok 50/30/20"
            value={budgetGroup ?? ""}
            onChange={(e) => setBudgetGroup((e.target.value || null) as BudgetGroup | null)}
            className="ml-11 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="">Belum dikelompokkan</option>
            <option value="needs">Kebutuhan (50%)</option>
            <option value="wants">Keinginan (30%)</option>
            <option value="savings">Tabungan (20%)</option>
          </select>
        )}
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-3 py-2.5 ${category.is_archived ? "opacity-50" : ""}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: category.color + "1f" }}
      >
        <CategoryIcon name={category.icon} size={16} color={category.color} />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{category.name}</span>
      {category.type === "expense" && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {category.budget_group ? BUDGET_GROUP_LABEL[category.budget_group] : "Belum dikelompokkan"}
        </span>
      )}
      {category.is_archived && <span className="text-xs text-slate-400">Arsip</span>}
      <button
        onClick={() => setEditing(true)}
        aria-label="Edit kategori"
        className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
      >
        <Pencil size={15} />
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setCategoryArchived(category.id, !category.is_archived))}
        className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        title={category.is_archived ? "Aktifkan" : "Arsipkan"}
        aria-label={category.is_archived ? "Aktifkan kategori" : "Arsipkan kategori"}
      >
        {category.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
      </button>
    </li>
  );
}
