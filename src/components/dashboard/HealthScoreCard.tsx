type Status = "healthy" | "warning" | "danger";

function statusFor(score: number): { status: Status; label: string; headline: string; color: string; badge: string; ring: string } {
  if (score >= 70) {
    return {
      status: "healthy",
      label: "Healthy",
      headline: "Keuangan Anda terkendali",
      color: "text-emerald-400",
      badge: "bg-emerald-400/10 text-emerald-400",
      ring: "stroke-emerald-400",
    };
  }
  if (score >= 40) {
    return {
      status: "warning",
      label: "Perlu Perhatian",
      headline: "Mulai perhatikan pengeluaran",
      color: "text-amber-400",
      badge: "bg-amber-400/10 text-amber-400",
      ring: "stroke-amber-400",
    };
  }
  return {
    status: "danger",
    label: "Waspada",
    headline: "Pengeluaran perlu direm",
    color: "text-red-400",
    badge: "bg-red-400/10 text-red-400",
    ring: "stroke-red-400",
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
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-neutral-300">Skor Kesehatan Keuangan</h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg width="128" height="128" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#262626" strokeWidth="10" />
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
          <span className="absolute text-xl font-semibold text-neutral-100">{score}%</span>
        </div>
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <span className={`w-fit self-center rounded-full px-2 py-0.5 text-xs font-medium sm:self-start ${badge}`}>
            {label}
          </span>
          <p className="text-base font-semibold text-neutral-100">{headline}</p>
          <p className="text-xs text-neutral-500">{explanation}</p>
        </div>
      </div>
    </section>
  );
}
