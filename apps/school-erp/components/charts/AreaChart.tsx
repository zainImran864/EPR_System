"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_PALETTE, axisProps, gridProps, ChartTooltip } from "./chartTheme";

export interface AreaSeries {
  key: string;
  name?: string;
  color?: string;
}

export interface AreaChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  areas: AreaSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  valueSuffix?: string;
  className?: string;
}

/** Reusable area chart with soft gradient fills. */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  areas,
  height = 260,
  showGrid = true,
  showLegend = false,
  stacked = false,
  valueSuffix = "",
  className,
}) => {
  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RAreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            {areas.map((a, i) => {
              const color = a.color || CHART_PALETTE[i % CHART_PALETTE.length];
              return (
                <linearGradient
                  key={a.key}
                  id={`area-gradient-${a.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && <CartesianGrid {...gridProps} />}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <Tooltip content={<ChartTooltip valueSuffix={valueSuffix} />} />
          {showLegend && (
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          )}
          {areas.map((a, i) => {
            const color = a.color || CHART_PALETTE[i % CHART_PALETTE.length];
            return (
              <Area
                key={a.key}
                type="monotone"
                dataKey={a.key}
                name={a.name || a.key}
                stackId={stacked ? "stack" : undefined}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#area-gradient-${a.key})`}
              />
            );
          })}
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
