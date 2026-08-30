"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type CategorySlice = { name: string; value: number; color: string };

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-neutral-500">Belum ada pengeluaran bulan ini.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="#171717" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8 }}
          labelStyle={{ color: "#e5e5e5" }}
          formatter={(value) => formatIDR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
