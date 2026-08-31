export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// Compact currency form for tight spaces (calendar cells, badges), e.g.
// "Rp 220rb", "Rp 1,2jt". Rounds to 1 decimal for the rb/jt unit and drops
// a trailing ".0". Values under 1000 are shown with no unit and no decimal.
export function compactRupiah(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs < 1000) return `${sign}Rp ${Math.round(abs)}`;

  const [divisor, unit] = abs < 1_000_000 ? [1_000, "rb"] : [1_000_000, "jt"];
  const rounded = Math.round((abs / divisor) * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
  return `${sign}Rp ${formatted}${unit}`;
}
