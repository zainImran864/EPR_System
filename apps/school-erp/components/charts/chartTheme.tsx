"use client";

import React from "react";

/**
 * Shared theme tokens + tooltip for the reusable recharts wrappers.
 * Keeps every chart on the same palette as the design system.
 */
export const CHART_COLORS = {
  teal: "#0D9488",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  sky: "#0EA5E9",
  violet: "#8B5CF6",
  slate: "#64748B",
};

export const CHART_PALETTE = [
  "#0D9488", // teal (primary)
  "#0EA5E9", // sky
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#F43F5E", // rose
  "#10B981", // emerald
  "#64748B", // slate
];

export const axisProps = {
  tick: { fontSize: 11, fill: "#94A3B8" },
  tickLine: false,
  axisLine: { stroke: "#E2E8F0" },
} as const;

export const gridProps = {
  strokeDasharray: "3 3",
  stroke: "#F1F5F9",
  vertical: false,
} as const;

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  valueSuffix?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  valueSuffix = "",
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      {label !== undefined && label !== "" && (
        <div className="font-semibold text-slate-800 mb-1">{label}</div>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: entry.color || entry.fill }}
            />
            {entry.name && <span className="text-slate-500">{entry.name}:</span>}
            <span className="font-mono-data font-semibold text-slate-800">
              {entry.value}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
