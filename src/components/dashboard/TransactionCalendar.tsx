"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Transaction } from "@/lib/types";
import { compactRupiah, rupiah } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";

const DAY_LABELS = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

type DayEntry = { income: number; expense: number; items: Transaction[] };

export default function TransactionCalendar({
  transactions,
  categories,
  year,
  month,
}: {
  transactions: Transaction[];
  categories: Category[];
  year: number;
  month: number; // 0-indexed
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const byDay = useMemo(() => {
    const map = new Map<number, DayEntry>();
    for (const t of transactions) {
      const d = new Date(t.occurred_at);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const entry = map.get(day) ?? { income: 0, expense: 0, items: [] };
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
      entry.items.push(t);
      map.set(day, entry);
    }
    return map;
  }, [transactions, year, month]);

  const monthName = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedItems = selectedDay !== null ? (byDay.get(selectedDay)?.items ?? []) : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Kalender Transaksi</h2>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const entry = byDay.get(day);
          const hasTx = !!entry;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              disabled={!hasTx}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              aria-label={hasTx ? `Lihat transaksi ${day} ${monthName}` : undefined}
              className={`flex min-h-16 flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left text-[10px] leading-tight ${
                hasTx ? "cursor-pointer border-slate-200 hover:border-slate-300" : "border-transparent"
              } ${isSelected ? "border-blue-600 bg-blue-50" : "bg-slate-50"}`}
            >
              <span className="text-slate-500">{day}</span>
              {entry && entry.income > 0 && <span className="text-emerald-600">+{compactRupiah(entry.income)}</span>}
              {entry && entry.expense > 0 && <span className="text-red-600">-{compactRupiah(entry.expense)}</span>}
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-xs font-semibold text-slate-500">
            Transaksi {selectedDay} {monthName}
          </h3>
          <ul className="flex flex-col divide-y divide-slate-100">
            {selectedItems.map((t) => {
              const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: (cat?.color ?? "#94a3b8") + "1f" }}
                  >
                    <CategoryIcon name={cat?.icon ?? "circle"} size={14} color={cat?.color ?? "#64748b"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">{cat?.name ?? "Tanpa kategori"}</p>
                    {t.note && <p className="truncate text-xs text-slate-400">{t.note}</p>}
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {rupiah.format(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 text-right">
        <Link href="/transactions" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Lihat semua
        </Link>
      </div>
    </section>
  );
}
