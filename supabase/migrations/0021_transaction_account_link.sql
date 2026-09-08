-- Links transactions to accounts and keeps accounts.balance in sync via
-- trigger, so income/expense actually move the account balance instead of
-- it being a purely manual number (see AGENTS discussion: balance never
-- moved on transaction insert/update/delete before this).
--
-- account_id stays nullable: existing rows and any insert path that hasn't
-- picked an account (e.g. legacy data) simply don't affect any balance,
-- rather than failing. The web form makes it required at the UI level.

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

create index if not exists transactions_account_idx on public.transactions (account_id);

-- Default account used by Telegram/Advisor auto-inserted transactions,
-- which have no UI to pick an account per message.
alter table public.app_settings
  add column if not exists default_account_id uuid references public.accounts(id) on delete set null;

create or replace function public.apply_transaction_balance()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.account_id is not null then
      update public.accounts
      set balance = balance + (case when new.type = 'income' then new.amount else -new.amount end),
          updated_at = now()
      where id = new.account_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.account_id is not null then
      update public.accounts
      set balance = balance - (case when old.type = 'income' then old.amount else -old.amount end),
          updated_at = now()
      where id = old.account_id;
    end if;
    if new.account_id is not null then
      update public.accounts
      set balance = balance + (case when new.type = 'income' then new.amount else -new.amount end),
          updated_at = now()
      where id = new.account_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.account_id is not null then
      update public.accounts
      set balance = balance - (case when old.type = 'income' then old.amount else -old.amount end),
          updated_at = now()
      where id = old.account_id;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists transactions_balance_trigger on public.transactions;
create trigger transactions_balance_trigger
  after insert or update or delete on public.transactions
  for each row execute function public.apply_transaction_balance();
