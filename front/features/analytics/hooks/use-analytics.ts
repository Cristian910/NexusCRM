"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../analytics.service";
import type { AnalyticsFilters } from "../types";

// Stable query key builder
const keys = {
  overview: (f: AnalyticsFilters) => ["analytics", "overview", f] as const,
  deals:    (f: AnalyticsFilters) => ["analytics", "deals",    f] as const,
  users:    (f: AnalyticsFilters) => ["analytics", "users",    f] as const,
  clients:  (f: AnalyticsFilters) => ["analytics", "clients",  f] as const,
};

// ── useAnalyticsOverview ──────────────────────────────────────────
export function useAnalyticsOverview(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: keys.overview(filters),
    queryFn: () => analyticsService.getOverview(filters),
    staleTime: 60 * 1000,       // matches backend 60s cache TTL
    refetchOnWindowFocus: false,
  });
}

// ── useDealsAnalytics ─────────────────────────────────────────────
export function useDealsAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: keys.deals(filters),
    queryFn: () => analyticsService.getDeals(filters),
    staleTime: 5 * 60 * 1000,  // 5 min — matches backend 300s TTL
    refetchOnWindowFocus: false,
  });
}

// ── useUsersAnalytics ─────────────────────────────────────────────
export function useUsersAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: keys.users(filters),
    queryFn: () => analyticsService.getUsers(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Backend returns 403 for non-ADMIN — handled by query error state
    retry: (count, err) => {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 403) return false;
      return count < 1;
    },
  });
}

// ── useClientsAnalytics ───────────────────────────────────────────
export function useClientsAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: keys.clients(filters),
    queryFn: () => analyticsService.getClients(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
