"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_PALETTE, axisProps, gridProps, ChartTooltip } from "./chartTheme";

export interface LineSeries {
  key: string;
  name?: string;
  color?: string;
}

export interface LineChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  lines: LineSeries[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  curved?: boolean;
  valueSuffix?: string;
  className?: string;
}

/** Reusable multi-series line chart on the design palette. */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  lines,
  height = 260,
  showGrid = true,
  showLegend = false,
  curved = true,
  valueSuffix = "",
  className,
}) => {
  return (
    <div className={className} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          {showGrid && <CartesianGrid {...gridProps} />}
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <Tooltip content={<ChartTooltip valueSuffix={valueSuffix} />} />
          {showLegend && (
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          )}
          {lines.map((l, i) => (
            <Line
              key={l.key}
              type={curved ? "monotone" : "linear"}
              dataKey={l.key}
              name={l.name || l.key}
              stroke={l.color || CHART_PALETTE[i % CHART_PALETTE.length]}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
};
