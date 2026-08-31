"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { rupiah } from "@/lib/format";

type MonthTotals = { income: number; expense: number };
type Tab = "income" | "expense";

export default function MonthComparisonCard({
  thisMonth,
  lastMonth,
  thisMonthLabel,
  lastMonthLabel,
}: {
  thisMonth: MonthTotals;
  lastMonth: MonthTotals;
  thisMonthLabel: string;
  lastMonthLabel: string;
}) {
  const [tab, setTab] = useState<Tab>("income");

  const thisVal = tab === "income" ? thisMonth.income : thisMonth.expense;
  const lastVal = tab === "income" ? lastMonth.income : lastMonth.expense;

  const change = lastVal === 0 ? (thisVal === 0 ? null : Infinity) : ((thisVal - lastVal) / lastVal) * 100;

  // Income going up is good; expense going up is bad — flip per tab.
  const isImprovement =
    change === null ? null : change === Infinity ? tab === "income" : tab === "income" ? change > 0 : change < 0;

  const label = tab === "income" ? "Pemasukan" : "Pengeluaran";
  const maxVal = Math.max(thisVal, lastVal, 1);
  const thisBarPct = (thisVal / maxVal) * 100;
  const lastBarPct = (lastVal / maxVal) * 100;

  let sentence: string;
  if (change === null) {
    sentence = "Belum ada data untuk dibandingkan.";
  } else if (change === Infinity) {
    sentence = "Belum ada transaksi bulan lalu untuk dibandingkan.";
  } else if (change === 0) {
    sentence = `${label} tidak berubah dibanding bulan lalu.`;
  } else {
    sentence = `${label} ${change > 0 ? "naik" : "turun"} ${Math.abs(Math.round(change))}% dibanding bulan lalu.`;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Perbandingan Bulanan</h2>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["income", "expense"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-start justify-between text-xs text-slate-400">
        <span>{thisMonthLabel}</span>
        <span>{lastMonthLabel}</span>
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{rupiah.format(thisVal)}</span>
          {change !== null && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isImprovement ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              {isImprovement ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change === Infinity ? "Baru" : `${Math.round(change) >= 0 ? "+" : ""}${Math.round(change)}%`}
            </span>
          )}
        </div>
        <span className="text-sm tabular-nums text-slate-400">{rupiah.format(lastVal)}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${tab === "income" ? "bg-emerald-500" : "bg-red-500"}`}
            style={{ width: `${thisBarPct}%` }}
          />
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-300" style={{ width: `${lastBarPct}%` }} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{sentence}</p>
    </section>
  );
}
