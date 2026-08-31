import { supabaseAdmin } from "@/lib/supabase/server";
import type { Budget, Category } from "@/lib/types";
import BudgetForm from "./BudgetForm";

export const dynamic = "force-dynamic";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function BudgetsPage() {
  const month = currentMonth();
  const monthStart = new Date(`${month}T00:00:00Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const supabase = supabaseAdmin();

  const [{ data: categories }, { data: budgets }, { data: transactions }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("budgets").select("*").eq("month", month),
    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("type", "expense")
      .gte("occurred_at", monthStart.toISOString())
      .lt("occurred_at", monthEnd.toISOString()),
  ]);

  const cats = (categories ?? []) as Category[];
  const budgetByCategory = new Map((budgets as Budget[] | null ?? []).map((b) => [b.category_id, b]));
  const spentByCategory = new Map<string, number>();
  for (const t of transactions ?? []) {
    if (!t.category_id) continue;
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Budget Bulan Ini</h1>
        <p className="text-sm text-slate-500">
          {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(monthStart)}
        </p>
      </div>

      <BudgetForm categories={cats} month={month} />

      <div className="flex flex-col gap-3">
        {cats.map((cat) => {
          const budget = budgetByCategory.get(cat.id);
          const spent = spentByCategory.get(cat.id) ?? 0;
          const limit = budget?.amount_limit ?? 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const over90 = limit > 0 && spent / limit >= 0.9;

          return (
            <div key={cat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {formatIDR(spent)} {limit > 0 ? `/ ${formatIDR(limit)}` : "(belum ada budget)"}
                </span>
              </div>
              {limit > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${over90 ? "bg-red-500" : "bg-blue-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
        {cats.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada kategori pengeluaran.</p>
        )}
      </div>
    </div>
  );
}
