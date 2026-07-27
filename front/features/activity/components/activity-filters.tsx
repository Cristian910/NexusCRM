"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { ACTIVITY_CONFIG } from "./activity-config";
import { useTranslation } from "@/lib/i18n/context";
import type { ActivityType, EntityType } from "@/types/activity";

const ENTITY_VALUES: EntityType[] = ["CLIENT", "DEAL", "TASK", "USER"];

interface ActivityFiltersProps {
  activityType: ActivityType | undefined;
  entityType: EntityType | undefined;
  onActivityTypeChange: (v: ActivityType | undefined) => void;
  onEntityTypeChange: (v: EntityType | undefined) => void;
  totalCount?: number;
  isLoading?: boolean;
}

export function ActivityFilters({
  activityType, entityType,
  onActivityTypeChange, onEntityTypeChange,
  totalCount, isLoading,
}: ActivityFiltersProps) {
  const { t } = useTranslation();
  const hasFilters = !!activityType || !!entityType;

  const activityTypes = Object.keys(ACTIVITY_CONFIG).slice(0, 8) as ActivityType[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Activity type filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            style={activityType ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } : {}}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activityType ? t(`activity.types.${activityType}`) : t("activity.typeFilterLabel")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>{t("activity.filterByType")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activityTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={activityType === type}
              onCheckedChange={(checked) => onActivityTypeChange(checked ? type : undefined)}
            >
              <span className="mr-2">{ACTIVITY_CONFIG[type].icon}</span>
              {t(`activity.types.${type}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Entity type filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            style={entityType ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } : {}}
          >
            {entityType ? t(`activity.entities.${entityType}`) : t("activity.entityFilterLabel")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel>{t("activity.filterByEntity")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ENTITY_VALUES.map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={entityType === value}
              onCheckedChange={(checked) => onEntityTypeChange(checked ? value : undefined)}
            >
              {t(`activity.entities.${value}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs whitespace-nowrap"
              onClick={() => { onActivityTypeChange(undefined); onEntityTypeChange(undefined); }}
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <X className="h-3 w-3" /> {t("activity.clear")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      <AnimatePresence mode="wait">
        {!isLoading && totalCount !== undefined && (
          <motion.span
            key={totalCount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs tabular-nums"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {totalCount === 1
              ? t("activity.eventCountSingular", { count: totalCount })
              : t("activity.eventCountPlural", { count: totalCount })}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
