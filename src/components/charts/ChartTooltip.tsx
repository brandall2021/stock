"use client";

import { formatNumber } from "@/lib/format";

type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
      {label != null && label !== "" && (
        <p className="mb-1 font-semibold text-slate-700">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color ?? "#2563eb" }}
            />
            <span>
              {entry.name}:{" "}
              <b className="tnum text-slate-900">
                {formatNumber(Number(entry.value ?? 0))}
              </b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
