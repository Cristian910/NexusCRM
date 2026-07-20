"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, SlidersHorizontal, Inbox } from "lucide-react";
import { NotificationItem } from "./notification-item";
import { useNotifications, useMarkAllAsRead } from "../hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading } = useNotifications({ unreadOnly, limit: 30 });
  const markAllRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="notif-backdrop"
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="notif-panel"
            className="absolute right-0 top-full z-40 mt-2 w-[360px] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border shadow-2xl"
            style={{
              background: "hsl(var(--popover))",
              borderColor: "hsl(var(--border))",
              boxShadow: "0 0 0 1px hsl(var(--border)), 0 20px 48px -8px hsl(0 0% 0% / 0.4)",
            }}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Notifications
              </h3>

              <div className="flex items-center gap-1">
                {/* Unread filter toggle */}
                <button
                  onClick={() => setUnreadOnly((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: unreadOnly ? "hsl(var(--primary) / 0.1)" : "transparent",
                    color: unreadOnly ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Unread
                </button>

                {/* Mark all read */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <Check className="h-3 w-3" />
                  All read
                </Button>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="max-h-[400px]">
              <div className="p-1.5">
                {isLoading ? (
                  <PanelSkeleton />
                ) : notifications.length === 0 ? (
                  <PanelEmpty unreadOnly={unreadOnly} />
                ) : (
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClose={onClose}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div
              className="border-t px-4 py-2.5"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <button
                onClick={() => { onClose(); }}
                className="w-full text-center text-xs transition-colors"
                style={{ color: "hsl(var(--primary))" }}
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-lg px-3 py-2.5">
          <div className="skeleton h-6 w-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-full rounded" />
            <div className="skeleton h-2 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelEmpty({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Inbox className="h-5 w-5" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
        {unreadOnly ? "No unread notifications" : "You're all caught up"}
      </p>
    </div>
  );
}
