import { supabaseAdmin } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { CategoryRow } from "./category-row";
import { AddCategoryForm } from "./add-category-form";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const db = supabaseAdmin();
  const { data } = await db.from("categories").select("*").order("name");
  const categories = (data ?? []) as Category[];

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Kategori</h1>
        <p className="text-sm text-slate-500">Kelola kategori pemasukan dan pengeluaran.</p>
      </div>

      <AddCategoryForm />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryGroup title="Pemasukan" categories={income} />
        <CategoryGroup title="Pengeluaran" categories={expense} />
      </div>
    </div>
  );
}

function CategoryGroup({ title, categories }: { title: string; categories: Category[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada kategori.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
