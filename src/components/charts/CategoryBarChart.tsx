"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

const BAR_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8"];

export function CategoryBarChart({
  data,
}: {
  data: { name: string; units: number; value: number }[];
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-14}
            height={44}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgb(15 23 42 / 0.04)" }} />
          <Bar dataKey="units" name="Unidades" radius={[4, 4, 0, 0]} maxBarSize={42}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
