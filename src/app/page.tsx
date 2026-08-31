import { supabaseAdmin } from "@/lib/supabase/server";
import type { Budget, Category, Transaction } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import BalanceHero from "@/components/dashboard/BalanceHero";
import InsightCard from "@/components/dashboard/InsightCard";
import MonthComparisonCard from "@/components/dashboard/MonthComparisonCard";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import TransactionCalendar from "@/components/dashboard/TransactionCalendar";

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default async function DashboardPage() {
  const db = supabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: txs }, { data: categories }, { data: prevTxs }, { data: budgetRows }] = await Promise.all([
    db
      .from("transactions")
      .select("*")
      .gte("occurred_at", monthStart)
      .order("occurred_at", { ascending: false }),
    db.from("categories").select("*"),
    db
      .from("transactions")
      .select("*")
      .gte("occurred_at", prevMonthStart)
      .lt("occurred_at", monthStart),
    db.from("budgets").select("*").eq("month", monthValue),
  ]);

  const transactions = (txs ?? []) as Transaction[];
  const categoryMap = new Map((categories as Category[] | null ?? []).map((c) => [c.id, c]));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const prevTransactions = (prevTxs ?? []) as Transaction[];
  const prevTotalIncome = prevTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevTotalExpense = prevTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recent = transactions.slice(0, 10);

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = t.category_id ?? "uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }
  const breakdown = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({
      category: categoryMap.get(id),
      amount,
      pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }));

  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(now);
  const prevMonthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );

  // Financial health score: average of cash-flow health and budget-utilization
  // health (the latter only if budgets exist this month).
  const cashFlowScore =
    totalIncome > 0
      ? clamp(((totalIncome - totalExpense) / totalIncome) * 100, 0, 100)
      : totalExpense > 0
        ? 0
        : 100;

  const budgets = (budgetRows ?? []) as Budget[];
  let budgetScore: number | null = null;
  let budgetUtilizationPct: number | null = null;
  if (budgets.length > 0) {
    const utilizationPcts = budgets.map((b) => {
      const spent = byCategory.get(b.category_id) ?? 0;
      return b.amount_limit > 0 ? Math.min(spent / b.amount_limit, 1.5) * 100 : spent > 0 ? 150 : 0;
    });
    const categoryScores = utilizationPcts.map((u) => (u <= 80 ? 100 : clamp(100 - (u - 80) * 2, 0, 100)));
    budgetScore = categoryScores.reduce((s, x) => s + x, 0) / categoryScores.length;
    budgetUtilizationPct = utilizationPcts.reduce((s, x) => s + x, 0) / utilizationPcts.length;
  }

  const healthScore = budgetScore === null ? Math.round(cashFlowScore) : Math.round((cashFlowScore + budgetScore) / 2);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan {monthLabel}</p>
      </div>

      <BalanceHero net={net} totalIncome={totalIncome} totalExpense={totalExpense} />

      <InsightCard
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        topCategory={breakdown[0] ? { name: breakdown[0].category?.name ?? "Tanpa kategori", amount: breakdown[0].amount } : null}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthComparisonCard
          thisMonth={{ income: totalIncome, expense: totalExpense }}
          lastMonth={{ income: prevTotalIncome, expense: prevTotalExpense }}
          thisMonthLabel={monthLabel}
          lastMonthLabel={prevMonthLabel}
        />
        <HealthScoreCard
          score={healthScore}
          cashFlowScore={cashFlowScore}
          budgetScore={budgetScore}
          budgetUtilizationPct={budgetUtilizationPct}
        />
      </div>

      <TransactionCalendar
        transactions={transactions}
        categories={(categories as Category[] | null) ?? []}
        year={now.getFullYear()}
        month={now.getMonth()}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Transaksi Terbaru</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada transaksi bulan ini.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recent.map((t) => {
                const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: (cat?.color ?? "#94a3b8") + "1f" }}
                    >
                      <CategoryIcon name={cat?.icon ?? "circle"} size={16} color={cat?.color ?? "#64748b"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{cat?.name ?? "Tanpa kategori"}</p>
                      <p className="truncate text-xs text-slate-400">{t.note || formatDate(t.occurred_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
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
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Pengeluaran per Kategori</h2>
          {breakdown.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada pengeluaran bulan ini.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {breakdown.map(({ category, amount, pct }) => (
                <li key={category?.id ?? "uncategorized"}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{category?.name ?? "Tanpa kategori"}</span>
                    <span className="tabular-nums text-slate-400">{rupiah.format(amount)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: category?.color ?? "#2563eb" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
