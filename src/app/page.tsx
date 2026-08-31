import { supabaseAdmin } from "@/lib/supabase/server";
import type { Budget, Category, Transaction } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Dashboard</h1>
        <p className="text-sm text-neutral-500">Ringkasan {monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pemasukan" value={totalIncome} icon={ArrowUpRight} tone="text-emerald-400" />
        <StatCard label="Pengeluaran" value={totalExpense} icon={ArrowDownRight} tone="text-red-400" />
        <StatCard label="Saldo Bersih" value={net} icon={Wallet} tone={net >= 0 ? "text-emerald-400" : "text-red-400"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-300">Transaksi Terbaru</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada transaksi bulan ini.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-neutral-800">
              {recent.map((t) => {
                const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: (cat?.color ?? "#525252") + "33" }}
                    >
                      <CategoryIcon name={cat?.icon ?? "circle"} size={16} color={cat?.color ?? "#a3a3a3"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-neutral-200">{cat?.name ?? "Tanpa kategori"}</p>
                      <p className="truncate text-xs text-neutral-500">{t.note || formatDate(t.occurred_at)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-medium ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.type === "income" ? "+" : "-"}
                      {rupiah.format(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-300">Pengeluaran per Kategori</h2>
          {breakdown.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada pengeluaran bulan ini.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {breakdown.map(({ category, amount, pct }) => (
                <li key={category?.id ?? "uncategorized"}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-neutral-300">{category?.name ?? "Tanpa kategori"}</span>
                    <span className="text-neutral-500">{rupiah.format(amount)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: category?.color ?? "#6366f1" }}
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Wallet;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-neutral-400">{label}</span>
        <Icon size={18} className={tone} />
      </div>
      <p className={`text-2xl font-semibold ${tone}`}>{rupiah.format(value)}</p>
    </div>
  );
}
