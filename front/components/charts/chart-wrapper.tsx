"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface ChartWrapperProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartWrapper({
  title, description, action, children, className, height = 280,
}: ChartWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("rounded-xl border flex flex-col", className)}
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--card))",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold leading-none tracking-tight truncate"
            style={{ color: "hsl(var(--foreground))" }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="mt-1 text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Chart area */}
      <div className="px-1 pb-4 flex-1" style={{ minHeight: height }}>
        {children}
      </div>
    </motion.div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────────
export function ChartSkeleton({ height = 280, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn("rounded-xl border p-5 flex flex-col gap-4", className)}
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--card))",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
        <div className="skeleton h-7 w-20 rounded-md" />
      </div>
      <div className="skeleton rounded-lg flex-1" style={{ height }} />
    </div>
  );
}

// ── Chart empty state ─────────────────────────────────────────────
export function ChartEmpty({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 rounded-lg"
      style={{ background: "hsl(var(--muted) / 0.3)" }}
    >
      <svg
        width="40" height="40" viewBox="0 0 40 40" fill="none"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <rect x="4" y="24" width="6" height="12" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="13" y="16" width="6" height="20" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="22" y="20" width="6" height="16" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="31" y="10" width="6" height="26" rx="1" fill="currentColor" opacity="0.3" />
      </svg>
      <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{message ?? t("analytics.noDataForPeriod")}</p>
    </div>
  );
}

// ── Chart error state ─────────────────────────────────────────────
export function ChartError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--destructive) / 0.1)" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="hsl(var(--destructive))" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {t("analytics.failedToLoad")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs transition-colors"
            style={{ color: "hsl(var(--primary))" }}
          >
            {t("analytics.tryAgain")}
          </button>
        )}
      </div>
    </div>
  );
}
