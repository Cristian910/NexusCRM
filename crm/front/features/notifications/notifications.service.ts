import { apiClient } from "@/lib/api/client";
import type {
  Notification, UnreadCount, NotificationFilters,
} from "@/types/notifications";
import type { PaginatedResponse } from "@/types";

export const notificationsService = {
  async list(filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> {
    const params: Record<string, string | number | boolean> = {};
    if (filters.type)       params.type       = filters.type;
    if (filters.unreadOnly) params.unreadOnly  = true;
    if (filters.page)       params.page        = filters.page;
    if (filters.limit)      params.limit       = filters.limit;

    const { data } = await apiClient.get<PaginatedResponse<Notification>>(
      "/notifications",
      { params }
    );
    return data;
  },

  async getUnreadCount(): Promise<UnreadCount> {
    const { data } = await apiClient.get<UnreadCount>("/notifications/unread-count");
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const { data } = await apiClient.patch<{ updated: number }>("/notifications/read-all");
    return data;
  },
};
