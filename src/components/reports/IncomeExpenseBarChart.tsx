"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type MonthlyTotal = { month: string; label: string; income: number; expense: number };

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(n);
}

export default function IncomeExpenseBarChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatIDR} />
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
          labelStyle={{ color: "#0f172a" }}
          formatter={(value) => formatIDR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
        <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
