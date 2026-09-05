import { Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Account, Budget, Category, RecurringInterval, Transaction } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import BalanceHero from "@/components/dashboard/BalanceHero";
import InsightCard from "@/components/dashboard/InsightCard";
import MonthComparisonCard from "@/components/dashboard/MonthComparisonCard";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import TransactionCalendar from "@/components/dashboard/TransactionCalendar";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import UpcomingBillsCard, { type UpcomingBill } from "@/components/dashboard/UpcomingBillsCard";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

function addInterval(iso: string, interval: RecurringInterval): string {
  const d = new Date(iso);
  if (interval === "weekly") d.setDate(d.getDate() + 7);
  else if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default async function DashboardPage() {
  const db = supabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const threeMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: txs },
    { data: categories },
    { data: prevTxs },
    { data: budgetRows },
    { data: accountRows },
    { data: recurringTxs },
    { data: last3MonthsExpenseTxs },
    { count: allTimeTransactionCount },
    { count: allTimeBudgetCount },
  ] = await Promise.all([
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
    db.from("accounts").select("*"),
    db
      .from("transactions")
      .select("id, amount, category_id, note, occurred_at, recurring_interval")
      .eq("is_recurring", true)
      .order("occurred_at", { ascending: false }),
    db
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .gte("occurred_at", threeMonthsAgoStart)
      .lt("occurred_at", monthStart),
    db.from("transactions").select("id", { count: "exact", head: true }),
    db.from("budgets").select("id", { count: "exact", head: true }),
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
  // cashFlowScore maps savings rate to score so a 20%+ savings rate (standard
  // budgeting benchmark) scores 100, breakeven scores 50 ("adequate", not
  // "terrible"), and overspending by 20%+ scores 0.
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : null;
  const cashFlowScore =
    savingsRate === null ? (totalExpense > 0 ? 0 : 100) : clamp(50 + savingsRate * 250, 0, 100);

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

  // Net worth: assets minus debts across manually-tracked accounts.
  const accounts = (accountRows ?? []) as Account[];
  const assetsTotal = accounts.filter((a) => !a.is_debt).reduce((s, a) => s + a.balance, 0);
  const debtsTotal = accounts.filter((a) => a.is_debt).reduce((s, a) => s + a.balance, 0);
  const netWorth = assetsTotal - debtsTotal;

  // Emergency fund: liquid savings (cash/bank/e-wallet, non-debt) divided by
  // the average monthly expense over the last 3 full months.
  const liquidSavings = accounts
    .filter((a) => !a.is_debt && (a.type === "cash" || a.type === "bank" || a.type === "ewallet"))
    .reduce((s, a) => s + a.balance, 0);
  const last3MonthsExpenseTotal = (last3MonthsExpenseTxs ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const avgMonthlyExpense = last3MonthsExpenseTotal / 3;
  const emergencyFundMonths = avgMonthlyExpense > 0 ? liquidSavings / avgMonthlyExpense : null;

  // Upcoming recurring bills: group recurring transactions by (category, note)
  // keeping the latest occurrence as that bill's template, then project its
  // next due date. If this month's occurrence was already logged, it becomes
  // the template itself and its next due date rolls into next month —
  // naturally dropping it from this month's "upcoming" list.
  const recurringTemplates = new Map<
    string,
    { id: string; label: string; amount: number; occurred_at: string; interval: RecurringInterval }
  >();
  for (const t of recurringTxs ?? []) {
    if (!t.recurring_interval) continue;
    const key = `${t.category_id ?? "none"}::${t.note ?? ""}`;
    const existing = recurringTemplates.get(key);
    if (!existing || t.occurred_at > existing.occurred_at) {
      const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
      recurringTemplates.set(key, {
        id: t.id,
        label: t.note || cat?.name || "Tagihan",
        amount: Number(t.amount),
        occurred_at: t.occurred_at,
        interval: t.recurring_interval as RecurringInterval,
      });
    }
  }
  const upcomingBills: UpcomingBill[] = [...recurringTemplates.values()]
    .map((tpl) => {
      let nextDue = tpl.occurred_at;
      while (nextDue < now.toISOString()) nextDue = addInterval(nextDue, tpl.interval);
      return { id: tpl.id, label: tpl.label, amount: tpl.amount, nextDue };
    })
    .filter((b) => b.nextDue >= monthStart && b.nextDue < monthEnd)
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue));
  const totalUpcomingBills = upcomingBills.reduce((s, b) => s + b.amount, 0);
  const safeToSpend = net - totalUpcomingBills;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan {monthLabel}</p>
      </div>

      <OnboardingChecklist
        hasAccount={accounts.length > 0}
        hasTransaction={(allTimeTransactionCount ?? 0) > 0}
        hasBudget={(allTimeBudgetCount ?? 0) > 0}
      />

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NetWorthCard
          netWorth={netWorth}
          assetsTotal={assetsTotal}
          debtsTotal={debtsTotal}
          emergencyFundMonths={emergencyFundMonths}
        />
        <UpcomingBillsCard bills={upcomingBills} safeToSpend={safeToSpend} />
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
                      {t.source === "advisor" && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                          <Sparkles size={9} /> via AI Advisor
                        </span>
                      )}
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
