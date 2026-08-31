type Status = "healthy" | "warning" | "danger";

function statusFor(score: number): { status: Status; label: string; headline: string; color: string; badge: string; ring: string } {
  if (score >= 70) {
    return {
      status: "healthy",
      label: "Healthy",
      headline: "Keuangan Anda terkendali",
      color: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-600",
      ring: "stroke-emerald-500",
    };
  }
  if (score >= 40) {
    return {
      status: "warning",
      label: "Perlu Perhatian",
      headline: "Mulai perhatikan pengeluaran",
      color: "text-amber-600",
      badge: "bg-amber-50 text-amber-600",
      ring: "stroke-amber-500",
    };
  }
  return {
    status: "danger",
    label: "Waspada",
    headline: "Pengeluaran perlu direm",
    color: "text-red-600",
    badge: "bg-red-50 text-red-600",
    ring: "stroke-red-500",
  };
}

export default function HealthScoreCard({
  score,
  cashFlowScore,
  budgetScore,
  budgetUtilizationPct,
}: {
  score: number;
  cashFlowScore: number;
  budgetScore: number | null;
  budgetUtilizationPct: number | null;
}) {
  const { label, headline, badge, ring } = statusFor(score);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const explanation =
    budgetScore === null
      ? `Sisa arus kas ${Math.round(cashFlowScore)}%. Belum ada budget bulan ini untuk dinilai.`
      : `Sisa arus kas ${Math.round(cashFlowScore)}% · Pemakaian anggaran ${Math.round(budgetUtilizationPct ?? 0)}%.`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Skor Kesehatan Keuangan</h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg width="128" height="128" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={ring}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute text-xl font-semibold tabular-nums text-slate-900">{score}%</span>
        </div>
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <span className={`w-fit self-center rounded-full px-2 py-0.5 text-xs font-medium sm:self-start ${badge}`}>
            {label}
          </span>
          <p className="text-base font-semibold text-slate-900">{headline}</p>
          <p className="text-xs text-slate-500">{explanation}</p>
        </div>
      </div>
    </section>
  );
}
