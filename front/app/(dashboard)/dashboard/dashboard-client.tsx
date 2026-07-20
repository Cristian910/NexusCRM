"use client";

import React from "react";
import { motion } from "framer-motion";
import { FilterBar } from "@/features/analytics/components/filter-bar";
import { OverviewKpis } from "@/features/analytics/components/overview-kpis";
import { DealsFunnelChart } from "@/features/analytics/components/deals-funnel-chart";
import { ConversionDonutChart } from "@/features/analytics/components/conversion-donut-chart";
import { UserPerformanceChart } from "@/features/analytics/components/user-performance-chart";
import { TopClientsTable } from "@/features/analytics/components/top-clients-table";
import { useAnalyticsFilters } from "@/features/analytics/hooks/use-analytics-filters";
import { useAnalyticsOverview, useDealsAnalytics, useClientsAnalytics } from "@/features/analytics/hooks/use-analytics";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatDate } from "@/lib/utils";

// ── Section wrapper with staggered fade-in ────────────────────────
function Section({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Dashboard divider label ───────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function DashboardClient() {
  const user = useAuthStore((s) => s.user);
  const { state, filters, setPreset } = useAnalyticsFilters();

  // Check if any query is loading to show on filter bar
  const overviewQ = useAnalyticsOverview(filters);
  const dealsQ    = useDealsAnalytics(filters);
  const clientsQ  = useClientsAnalytics(filters);
  const anyFetching = overviewQ.isFetching || dealsQ.isFetching || clientsQ.isFetching;

  const periodLabel =
    state.dateFrom && state.dateTo
      ? `${formatDate(state.dateFrom, "MMM d")} – ${formatDate(state.dateTo, "MMM d, yyyy")}`
      : "All time";

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <Section delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {user ? `Welcome back, ${user.firstName}` : "Dashboard"}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {periodLabel} · Your CRM at a glance
            </p>
          </div>
          <FilterBar
            activePreset={state.preset}
            onPresetChange={setPreset}
            loading={anyFetching}
          />
        </div>
      </Section>

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <Section delay={0.04}>
        <OverviewKpis filters={filters} />
      </Section>

      {/* ── Charts row 1: Funnel + Conversion ───────────────────── */}
      <Section delay={0.1}>
        <SectionLabel>Pipeline</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DealsFunnelChart filters={filters} />
          </div>
          <div className="lg:col-span-2">
            <ConversionDonutChart filters={filters} />
          </div>
        </div>
      </Section>

      {/* ── Charts row 2: Team + Top clients ────────────────────── */}
      <Section delay={0.15}>
        <SectionLabel>Team & Clients</SectionLabel>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <UserPerformanceChart filters={filters} />
          <TopClientsTable filters={filters} />
        </div>
      </Section>

      {/* ── Stats summary ────────────────────────────────────────── */}
      <Section delay={0.2}>
        <SectionLabel>Quick stats</SectionLabel>
        <div className="mt-3">
          <QuickStats filters={filters} />
        </div>
      </Section>
    </div>
  );
}

// ── Quick stats strip ─────────────────────────────────────────────
function QuickStats({ filters }: { filters: ReturnType<typeof useAnalyticsFilters>["filters"] }) {
  const { data, isLoading } = useDealsAnalytics(filters);
  const clientData = useClientsAnalytics(filters).data;

  const stats = [
    {
      label: "Avg. deal value",
      value: data ? `$${Math.round(data.averageDealValue).toLocaleString()}` : "—",
    },
    {
      label: "Deals lost",
      value: data ? String(data.lostDeals) : "—",
    },
    {
      label: "Clients with deals",
      value: clientData ? String(clientData.clientsWithDeals) : "—",
    },
    {
      label: "New clients",
      value: clientData ? String(clientData.newClientsInPeriod) : "—",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 divide-x divide-y rounded-xl border overflow-hidden sm:grid-cols-4 sm:divide-y-0"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {stats.map(({ label, value }) => (
        <div key={label} className="px-5 py-4" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {label}
          </p>
          <p
            className={`mt-1 text-lg font-semibold tabular-nums ${isLoading ? "skeleton rounded w-16 h-6" : ""}`}
            style={{ color: "hsl(var(--foreground))" }}
          >
            {isLoading ? "" : value}
          </p>
        </div>
      ))}
    </div>
  );
}
