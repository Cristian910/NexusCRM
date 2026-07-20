"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;            // positive = growth, negative = decline, undefined = no trend
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
  index?: number;             // for staggered entrance animation
  loading?: boolean;
}

export function KpiCard({
  title, value, subtitle, change, changeLabel,
  icon, iconColor = "hsl(var(--primary))", index = 0, loading,
}: KpiCardProps) {
  if (loading) return <KpiCardSkeleton />;

  const hasTrend = change !== undefined;
  const positive = (change ?? 0) >= 0;
  const neutral  = change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-xl border p-5 transition-shadow duration-200 hover:shadow-lg"
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--card))",
        boxShadow: "0 0 0 1px hsl(var(--border)), 0 2px 4px -1px hsl(0 0% 0% / 0.08)",
      }}
    >
      {/* Subtle top-left glow on hover */}
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${iconColor}18 0%, transparent 70%)` }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-sm font-medium leading-none"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {title}
        </p>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ background: `${iconColor}18`, color: iconColor }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="mt-3">
        <p
          className="text-2xl font-bold tracking-tight tabular-nums"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {value}
        </p>
      </div>

      {/* Trend + subtitle */}
      <div className="mt-2 flex items-center gap-2">
        {hasTrend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium"
            )}
            style={{
              background: neutral
                ? "hsl(var(--muted))"
                : positive
                ? "hsl(142.1 76.2% 36.3% / 0.12)"
                : "hsl(0 72.2% 50.6% / 0.12)",
              color: neutral
                ? "hsl(var(--muted-foreground))"
                : positive
                ? "hsl(142.1 76.2% 46.3%)"
                : "hsl(0 72.2% 60.6%)",
            }}
          >
            {neutral ? (
              <Minus className="h-3 w-3" />
            ) : positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change ?? 0).toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span
            className="text-xs truncate"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {subtitle}
          </span>
        )}
        {changeLabel && !subtitle && (
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {changeLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function KpiCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-5 space-y-3"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      <div className="flex items-start justify-between">
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-36 rounded" />
      <div className="flex items-center gap-2">
        <div className="skeleton h-5 w-16 rounded-md" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  );
}
