-- 50/30/20 framework: classify expense categories into needs / wants / savings
-- buckets so spending can be checked against the 50/30/20 rule of thumb.

alter table public.categories
  add column if not exists budget_group text
  check (budget_group in ('needs', 'wants', 'savings'));

comment on column public.categories.budget_group is
  '50/30/20 bucket for expense categories: needs, wants, or savings. Null = uncategorized (typically income categories).';

-- Sensible defaults for the seeded expense categories.
update public.categories set budget_group = 'needs' where name in ('Makanan', 'Transportasi', 'Tagihan', 'Kesehatan');
update public.categories set budget_group = 'wants' where name in ('Belanja', 'Hiburan');
