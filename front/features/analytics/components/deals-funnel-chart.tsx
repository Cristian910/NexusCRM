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
import { useTranslation } from "@/lib/i18n/context";
import type { AnalyticsFilters } from "../types";

// Stage colors pull from the same pipeline "temperature scale" tokens as
// the kanban board (see globals.css) — one palette, everywhere a stage
// is represented.
const STAGE_COLOR: Record<string, string> = {
  LEAD:        "hsl(var(--stage-lead))",
  CONTACTED:   "hsl(var(--stage-contacted))",
  NEGOTIATION: "hsl(var(--stage-negotiation))",
  CLOSED_WON:  "hsl(var(--stage-won))",
  CLOSED_LOST: "hsl(var(--stage-lost))",
};

interface DealsFunnelChartProps {
  filters: AnalyticsFilters;
}

export function DealsFunnelChart({ filters }: DealsFunnelChartProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDealsAnalytics(filters);

  if (isLoading) return <ChartSkeleton height={280} />;

  return (
    <ChartWrapper
      title={t("analytics.dealPipeline")}
      description={t("analytics.countValueByStage")}
      action={
        data && (
          <span
            className="rounded-md px-2 py-1 text-xs font-medium"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {t("analytics.totalSuffix", { count: data.totalDeals })}
          </span>
        )
      }
      height={280}
    >
      {isError ? (
        <ChartError onRetry={refetch} />
      ) : !data || data.totalDeals === 0 ? (
        <ChartEmpty message={t("analytics.noDealsToDisplay")} />
      ) : (
        <div className="h-full w-full pt-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.stageBreakdown.map((s) => ({
                name:  t(`deals.stagesShort.${s.stage}`),
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name={t("analytics.dealsBarName")} maxBarSize={56}>
                {data.stageBreakdown.map((s) => (
                  <Cell
                    key={s.stage}
                    fill={STAGE_COLOR[s.stage] ?? "hsl(var(--primary))"}
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
                  style={{ background: STAGE_COLOR[s.stage] }}
                />
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {t(`deals.stages.${s.stage}`)} {s.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartWrapper>
  );
}
