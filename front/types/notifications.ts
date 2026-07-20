// Mirrors Prisma NotificationType enum exactly
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, unknown> | null;
  userId: string;
  organizationId: string;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
