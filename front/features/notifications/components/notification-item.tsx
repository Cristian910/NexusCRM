"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { formatRelative } from "@/lib/utils";
import { useMarkAsRead } from "../hooks/use-notifications";
import type { Notification, NotificationType } from "@/types/notifications";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  INFO: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 1 1 0 1.5A.75.75 0 0 1 8 4zm.75 7.25h-1.5v-4h1.5v4z" />
      </svg>
    ),
    color: "hsl(221 83% 53%)",
  },
  SUCCESS: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.28 4.97-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 1 1 1.06 1.06z" />
      </svg>
    ),
    color: "hsl(142 71% 45%)",
  },
  WARNING: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M7.12 1.566a1 1 0 0 1 1.76 0l6 11A1 1 0 0 1 14 14H2a1 1 0 0 1-.88-1.434l6-11zM8 5.5a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 5.5zM8 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
    ),
    color: "hsl(43 96% 56%)",
  },
  ERROR: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm2.78 9.22a.75.75 0 0 1-1.06 1.06L8 9.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 0 1 1.06 1.06L9.06 8l1.72 1.72z" />
      </svg>
    ),
    color: "hsl(0 72% 51%)",
  },
};

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const markRead = useMarkAsRead();
  const cfg = TYPE_CONFIG[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    // Navigate based on metadata if present
    const meta = notification.metadata as Record<string, string> | undefined;
    if (meta?.entityType === "DEAL" && meta?.entityId) {
      router.push(`/deals`);
    } else if (meta?.entityType === "CLIENT" && meta?.entityId) {
      router.push(`/clients/${meta.entityId}`);
    }
    onClose?.();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className="group flex cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: notification.read
          ? "transparent"
          : "hsl(var(--muted) / 0.4)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted) / 0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = notification.read
          ? "transparent"
          : "hsl(var(--muted) / 0.4)";
      }}
    >
      {/* Type icon */}
      <div
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${cfg.color}18`, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-xs font-medium leading-snug"
            style={{
              color: notification.read
                ? "hsl(var(--muted-foreground))"
                : "hsl(var(--foreground))",
            }}
          >
            {notification.title}
          </p>
          {/* Unread dot */}
          {!notification.read && (
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: cfg.color }}
            />
          )}
        </div>
        <p
          className="mt-0.5 text-[11px] leading-relaxed line-clamp-2"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {notification.message}
        </p>
        <p
          className="mt-1 text-[10px]"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {formatRelative(notification.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}
