"use client";

import React from "react";
import type { Role } from "@/types";

const ROLE_CONFIG: Record<Role, { label: string; bg: string; text: string; border: string }> = {
  OWNER: {
    label:  "Owner",
    bg:     "hsl(262 73% 62% / 0.12)",
    text:   "hsl(262 73% 65%)",
    border: "hsl(262 73% 62% / 0.3)",
  },
  ADMIN: {
    label:  "Admin",
    bg:     "hsl(221 83% 53% / 0.12)",
    text:   "hsl(221 83% 60%)",
    border: "hsl(221 83% 53% / 0.3)",
  },
  MEMBER: {
    label:  "Member",
    bg:     "hsl(var(--muted))",
    text:   "hsl(var(--muted-foreground))",
    border: "hsl(var(--border))",
  },
  VIEWER: {
    label:  "Viewer",
    bg:     "hsl(215 16% 47% / 0.1)",
    text:   "hsl(215 16% 65%)",
    border: "hsl(215 16% 47% / 0.25)",
  },
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.MEMBER;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className ?? ""}`}
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
