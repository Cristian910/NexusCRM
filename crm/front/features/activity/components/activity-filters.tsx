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
import type { ActivityType, EntityType } from "@/types/activity";

const ENTITY_OPTIONS: { label: string; value: EntityType }[] = [
  { label: "Clients", value: "CLIENT" },
  { label: "Deals",   value: "DEAL"   },
  { label: "Tasks",   value: "TASK"   },
  { label: "Users",   value: "USER"   },
];

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
  const hasFilters = !!activityType || !!entityType;

  const activityEntries = Object.entries(ACTIVITY_CONFIG).slice(0, 8) as [ActivityType, typeof ACTIVITY_CONFIG[ActivityType]][];

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
            {activityType ? ACTIVITY_CONFIG[activityType]?.label : "Activity type"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activityEntries.map(([type, cfg]) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={activityType === type}
              onCheckedChange={(checked) => onActivityTypeChange(checked ? type : undefined)}
            >
              <span className="mr-2">{cfg.icon}</span>
              {cfg.label}
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
            {entityType
              ? ENTITY_OPTIONS.find((e) => e.value === entityType)?.label
              : "Entity"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel>Filter by entity</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ENTITY_OPTIONS.map(({ label, value }) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={entityType === value}
              onCheckedChange={(checked) => onEntityTypeChange(checked ? value : undefined)}
            >
              {label}
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
              <X className="h-3 w-3" /> Clear
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
            {totalCount.toLocaleString()} event{totalCount !== 1 ? "s" : ""}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
