"use client";

import React from "react";
import { motion } from "framer-motion";
import { useClientsAnalytics } from "../hooks/use-analytics";
import { ChartWrapper, ChartSkeleton, ChartEmpty, ChartError } from "@/components/charts/chart-wrapper";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { AnalyticsFilters } from "../types";

interface TopClientsTableProps {
  filters: AnalyticsFilters;
}

export function TopClientsTable({ filters }: TopClientsTableProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useClientsAnalytics(filters);

  if (isLoading) return <ChartSkeleton height={280} />;

  const top = data?.topClientsByDealValue ?? [];
  const maxValue = top[0]?.totalDealValue ?? 1;

  return (
    <ChartWrapper
      title={t("analytics.topClients")}
      description={t("analytics.byTotalDealValue")}
      height={280}
    >
      {isError ? (
        <ChartError onRetry={refetch} />
      ) : !top.length ? (
        <ChartEmpty message={t("analytics.noClientDealData")} />
      ) : (
        <div className="space-y-0 px-4 pb-2">
          {top.slice(0, 6).map((client, i) => {
            const pct = (client.totalDealValue / maxValue) * 100;
            return (
              <motion.div
                key={client.clientId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
                style={{ cursor: "default" }}
              >
                {/* Rank */}
                <span
                  className="w-4 shrink-0 text-right text-xs font-medium tabular-nums"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {i + 1}
                </span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {client.clientName}
                    </span>
                    <span
                      className="shrink-0 text-xs font-semibold tabular-nums"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {formatCurrency(client.totalDealValue)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "hsl(var(--muted))" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `hsl(${174 + i * 8} 65% ${48 - i * 2}%)`,
                        width: `${pct}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  {/* Sub-info */}
                  <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {client.totalDeals === 1
                      ? t("deals.dealCountSingular", { count: client.totalDeals })
                      : t("deals.dealCountPlural", { count: client.totalDeals })}
                    {client.company ? ` · ${client.company}` : ""}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </ChartWrapper>
  );
}
