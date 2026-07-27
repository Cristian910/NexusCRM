"use client";

import React from "react";
import { SlidersHorizontal, X, Plus, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Can } from "@/components/auth/can";
import { useTranslation } from "@/lib/i18n/context";
import type { TaskStatus } from "../types";

const STATUS_VALUES: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

interface TasksToolbarProps {
  statusFilter: TaskStatus | undefined;
  onStatusChange: (s: TaskStatus | undefined) => void;
  assignedToMe: boolean;
  onAssignedToMeChange: (v: boolean) => void;
  totalCount?: number;
  isLoading?: boolean;
  onCreate: () => void;
}

export function TasksToolbar({
  statusFilter, onStatusChange, assignedToMe, onAssignedToMeChange,
  totalCount, isLoading, onCreate,
}: TasksToolbarProps) {
  const { t } = useTranslation();
  const hasFilters = !!statusFilter || assignedToMe;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            style={statusFilter ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } : {}}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {statusFilter ? t(`tasks.status.${statusFilter}`) : t("tasks.statusFilterLabel")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>{t("tasks.filterByStatus")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_VALUES.map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={statusFilter === value}
              onCheckedChange={(checked) => onStatusChange(checked ? value : undefined)}
            >
              {t(`tasks.status.${value}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assigned to me toggle */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        style={assignedToMe ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } : {}}
        onClick={() => onAssignedToMeChange(!assignedToMe)}
        aria-pressed={assignedToMe}
      >
        <UserCheck className="h-3.5 w-3.5" />
        {t("tasks.assignedToMe")}
      </Button>

      {/* Clear filters */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              onClick={() => { onStatusChange(undefined); onAssignedToMeChange(false); }}
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <X className="h-3 w-3" /> {t("tasks.clear")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      <AnimatePresence mode="wait">
        {!isLoading && totalCount !== undefined && (
          <motion.span
            key={totalCount}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs tabular-nums hidden sm:block"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {totalCount === 1
              ? t("tasks.taskCountSingular", { count: totalCount })
              : t("tasks.taskCountPlural", { count: totalCount })}
          </motion.span>
        )}
      </AnimatePresence>

      <Can permission="tasks.write">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" />
          {t("tasks.newTask")}
        </Button>
      </Can>
    </div>
  );
}
