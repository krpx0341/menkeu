import { getReceiptSignedUrls, supabaseAdmin } from "@/lib/supabase/server";
import type { Category, Transaction } from "@/lib/types";
import { TransactionList } from "./transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Transaksi</h1>
          <p className="text-sm text-neutral-500">100 transaksi terbaru.</p>
        </div>
      </div>
      <TransactionList
        transactions={transactions}
        categories={(cats ?? []) as Category[]}
        receiptUrlByPath={receiptUrlByPath}
      />
    </div>
  );
}
