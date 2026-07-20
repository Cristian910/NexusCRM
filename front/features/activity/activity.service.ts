import { apiClient } from "@/lib/api/client";
import type { Activity, ActivityFilters } from "@/types/activity";
import type { PaginatedResponse } from "@/types";

export const activityService = {
  async list(filters: ActivityFilters = {}): Promise<PaginatedResponse<Activity>> {
    const params: Record<string, string | number> = {};
    if (filters.type)       params.type       = filters.type;
    if (filters.entityType) params.entityType  = filters.entityType;
    if (filters.entityId)   params.entityId    = filters.entityId;
    if (filters.userId)     params.userId      = filters.userId;
    if (filters.page)       params.page        = filters.page;
    if (filters.limit)      params.limit       = filters.limit;

    const { data } = await apiClient.get<PaginatedResponse<Activity>>(
      "/activities",
      { params }
    );
    return data;
  },

  async listByEntity(
    entityId: string,
    page = 1,
    limit = 30
  ): Promise<PaginatedResponse<Activity>> {
    const { data } = await apiClient.get<PaginatedResponse<Activity>>(
      `/activities/entity/${entityId}`,
      { params: { page, limit } }
    );
    return data;
  },
};
