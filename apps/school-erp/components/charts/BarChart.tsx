"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_PALETTE, axisProps, gridProps, ChartTooltip } from "./chartTheme";

export interface BarSeries {
  key: string;
  name?: string;
  color?: string;
}

export interface BarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: BarSeries[];
  height?: number;
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  radius?: number;
  valueSuffix?: string;
  className?: string;
}

/** Reusable bar chart (single or grouped/stacked series) on the design palette. */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  bars,
  height = 260,
  stacked = false,
  showGrid = true,
  showLegend = false,
  radius = 6,
  valueSuffix = "",
  className,
}) => {
  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          {showGrid && <CartesianGrid {...gridProps} />}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <Tooltip
            content={<ChartTooltip valueSuffix={valueSuffix} />}
            cursor={{ fill: "rgba(13,148,136,0.06)" }}
          />
          {showLegend && (
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          )}
          {bars.map((b, i) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name || b.key}
              stackId={stacked ? "stack" : undefined}
              fill={b.color || CHART_PALETTE[i % CHART_PALETTE.length]}
              radius={stacked ? 0 : [radius, radius, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
};
