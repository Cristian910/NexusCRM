"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Inbox } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
  useNotifications,
  useMarkAllAsRead,
} from "@/features/notifications/hooks/use-notifications";
import { Pagination } from "@/components/ui/pagination";
import { useTranslation } from "@/lib/i18n/context";

const LIMIT = 20;

export function NotificationsClient() {
  const { t } = useTranslation();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotifications({ unreadOnly, page, limit: LIMIT });
  const markAllRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const total      = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-4 pb-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <PageHeader
          title={t("notifications.pageTitle")}
          description={t("notifications.pageDescription")}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: unreadOnly ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: unreadOnly ? "hsl(var(--primary) / 0.1)" : "transparent",
                  color: unreadOnly ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                {t("notifications.unreadOnly")}
              </button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                {t("notifications.markAllRead")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.06 }}
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
      >
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <NotificationsEmpty unreadOnly={unreadOnly} />
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <div key={n.id} className="px-2 py-1">
                  <NotificationItem notification={n} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {!isLoading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={total}
          limit={LIMIT}
          onPageChange={setPage}
          isLoading={isLoading}
          itemLabel={t("common.items")}
        />
      )}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-5 py-4">
          <div className="skeleton h-6 w-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-2.5 w-3/4 rounded" />
            <div className="skeleton h-2 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsEmpty({ unreadOnly }: { unreadOnly: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Inbox className="h-7 w-7" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {unreadOnly ? t("notifications.noUnread") : t("notifications.allCaughtUp")}
        </p>
        <p className="mt-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {unreadOnly
            ? t("notifications.switchOffFilter")
            : t("notifications.newActivityHere")}
        </p>
      </div>
    </div>
  );
}
