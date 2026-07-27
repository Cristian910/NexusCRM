"use client";

import React from "react";
import { PageHeader } from "@/components/layout";
import { FilterBar } from "@/features/analytics/components/filter-bar";
import { OverviewKpis } from "@/features/analytics/components/overview-kpis";
import { DealsFunnelChart } from "@/features/analytics/components/deals-funnel-chart";
import { ConversionDonutChart } from "@/features/analytics/components/conversion-donut-chart";
import { UserPerformanceChart } from "@/features/analytics/components/user-performance-chart";
import { TopClientsTable } from "@/features/analytics/components/top-clients-table";
import { useAnalyticsFilters } from "@/features/analytics/hooks/use-analytics-filters";
import { useTranslation } from "@/lib/i18n/context";

export function AnalyticsClient() {
  const { t } = useTranslation();
  const { state, filters, setPreset, setCustomRange } = useAnalyticsFilters();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={t("analytics.pageTitle")}
        description={t("analytics.pageDescription")}
        actions={
          <FilterBar
            activePreset={state.preset}
            onPresetChange={setPreset}
            dateFrom={state.dateFrom}
            dateTo={state.dateTo}
            onCustomRangeChange={setCustomRange}
          />
        }
      />

      <OverviewKpis filters={filters} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DealsFunnelChart filters={filters} />
        </div>
        <div className="lg:col-span-2">
          <ConversionDonutChart filters={filters} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UserPerformanceChart filters={filters} />
        <TopClientsTable filters={filters} />
      </div>
    </div>
  );
}
