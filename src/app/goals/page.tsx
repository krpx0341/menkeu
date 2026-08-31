import { supabaseAdmin } from "@/lib/supabase/server";
import type { Goal } from "@/lib/types";
import { GoalList } from "./goal-list";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER: Record<Goal["priority"], number> = { high: 0, medium: 1, low: 2 };

export default async function GoalsPage() {
  const db = supabaseAdmin();
  const { data } = await db.from("goals").select("*").eq("is_archived", false);

  const goals = (data ?? []) as Goal[];
  goals.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Target</h1>
        <p className="text-sm text-slate-500">Rencana dan progres menabung untuk tujuanmu.</p>
      </div>
      <GoalList goals={goals} />
    </div>
  );
}
