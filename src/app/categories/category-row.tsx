"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Check, X } from "lucide-react";
import { CategoryIcon } from "@/lib/icons";
import type { Category } from "@/lib/types";
import { renameCategory, setCategoryArchived } from "./actions";

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-2.5">
        <input
          type="color"
          aria-label="Warna kategori"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 rounded border border-neutral-700 bg-neutral-800 p-0.5"
        />
        <input
          aria-label="Nama kategori"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
        <input
          aria-label="Icon (lucide)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-indigo-500"
        />
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            await renameCategory(category.id, name, color, icon);
            setEditing(false);
          })}
          aria-label="Simpan"
          className="rounded-md p-1.5 text-emerald-400 hover:bg-neutral-800"
        >
          <Check size={16} />
        </button>
        <button onClick={() => setEditing(false)} aria-label="Batal" className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800">
          <X size={16} />
        </button>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-3 py-2.5 ${category.is_archived ? "opacity-50" : ""}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: category.color + "33" }}
      >
        <CategoryIcon name={category.icon} size={16} color={category.color} />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{category.name}</span>
      {category.is_archived && <span className="text-xs text-neutral-500">Arsip</span>}
      <button
        onClick={() => setEditing(true)}
        aria-label="Edit kategori"
        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
      >
        <Pencil size={15} />
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setCategoryArchived(category.id, !category.is_archived))}
        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
        title={category.is_archived ? "Aktifkan" : "Arsipkan"}
        aria-label={category.is_archived ? "Aktifkan kategori" : "Arsipkan kategori"}
      >
        {category.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
      </button>
    </li>
  );
}
