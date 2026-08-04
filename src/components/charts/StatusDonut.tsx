"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

const COLORS: Record<string, string> = {
  Disponible: "#16a34a",
  "Bajo stock": "#f59e0b",
  "Sin stock": "#dc2626",
};

export function StatusDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="relative h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl font-semibold text-slate-900 tnum">
          {total}
        </p>
        <p className="text-[11px] text-slate-500">productos</p>
      </div>
    </div>
  );
}
