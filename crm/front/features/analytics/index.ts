// Hooks
export {
  useAnalyticsOverview,
  useDealsAnalytics,
  useUsersAnalytics,
  useClientsAnalytics,
} from "./hooks/use-analytics";
export { useAnalyticsFilters } from "./hooks/use-analytics-filters";
export type { DatePreset, FiltersState } from "./hooks/use-analytics-filters";

// Types — exported individually to avoid re-export conflicts
export type {
  AnalyticsFilters,
  DealKpis,
  DealStageBreakdown,
  UserPerformance,
  ClientKpis,
  TopClient,
} from "./types";
// OverviewKpis is exported from ./types/index directly, not re-exported here
// to avoid duplicate identifier when both are in scope

// Components
export { KpiCard } from "./components/kpi-card";
export { FilterBar } from "./components/filter-bar";
export { OverviewKpis } from "./components/overview-kpis";
export { DealsFunnelChart } from "./components/deals-funnel-chart";
export { ConversionDonutChart } from "./components/conversion-donut-chart";
export { UserPerformanceChart } from "./components/user-performance-chart";
export { TopClientsTable } from "./components/top-clients-table";
