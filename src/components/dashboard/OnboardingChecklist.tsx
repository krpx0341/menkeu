import Link from "next/link";
import { Check, Circle } from "lucide-react";

type Step = { label: string; href: string; done: boolean };

export default function OnboardingChecklist({
  hasAccount,
  hasTransaction,
  hasBudget,
}: {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
}) {
  if (hasAccount && hasTransaction && hasBudget) return null;

  const steps: Step[] = [
    { label: "Tambah akun (saldo tunai/bank yang kamu punya)", href: "/accounts", done: hasAccount },
    { label: "Catat transaksi pertamamu", href: "/transactions?new=1", done: hasTransaction },
    { label: "Set budget bulanan untuk satu kategori", href: "/budgets", done: hasBudget },
  ];

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Mulai dari sini</h2>
      <p className="mb-3 text-xs text-slate-500">Tiga langkah supaya dashboard ini mulai menunjukkan gambaran nyata.</p>
      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.href}>
            {step.done ? (
              <div className="flex items-center gap-2.5 text-sm text-slate-400 line-through">
                <Check size={16} className="shrink-0 text-emerald-500" />
                {step.label}
              </div>
            ) : (
              <Link
                href={step.href}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-900 hover:text-blue-600"
              >
                <Circle size={16} className="shrink-0 text-slate-300" />
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
