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
  telegram_confirm_message_id: number | null;
  receipt_path: string | null;
  raw_input: string | null;
  created_at: string;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string; // YYYY-MM-01
  amount_limit: number;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  image_url: string | null;
  priority: "low" | "medium" | "high";
  deadline: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  gemini_api_key: string | null;
  gemini_api_key_real?: string | null; // Real Google Gemini API key for receipt OCR (separate from Vikey token)
  gemini_model: string;
  ai_provider: "gemini" | "openai";
  ai_base_url: string | null;
  updated_at: string;
};

export type TelegramSettings = {
  bot_token: string | null;
  chat_id: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  updated_at: string;
};

export type AdvisorResult =
  | {
      type: "transaction_preview";
      amount: number;
      txType: TxType;
      categoryId: string | null;
      categoryName: string;
      note: string;
      occurredAt: string | null; // ISO date, null = default to now on confirm
    }
  | { type: "answer"; text: string }
  | { type: "error"; message: string };
