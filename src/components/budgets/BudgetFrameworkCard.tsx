import { rupiah } from "@/lib/format";
import type { BudgetGroup } from "@/lib/types";

const BUCKETS: { key: BudgetGroup; label: string; pct: number; description: string; color: string; bar: string }[] = [
  {
    key: "needs",
    label: "Kebutuhan",
    pct: 0.5,
    description: "Makan, tempat tinggal, tagihan, transportasi",
    color: "text-blue-600",
    bar: "bg-blue-600",
  },
  {
    key: "wants",
    label: "Keinginan",
    pct: 0.3,
    description: "Hiburan, belanja, gaya hidup",
    color: "text-violet-600",
    bar: "bg-violet-600",
  },
  {
    key: "savings",
    label: "Tabungan & Investasi",
    pct: 0.2,
    description: "Menabung, investasi, bayar utang",
    color: "text-emerald-600",
    bar: "bg-emerald-600",
  },
];

export default function BudgetFrameworkCard({
  totalIncome,
  spentByGroup,
  uncategorizedSpent,
}: {
  totalIncome: number;
  spentByGroup: Record<BudgetGroup, number>;
  uncategorizedSpent: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Kerangka 50/30/20</h2>
          <p className="text-xs text-slate-500">Kebutuhan 50% · Keinginan 30% · Tabungan 20% dari pemasukan</p>
        </div>
      </div>

      {totalIncome <= 0 ? (
        <p className="text-sm text-slate-400">
          Belum ada pemasukan tercatat bulan ini, jadi target 50/30/20 belum bisa dihitung.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {BUCKETS.map((bucket) => {
            const target = totalIncome * bucket.pct;
            const spent = spentByGroup[bucket.key] ?? 0;
            const pctOfTarget = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
            const over = spent > target;

            return (
              <div key={bucket.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-medium ${bucket.color}`}>
                    {bucket.label} <span className="text-xs font-normal text-slate-400">({Math.round(bucket.pct * 100)}%)</span>
                  </span>
                  <span className="text-sm tabular-nums text-slate-500">
                    {rupiah.format(spent)} / {rupiah.format(target)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-red-500" : bucket.bar}`}
                    style={{ width: `${pctOfTarget}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{bucket.description}</p>
              </div>
            );
          })}

          {uncategorizedSpent > 0 && (
            <p className="text-xs text-slate-400">
              {rupiah.format(uncategorizedSpent)} dari pengeluaran bulan ini belum masuk kelompok manapun. Atur di
              halaman{" "}
              <a href="/categories" className="text-blue-600 hover:underline">
                Kategori
              </a>
              .
            </p>
          )}
        </div>
      )}
    </section>
  );
}
