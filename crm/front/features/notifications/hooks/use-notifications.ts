"use client";

import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { notificationsService } from "../notifications.service";
import type { Notification, NotificationFilters } from "@/types/notifications";
import type { ApiError, PaginatedResponse } from "@/types";

type NotificationsPage = PaginatedResponse<Notification>;

export const notifKeys = {
  all:         () => ["notifications"] as const,
  lists:       () => ["notifications", "list"] as const,
  list:        (f: NotificationFilters) => ["notifications", "list", f] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: notifKeys.list(filters),
    queryFn:  () => notificationsService.list(filters),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notifKeys.unreadCount(),
    queryFn:  notificationsService.getUnreadCount,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, string, { snapshots: Map<QueryKey, NotificationsPage | undefined> }>({
    mutationFn: notificationsService.markAsRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notifKeys.lists() });
      const snapshots = new Map<QueryKey, NotificationsPage | undefined>();

      qc.getQueriesData<NotificationsPage>({ queryKey: notifKeys.lists() }).forEach(([key, data]) => {
        snapshots.set(key, data);
        if (data?.data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.map((n) => n.id === id ? { ...n, read: true } : n),
          });
        }
      });

      qc.setQueryData<{ count: number }>(notifKeys.unreadCount(), (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old
      );

      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots?.forEach((data, key) => {
        qc.setQueryData(key, data);
      });
      qc.invalidateQueries({ queryKey: notifKeys.unreadCount() });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();

  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: notificationsService.markAllAsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notifKeys.lists() });

      qc.getQueriesData<NotificationsPage>({ queryKey: notifKeys.lists() }).forEach(([key, data]) => {
        if (data?.data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.map((n) => ({ ...n, read: true })),
          });
        }
      });
      qc.setQueryData(notifKeys.unreadCount(), { count: 0 });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all() });
    },
  });
}
