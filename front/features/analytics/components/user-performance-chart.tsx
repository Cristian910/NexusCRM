"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ChartWrapper, ChartSkeleton, ChartEmpty, ChartError } from "@/components/charts/chart-wrapper";
import { CustomTooltip } from "@/components/charts/custom-tooltip";
import { useUsersAnalytics } from "../hooks/use-analytics";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsFilters } from "../types";

interface UserPerformanceChartProps {
  filters: AnalyticsFilters;
}

export function UserPerformanceChart({ filters }: UserPerformanceChartProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN";
  const { data, isLoading, isError, refetch } = useUsersAnalytics(filters);

  if (!isAdmin) {
    return (
      <ChartWrapper title="Team Performance" description="Sales rep leaderboard" height={280}>
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "hsl(var(--muted))" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zM4 20a8 8 0 1 1 16 0"
                stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M17 11l2 2 4-4" stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Requires Admin or Owner role
          </p>
        </div>
      </ChartWrapper>
    );
  }

  if (isLoading) return <ChartSkeleton height={280} />;

  const chartData = (data ?? [])
    .sort((a, b) => b.wonValue - a.wonValue)
    .slice(0, 8)
    .map((u) => ({
      name:     `${u.firstName} ${u.lastName.charAt(0)}.`,
      won:      u.wonDeals,
      total:    u.totalDeals,
      value:    u.wonValue,
      rate:     u.closeRate,
    }));

  return (
    <ChartWrapper
      title="Team Performance"
      description="Won deals and revenue by rep"
      action={
        <span
          className="rounded-md px-2 py-1 text-xs font-medium"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          {(data ?? []).length} reps
        </span>
      }
      height={280}
    >
      {isError ? (
        <ChartError onRetry={refetch} />
      ) : !chartData.length ? (
        <ChartEmpty message="No user performance data" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
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
            <Bar
              dataKey="total"
              name="Total deals"
              fill="hsl(var(--muted))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="won"
              name="Won"
              fill="hsl(142 71% 45%)"
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  );
}
