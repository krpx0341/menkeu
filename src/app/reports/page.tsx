import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import IncomeExpenseBarChart, { type MonthlyTotal } from "@/components/reports/IncomeExpenseBarChart";
import CategoryPieChart, { type CategorySlice } from "@/components/reports/CategoryPieChart";

export const dynamic = "force-dynamic";

function parseMonth(input: string | undefined): string {
  if (input && /^\d{4}-\d{2}$/.test(input)) return `${input}-01`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function shiftMonth(month: string, delta: number): string {
  const d = new Date(`${month}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}T00:00:00Z`)
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = parseMonth(monthParam);
  const monthKey = month.slice(0, 7);
  const monthStart = new Date(`${month}T00:00:00Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const sixMonthsAgoStart = new Date(monthStart);
  sixMonthsAgoStart.setUTCMonth(sixMonthsAgoStart.getUTCMonth() - 5);

  const supabase = supabaseAdmin();

  const [{ data: categories }, { data: sixMonthTx }, { data: monthExpenseTx }] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase
      .from("transactions")
      .select("amount, type, occurred_at")
      .gte("occurred_at", sixMonthsAgoStart.toISOString())
      .lt("occurred_at", monthEnd.toISOString()),
    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("type", "expense")
      .gte("occurred_at", monthStart.toISOString())
      .lt("occurred_at", monthEnd.toISOString()),
  ]);

  const catById = new Map((categories as Category[] | null ?? []).map((c) => [c.id, c]));

  // Build 6-month buckets
  const buckets: MonthlyTotal[] = [];
  for (let i = 5; i >= 0; i--) {
    const bStart = new Date(monthStart);
    bStart.setUTCMonth(bStart.getUTCMonth() - i);
    const key = `${bStart.getUTCFullYear()}-${String(bStart.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({ month: key, label: monthLabel(key), income: 0, expense: 0 });
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.month, i]));
  for (const t of sixMonthTx ?? []) {
    const key = String(t.occurred_at).slice(0, 7);
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    if (t.type === "income") buckets[idx].income += Number(t.amount);
    else buckets[idx].expense += Number(t.amount);
  }

  // Pie: expense breakdown for selected month
  const spentByCategory = new Map<string, number>();
  for (const t of monthExpenseTx ?? []) {
    if (!t.category_id) continue;
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount));
  }
  const pieData: CategorySlice[] = [...spentByCategory.entries()]
    .map(([categoryId, value]) => {
      const cat = catById.get(categoryId);
      return { name: cat?.name ?? "Lainnya", value, color: cat?.color ?? "#64748b" };
    })
    .sort((a, b) => b.value - a.value);

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Laporan</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/reports?month=${prevMonth}`}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            &larr;
          </Link>
          <span className="min-w-[9rem] text-center text-sm text-neutral-300">{monthLabel(monthKey)}</span>
          <Link
            href={`/reports?month=${nextMonth}`}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            &rarr;
          </Link>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Pemasukan vs Pengeluaran (6 Bulan)</h2>
        <IncomeExpenseBarChart data={buckets} />
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">
          Rincian Pengeluaran — {monthLabel(monthKey)}
        </h2>
        <CategoryPieChart data={pieData} />
      </section>
    </div>
  );
}
