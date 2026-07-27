"use client";

import React from "react";
import {
  TrendingUp, Users, CheckSquare, DollarSign,
  Activity, AlertCircle,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { useAnalyticsOverview } from "../hooks/use-analytics";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { AnalyticsFilters } from "../types";

interface OverviewKpisProps {
  filters: AnalyticsFilters;
}

export function OverviewKpis({ filters }: OverviewKpisProps) {
  const { t } = useTranslation();
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
          {t("analytics.failedToLoadKpis")}
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: t("analytics.pipelineValue"),
      value: isLoading ? "—" : formatCurrency(data?.deals.totalPipelineValue ?? 0),
      subtitle: t("analytics.activeDealsSubtitle"),
      icon: <DollarSign className="h-4 w-4" />,
      iconColor: "hsl(var(--primary))",
      loading: isLoading,
    },
    {
      title: t("analytics.totalDeals"),
      value: isLoading ? "—" : String(data?.deals.totalDeals ?? 0),
      subtitle: t("analytics.wonSuffix", { value: formatCurrency(data?.deals.wonValue ?? 0) }),
      icon: <TrendingUp className="h-4 w-4" />,
      iconColor: "hsl(var(--stage-contacted))",
      loading: isLoading,
    },
    {
      title: t("analytics.conversionRate"),
      value: isLoading ? "—" : formatPercent(data?.deals.conversionRate ?? 0),
      subtitle: t("analytics.wonTotalRatio"),
      icon: <Activity className="h-4 w-4" />,
      iconColor: "hsl(var(--success))",
      loading: isLoading,
    },
    {
      title: t("analytics.activeClients"),
      value: isLoading ? "—" : String(data?.clients.totalClients ?? 0),
      subtitle: t("analytics.newThisPeriod", { count: data?.clients.newClientsInPeriod ?? 0 }),
      icon: <Users className="h-4 w-4" />,
      iconColor: "hsl(var(--warning))",
      loading: isLoading,
    },
    {
      title: t("analytics.taskCompletion"),
      value: isLoading ? "—" : formatPercent(data?.tasks.completionRate ?? 0),
      subtitle: t("analytics.overdueCount", { count: data?.tasks.overdueTasks ?? 0 }),
      icon: <CheckSquare className="h-4 w-4" />,
      iconColor:
        (data?.tasks.overdueTasks ?? 0) > 0
          ? "hsl(var(--destructive))"
          : "hsl(var(--success))",
      loading: isLoading,
    },
    {
      title: t("analytics.wonRevenue"),
      value: isLoading ? "—" : formatCurrency(data?.deals.wonValue ?? 0),
      subtitle: t("analytics.closedWon"),
      icon: <DollarSign className="h-4 w-4" />,
      iconColor: "hsl(var(--success))",
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
