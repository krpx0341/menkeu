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
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="label" stroke="#a3a3a3" fontSize={12} />
        <YAxis stroke="#a3a3a3" fontSize={12} tickFormatter={formatIDR} />
        <Tooltip
          contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8 }}
          labelStyle={{ color: "#e5e5e5" }}
          formatter={(value) => formatIDR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }} />
        <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
