"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ChartWrapper, ChartSkeleton, ChartEmpty, ChartError } from "@/components/charts/chart-wrapper";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { useDealsAnalytics } from "../hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsFilters } from "../types";

// Stage labels + colors that align with design system
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  LEAD:        { label: "Lead",        color: "hsl(238 76% 65%)" },
  CONTACTED:   { label: "Contacted",   color: "hsl(262 73% 62%)" },
  NEGOTIATION: { label: "Negotiation", color: "hsl(43 96% 56%)"  },
  CLOSED_WON:  { label: "Won",         color: "hsl(142 71% 45%)" },
  CLOSED_LOST: { label: "Lost",        color: "hsl(0 72% 51%)"   },
};

interface DealsFunnelChartProps {
  filters: AnalyticsFilters;
}

export function DealsFunnelChart({ filters }: DealsFunnelChartProps) {
  const { data, isLoading, isError, refetch } = useDealsAnalytics(filters);

  if (isLoading) return <ChartSkeleton height={280} />;

  return (
    <ChartWrapper
      title="Deal Pipeline"
      description="Count and value by stage"
      action={
        data && (
          <span
            className="rounded-md px-2 py-1 text-xs font-medium"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {data.totalDeals} total
          </span>
        )
      }
      height={280}
    >
      {isError ? (
        <ChartError onRetry={refetch} />
      ) : !data || data.totalDeals === 0 ? (
        <ChartEmpty message="No deals to display" />
      ) : (
        <div className="h-full w-full pt-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.stageBreakdown.map((s) => ({
                name:  STAGE_CONFIG[s.stage]?.label ?? s.stage,
                count: s.count,
                value: s.totalValue,
                pct:   s.percentage,
                stage: s.stage,
              }))}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="28%"
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    valueFormatter={(v, key) =>
                      key === "value" ? formatCurrency(v) : String(v)
                    }
                  />
                }
                cursor={{ fill: "hsl(var(--muted) / 0.4)", radius: 4 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Deals" maxBarSize={56}>
                {data.stageBreakdown.map((s) => (
                  <Cell
                    key={s.stage}
                    fill={STAGE_CONFIG[s.stage]?.color ?? "hsl(var(--primary))"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Stage legend */}
          <div className="mt-1 flex flex-wrap justify-center gap-3 px-4">
            {data.stageBreakdown.map((s) => (
              <div key={s.stage} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STAGE_CONFIG[s.stage]?.color }}
                />
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {STAGE_CONFIG[s.stage]?.label} {s.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
