"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import type { TaskStatus } from "../types";

const STATUS_CONFIG: Record<TaskStatus, { dot: string; text: string; bg: string; border: string }> = {
  PENDING: {
    dot:    "hsl(var(--muted-foreground))",
    text:   "hsl(var(--muted-foreground))",
    bg:     "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  IN_PROGRESS: {
    dot:    "hsl(var(--stage-contacted))",
    text:   "hsl(var(--stage-contacted))",
    bg:     "hsl(var(--stage-contacted) / 0.12)",
    border: "hsl(var(--stage-contacted) / 0.3)",
  },
  COMPLETED: {
    dot:    "hsl(var(--success))",
    text:   "hsl(var(--success))",
    bg:     "hsl(var(--success) / 0.12)",
    border: "hsl(var(--success) / 0.3)",
  },
  CANCELLED: {
    dot:    "hsl(var(--destructive))",
    text:   "hsl(var(--destructive))",
    bg:     "hsl(var(--destructive) / 0.1)",
    border: "hsl(var(--destructive) / 0.25)",
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} aria-hidden="true" />
      {t(`tasks.status.${status}`)}
    </span>
  );
}
