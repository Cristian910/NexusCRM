"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import type { ClientStatus } from "../types";

const STATUS_CONFIG: Record<ClientStatus, { dot: string; text: string; bg: string; border: string }> = {
  ACTIVE: {
    dot:    "hsl(var(--success))",
    text:   "hsl(var(--success))",
    bg:     "hsl(var(--success) / 0.1)",
    border: "hsl(var(--success) / 0.25)",
  },
  INACTIVE: {
    dot:    "hsl(var(--muted-foreground))",
    text:   "hsl(var(--muted-foreground))",
    bg:     "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  ARCHIVED: {
    dot:    "hsl(var(--warning))",
    text:   "hsl(var(--warning))",
    bg:     "hsl(var(--warning) / 0.12)",
    border: "hsl(var(--warning) / 0.3)",
  },
};

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const { t } = useTranslation();
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
      {t(`clients.status.${status}`)}
    </span>
  );
}
