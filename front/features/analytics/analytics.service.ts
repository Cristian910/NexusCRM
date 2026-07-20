import { apiClient } from "@/lib/api/client";
import type {
  AnalyticsFilters, OverviewKpis, DealKpis,
  UserPerformance, ClientKpis,
} from "./types";

function toParams(filters: AnalyticsFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.dateFrom) p.dateFrom = filters.dateFrom;
  if (filters.dateTo)   p.dateTo   = filters.dateTo;
  if (filters.userId)   p.userId   = filters.userId;
  if (filters.stage)    p.stage    = filters.stage;
  return p;
}

export const analyticsService = {
  async getOverview(filters: AnalyticsFilters = {}): Promise<OverviewKpis> {
    const { data } = await apiClient.get<OverviewKpis>("/analytics/overview", {
      params: toParams(filters),
    });
    return data;
  },

  async getDeals(filters: AnalyticsFilters = {}): Promise<DealKpis> {
    const { data } = await apiClient.get<DealKpis>("/analytics/deals", {
      params: toParams(filters),
    });
    return data;
  },

  async getUsers(filters: AnalyticsFilters = {}): Promise<UserPerformance[]> {
    const { data } = await apiClient.get<UserPerformance[]>("/analytics/users", {
      params: toParams(filters),
    });
    return data;
  },

  async getClients(filters: AnalyticsFilters = {}): Promise<ClientKpis> {
    const { data } = await apiClient.get<ClientKpis>("/analytics/clients", {
      params: toParams(filters),
    });
    return data;
  },
};
