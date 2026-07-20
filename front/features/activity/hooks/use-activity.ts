"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { activityService } from "../activity.service";
import type { ActivityFilters } from "@/types/activity";

export const activityKeys = {
  all:    () => ["activity"] as const,
  lists:  () => ["activity", "list"] as const,
  list:   (f: ActivityFilters) => ["activity", "list", f] as const,
  entity: (id: string, page?: number) => ["activity", "entity", id, page] as const,
};

export function useActivity(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn:  () => activityService.list(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useEntityActivity(entityId: string, page = 1) {
  return useQuery({
    queryKey: activityKeys.entity(entityId, page),
    queryFn:  () => activityService.listByEntity(entityId, page),
    enabled:  !!entityId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
