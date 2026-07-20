"use client";

import React from "react";
import {
  TrendingUp, Users, CheckSquare, DollarSign,
  Activity, AlertCircle,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { useAnalyticsOverview } from "../hooks/use-analytics";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AnalyticsFilters } from "../types";

interface OverviewKpisProps {
  filters: AnalyticsFilters;
}

export function OverviewKpis({ filters }: OverviewKpisProps) {
  const { data, isLoading, isError } = useAnalyticsOverview(filters);

  if (isError) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{
          borderColor: "hsl(var(--destructive) / 0.3)",
          background: "hsl(var(--destructive) / 0.06)",
        }}
      >
        <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--destructive))" }} />
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load KPIs. Check your connection and try refreshing.
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: "Pipeline Value",
      value: isLoading ? "—" : formatCurrency(data?.deals.totalPipelineValue ?? 0),
      subtitle: "Active deals",
      icon: <DollarSign className="h-4 w-4" />,
      iconColor: "hsl(221.2 83.2% 53.3%)",
      loading: isLoading,
    },
    {
      title: "Total Deals",
      value: isLoading ? "—" : String(data?.deals.totalDeals ?? 0),
      subtitle: `${formatCurrency(data?.deals.wonValue ?? 0)} won`,
      icon: <TrendingUp className="h-4 w-4" />,
      iconColor: "hsl(262 73% 62%)",
      loading: isLoading,
    },
    {
      title: "Conversion Rate",
      value: isLoading ? "—" : formatPercent(data?.deals.conversionRate ?? 0),
      subtitle: "Won / total deals",
      icon: <Activity className="h-4 w-4" />,
      iconColor: "hsl(142 71% 45%)",
      loading: isLoading,
    },
    {
      title: "Active Clients",
      value: isLoading ? "—" : String(data?.clients.totalClients ?? 0),
      subtitle: `+${data?.clients.newClientsInPeriod ?? 0} this period`,
      icon: <Users className="h-4 w-4" />,
      iconColor: "hsl(43 96% 56%)",
      loading: isLoading,
    },
    {
      title: "Task Completion",
      value: isLoading ? "—" : formatPercent(data?.tasks.completionRate ?? 0),
      subtitle: `${data?.tasks.overdueTasks ?? 0} overdue`,
      icon: <CheckSquare className="h-4 w-4" />,
      iconColor:
        (data?.tasks.overdueTasks ?? 0) > 0
          ? "hsl(0 72% 51%)"
          : "hsl(142 71% 45%)",
      loading: isLoading,
    },
    {
      title: "Won Revenue",
      value: isLoading ? "—" : formatCurrency(data?.deals.wonValue ?? 0),
      subtitle: "Closed won",
      icon: <DollarSign className="h-4 w-4" />,
      iconColor: "hsl(142 71% 45%)",
      loading: isLoading,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => (
        <div key={card.title} className={i < 4 ? "xl:col-span-1" : "xl:col-span-1"}>
          <KpiCard {...card} index={i} />
        </div>
      ))}
    </div>
  );
}
