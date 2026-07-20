"use client";

import React from "react";
import type { TaskStatus } from "../types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  PENDING: {
    label:  "Pending",
    dot:    "hsl(var(--muted-foreground))",
    text:   "hsl(var(--muted-foreground))",
    bg:     "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  IN_PROGRESS: {
    label:  "In progress",
    dot:    "hsl(221 83% 60%)",
    text:   "hsl(221 83% 65%)",
    bg:     "hsl(221 83% 60% / 0.1)",
    border: "hsl(221 83% 60% / 0.25)",
  },
  COMPLETED: {
    label:  "Completed",
    dot:    "hsl(142 71% 45%)",
    text:   "hsl(142 71% 50%)",
    bg:     "hsl(142 71% 45% / 0.1)",
    border: "hsl(142 71% 45% / 0.25)",
  },
  CANCELLED: {
    label:  "Cancelled",
    dot:    "hsl(0 72% 55%)",
    text:   "hsl(0 72% 60%)",
    bg:     "hsl(0 72% 55% / 0.1)",
    border: "hsl(0 72% 55% / 0.25)",
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
