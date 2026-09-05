import { supabaseAdmin } from "@/lib/supabase/server";
import type { Goal } from "@/lib/types";
import { GoalList } from "./goal-list";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER: Record<Goal["priority"], number> = { high: 0, medium: 1, low: 2 };

export default async function GoalsPage() {
  const db = supabaseAdmin();
  const now = new Date();
  const threeMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data }, { data: last3MonthsExpenseTxs }] = await Promise.all([
    db.from("goals").select("*").eq("is_archived", false),
    db
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .gte("occurred_at", threeMonthsAgoStart)
      .lt("occurred_at", thisMonthStart),
  ]);

  const goals = (data ?? []) as Goal[];
  // Essential (emergency fund) goals surface first regardless of priority —
  // that distinction matters more than the manually-set priority field.
  goals.sort((a, b) => {
    if (a.goal_type !== b.goal_type) return a.goal_type === "emergency_fund" ? -1 : 1;
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const avgMonthlyExpense = (last3MonthsExpenseTxs ?? []).reduce((s, t) => s + Number(t.amount), 0) / 3;
  const suggestedEmergencyTarget = avgMonthlyExpense > 0 ? avgMonthlyExpense * 3 : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Target</h1>
        <p className="text-sm text-slate-500">Rencana dan progres menabung untuk tujuanmu.</p>
      </div>
      <GoalList goals={goals} suggestedEmergencyTarget={suggestedEmergencyTarget} />
    </div>
  );
}
