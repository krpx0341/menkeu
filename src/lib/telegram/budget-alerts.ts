import { supabaseAdmin } from "@/lib/supabase/server";
import { getTelegramSettings } from "@/lib/telegram/settings";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import { rupiah } from "@/lib/format";

// Checks a category's budget utilization for the given month and, the first
// time it crosses 80% or 100%, pushes a Telegram warning. notified_80/100 on
// the budget row (unique per category+month) make this idempotent per month
// without needing a separate reset job.
export async function checkBudgetThreshold(categoryId: string, month: string): Promise<void> {
  const db = supabaseAdmin();

  const { data: budget } = await db
    .from("budgets")
    .select("id, amount_limit, notified_80, notified_100")
    .eq("category_id", categoryId)
    .eq("month", month)
    .maybeSingle();
  if (!budget || budget.amount_limit <= 0) return;
  if (budget.notified_80 && budget.notified_100) return;

  const chatId = (await getTelegramSettings())?.chat_id;
  if (!chatId) return;

  const monthStart = new Date(`${month}T00:00:00Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const [{ data: category }, { data: expenseTx }] = await Promise.all([
    db.from("categories").select("name").eq("id", categoryId).maybeSingle(),
    db
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .eq("category_id", categoryId)
      .gte("occurred_at", monthStart.toISOString())
      .lt("occurred_at", monthEnd.toISOString()),
  ]);

  const spent = (expenseTx ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const pct = (spent / budget.amount_limit) * 100;
  const categoryName = category?.name ?? "kategori ini";

  if (pct >= 100 && !budget.notified_100) {
    await sendTelegramMessage(
      chatId,
      `🚨 Anggaran ${categoryName} sudah ${Math.round(pct)}% terpakai (${rupiah.format(spent)} / ${rupiah.format(budget.amount_limit)}).`
    );
    await db.from("budgets").update({ notified_80: true, notified_100: true }).eq("id", budget.id);
  } else if (pct >= 80 && !budget.notified_80) {
    await sendTelegramMessage(
      chatId,
      `⚠️ Anggaran ${categoryName} sudah ${Math.round(pct)}% terpakai (${rupiah.format(spent)} / ${rupiah.format(budget.amount_limit)}).`
    );
    await db.from("budgets").update({ notified_80: true }).eq("id", budget.id);
  }
}
