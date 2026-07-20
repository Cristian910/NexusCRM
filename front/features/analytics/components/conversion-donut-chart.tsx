"use client";

import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { ChartWrapper, ChartSkeleton, ChartEmpty, ChartError } from "@/components/charts/chart-wrapper";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { useDealsAnalytics } from "../hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsFilters } from "../types";

const COLORS = {
  won:      "hsl(142 71% 45%)",
  lost:     "hsl(0 72% 51%)",
  pipeline: "hsl(238 76% 65%)",
};

interface ConversionDonutChartProps {
  filters: AnalyticsFilters;
}

export function ConversionDonutChart({ filters }: ConversionDonutChartProps) {
  const { data, isLoading, isError, refetch } = useDealsAnalytics(filters);

  if (isLoading) return <ChartSkeleton height={280} />;

  const wonStage  = data?.stageBreakdown.find((s) => s.stage === "CLOSED_WON");
  const lostStage = data?.stageBreakdown.find((s) => s.stage === "CLOSED_LOST");
  const openDeals = (data?.totalDeals ?? 0) - (wonStage?.count ?? 0) - (lostStage?.count ?? 0);

  const chartData = [
    { name: "Won",      value: wonStage?.count  ?? 0, color: COLORS.won,      money: wonStage?.totalValue  ?? 0 },
    { name: "Lost",     value: lostStage?.count ?? 0, color: COLORS.lost,     money: lostStage?.totalValue ?? 0 },
    { name: "Pipeline", value: Math.max(0, openDeals), color: COLORS.pipeline, money: data?.totalPipelineValue ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <ChartWrapper
      title="Win / Loss Breakdown"
      description={
        data
          ? `${data.conversionRate.toFixed(1)}% conversion rate`
          : "Deal outcomes"
      }
      height={280}
    >
      {isError ? (
        <ChartError onRetry={refetch} />
      ) : !data || data.totalDeals === 0 ? (
        <ChartEmpty message="No closed deals yet" />
      ) : (
        <div className="relative flex h-full flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                animationBegin={100}
                animationDuration={600}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomTooltip
                    valueFormatter={(v) => `${v} deals`}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute top-[50px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {data.conversionRate.toFixed(0)}%
            </p>
            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              win rate
            </p>
          </div>

          {/* Legend row */}
          <div className="mt-2 flex justify-center gap-5">
            {[
              { label: "Won",      value: wonStage?.count  ?? 0, money: wonStage?.totalValue,  color: COLORS.won  },
              { label: "Lost",     value: lostStage?.count ?? 0, money: lostStage?.totalValue, color: COLORS.lost },
              { label: "Pipeline", value: Math.max(0, openDeals), money: data.totalPipelineValue, color: COLORS.pipeline },
            ].map(({ label, value, money, color }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
                  {value}
                </p>
                {money !== undefined && (
                  <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {formatCurrency(money)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
