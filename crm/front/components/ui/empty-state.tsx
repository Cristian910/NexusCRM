"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Use a smaller footprint — for tight spaces like a kanban column */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon, title, description, action, className, compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
        className
      )}
    >
      <div
        className={cn("flex items-center justify-center rounded-xl", compact ? "h-9 w-9" : "h-11 w-11")}
        style={{ background: "hsl(var(--muted))" }}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {title}
        </p>
        {description && (
          <p
            className="max-w-[280px] text-xs leading-relaxed"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
