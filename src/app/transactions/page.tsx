import { getReceiptSignedUrls, supabaseAdmin } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/types";
import { TransactionList } from "./transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: autoOpenNew } = await searchParams;
  const db = supabaseAdmin();
  const [{ data: txs }, { data: cats }] = await Promise.all([
    db.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(100),
    db.from("categories").select("*").order("name"),
  ]);

  const transactions = (txs ?? []) as Transaction[];
  const receiptPaths = transactions.map((t) => t.receipt_path).filter((p): p is string => !!p);
  const receiptUrlByPath = await getReceiptSignedUrls(receiptPaths);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Transaksi</h1>
        <p className="text-sm text-slate-500">100 transaksi terbaru.</p>
      </div>
      <TransactionList
        transactions={transactions}
        categories={(cats ?? []) as Category[]}
        receiptUrlByPath={receiptUrlByPath}
        autoOpenAdd={autoOpenNew === "1"}
      />
    </div>
  );
}
