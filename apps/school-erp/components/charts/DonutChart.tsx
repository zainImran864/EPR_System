"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { CHART_PALETTE, ChartTooltip } from "./chartTheme";

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
  showLegend?: boolean;
  className?: string;
}

/** Reusable donut/pie chart with an optional center label overlay. */
export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  height = 240,
  innerRadius = 58,
  outerRadius = 84,
  centerLabel,
  centerValue,
  showLegend = true,
  className,
}) => {
  return (
    <div className={`relative ${className ?? ""}`} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color || CHART_PALETTE[i % CHART_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          {showLegend && (
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span className="text-slate-600">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {(centerLabel || centerValue !== undefined) && (
        <div
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center"
          style={{ top: 0, height: showLegend ? height - 32 : height }}
        >
          {centerValue !== undefined && (
            <span className="text-2xl font-bold text-slate-900 font-mono-data leading-none">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[11px] text-slate-500 mt-1">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
