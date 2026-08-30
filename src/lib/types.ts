export type TxType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  type: TxType;
  color: string;
  icon: string;
  is_archived: boolean;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TxType;
  category_id: string | null;
  note: string | null;
  occurred_at: string;
  source: "web" | "telegram";
  telegram_message_id: number | null;
  receipt_url: string | null;
  raw_input: string | null;
  created_at: string;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string; // YYYY-MM-01
  amount_limit: number;
};
