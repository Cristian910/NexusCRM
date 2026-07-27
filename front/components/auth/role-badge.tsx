"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import type { Role } from "@/types";

const ROLE_CONFIG: Record<Role, { bg: string; text: string; border: string }> = {
  OWNER: {
    bg:     "hsl(var(--stage-contacted) / 0.12)",
    text:   "hsl(var(--stage-contacted))",
    border: "hsl(var(--stage-contacted) / 0.3)",
  },
  ADMIN: {
    bg:     "hsl(var(--primary) / 0.12)",
    text:   "hsl(var(--primary))",
    border: "hsl(var(--primary) / 0.3)",
  },
  MEMBER: {
    bg:     "hsl(var(--muted))",
    text:   "hsl(var(--muted-foreground))",
    border: "hsl(var(--border))",
  },
  VIEWER: {
    bg:     "hsl(220 12% 55% / 0.12)",
    text:   "hsl(220 12% 65%)",
    border: "hsl(220 12% 55% / 0.25)",
  },
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation();
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.MEMBER;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className ?? ""}`}
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
