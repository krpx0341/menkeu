import { supabaseAdmin } from "@/lib/supabase/server";
import type { Account } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { AccountList } from "./account-list";
import DebtPayoffCard from "@/components/accounts/DebtPayoffCard";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const db = supabaseAdmin();
  const now = new Date();
  const threeMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data }, { data: last3MonthsIncomeTxs }] = await Promise.all([
    db.from("accounts").select("*").order("created_at"),
    db
      .from("transactions")
      .select("amount")
      .eq("type", "income")
      .gte("occurred_at", threeMonthsAgoStart)
      .lt("occurred_at", thisMonthStart),
  ]);

  const accounts = (data ?? []) as Account[];
  const assetsTotal = accounts.filter((a) => !a.is_debt).reduce((s, a) => s + a.balance, 0);
  const debtsTotal = accounts.filter((a) => a.is_debt).reduce((s, a) => s + a.balance, 0);
  const netWorth = assetsTotal - debtsTotal;

  const debts = accounts.filter((a) => a.is_debt);
  const totalMinPayments = debts.reduce((s, a) => s + (a.min_payment ?? 0), 0);
  const avgMonthlyIncome = (last3MonthsIncomeTxs ?? []).reduce((s, t) => s + Number(t.amount), 0) / 3;
  const debtToIncome = avgMonthlyIncome > 0 ? (totalMinPayments / avgMonthlyIncome) * 100 : null;
  const dtiHigh = debtToIncome !== null && debtToIncome > 36; // common lender guideline

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Akun</h1>
        <p className="text-sm text-slate-500">Kelola saldo aset dan utangmu untuk melihat kekayaan bersih.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-slate-500">Kekayaan Bersih</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{rupiah.format(netWorth)}</p>
        <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Total Aset</p>
            <p className="font-medium tabular-nums text-slate-900">{rupiah.format(assetsTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Utang</p>
            <p className="font-medium tabular-nums text-red-600">{rupiah.format(debtsTotal)}</p>
          </div>
          {debtToIncome !== null && (
            <div>
              <p className="text-xs text-slate-500">Rasio Utang/Pemasukan</p>
              <p className={`font-medium tabular-nums ${dtiHigh ? "text-red-600" : "text-slate-900"}`}>
                {debtToIncome.toFixed(0)}%{dtiHigh ? " (tinggi)" : ""}
              </p>
            </div>
          )}
        </div>
      </section>

      {debts.length > 0 && <DebtPayoffCard debts={debts} />}

      <AccountList accounts={accounts} />
    </div>
  );
}
