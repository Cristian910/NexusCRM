"use client";

import React from "react";
import type { ClientStatus } from "../types";

const STATUS_CONFIG: Record<ClientStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ACTIVE: {
    label:  "Active",
    dot:    "hsl(142 71% 45%)",
    text:   "hsl(142 71% 42%)",
    bg:     "hsl(142 71% 45% / 0.1)",
    border: "hsl(142 71% 45% / 0.25)",
  },
  INACTIVE: {
    label:  "Inactive",
    dot:    "hsl(var(--muted-foreground))",
    text:   "hsl(var(--muted-foreground))",
    bg:     "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  ARCHIVED: {
    label:  "Archived",
    dot:    "hsl(43 96% 56%)",
    text:   "hsl(43 80% 45%)",
    bg:     "hsl(43 96% 56% / 0.1)",
    border: "hsl(43 96% 56% / 0.25)",
  },
};

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}
