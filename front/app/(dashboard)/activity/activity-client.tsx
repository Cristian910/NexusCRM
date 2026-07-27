"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ActivityTable } from "@/features/activity/components/activity-table";
import { ActivityFilters } from "@/features/activity/components/activity-filters";
import { useActivity } from "@/features/activity/hooks/use-activity";
import { Pagination } from "@/components/ui/pagination";
import { useTranslation } from "@/lib/i18n/context";
import type { ActivityType, EntityType } from "@/types/activity";

const LIMIT = 30;

export function ActivityClient() {
  const { t } = useTranslation();
  const [activityType, setActivityType] = useState<ActivityType | undefined>();
  const [entityType, setEntityType]     = useState<EntityType | undefined>();
  const [page, setPage]                 = useState(1);

  const handleTypeChange = useCallback((v: ActivityType | undefined) => { setActivityType(v); setPage(1); }, []);
  const handleEntityChange = useCallback((v: EntityType | undefined) => { setEntityType(v); setPage(1); }, []);

  const { data, isLoading } = useActivity({
    type: activityType,
    entityType,
    page,
    limit: LIMIT,
  });

  const total      = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <ProtectedRoute permission="analytics.read">
      <div className="space-y-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <PageHeader
            title={t("activity.pageTitle")}
            description={t("activity.pageDescription")}
          />
        </motion.div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "hsl(var(--success))" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: "hsl(var(--success))" }}
            />
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("activity.liveIndicator")}
          </span>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
        >
          <ActivityFilters
            activityType={activityType}
            entityType={entityType}
            onActivityTypeChange={handleTypeChange}
            onEntityTypeChange={handleEntityChange}
            totalCount={total}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
        >
          <ActivityTable filters={{ type: activityType, entityType, page, limit: LIMIT }} />
        </motion.div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.12 }}
          >
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={total}
              limit={LIMIT}
              onPageChange={setPage}
              isLoading={isLoading}
              itemLabel={t("common.items")}
            />
          </motion.div>
        )}
      </div>
    </ProtectedRoute>
  );
}
