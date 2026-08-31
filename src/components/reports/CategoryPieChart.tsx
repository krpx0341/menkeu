"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type CategorySlice = { name: string; value: number; color: string };

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">Belum ada pengeluaran bulan ini.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="#ffffff" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}
          labelStyle={{ color: "#0f172a" }}
          formatter={(value) => formatIDR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
