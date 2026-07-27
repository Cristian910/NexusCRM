"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn, formatDate } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import type { DatePreset } from "../hooks/use-analytics-filters";

interface FilterBarProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  /** Current custom range, if any — used to show the picked dates on the "Custom" pill. */
  dateFrom?: string;
  dateTo?: string;
  /** Called when the person applies a custom date range from the popover. */
  onCustomRangeChange?: (dateFrom: string, dateTo: string) => void;
  loading?: boolean;
}

export function FilterBar({
  activePreset, onPresetChange, dateFrom, dateTo, onCustomRangeChange, loading,
}: FilterBarProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom ?? "");
  const [draftTo, setDraftTo] = useState(dateTo ?? "");

  const PRESETS: { label: string; value: DatePreset }[] = [
    { label: t("analytics.preset7d"),  value: "7d"  },
    { label: t("analytics.preset30d"), value: "30d" },
    { label: t("analytics.preset90d"), value: "90d" },
    { label: t("analytics.presetYtd"), value: "ytd" },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  const customLabel =
    activePreset === "custom" && dateFrom && dateTo
      ? `${formatDate(dateFrom, "MMM d")} – ${formatDate(dateTo, "MMM d")}`
      : t("analytics.custom");

  function openCustomPicker() {
    setDraftFrom(dateFrom ?? format(new Date(), "yyyy-MM-dd"));
    setDraftTo(dateTo ?? format(new Date(), "yyyy-MM-dd"));
    setPopoverOpen(true);
  }

  function applyCustomRange() {
    if (!draftFrom || !draftTo || !onCustomRangeChange) return;
    // Swap if the person picked them backwards — no need to make them redo it.
    const [from, to] = draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
    onCustomRangeChange(from, to);
    setPopoverOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date preset pills */}
      <div
        className="flex items-center rounded-lg p-0.5 gap-0.5"
        style={{ background: "hsl(var(--muted))" }}
        role="group"
        aria-label={t("common.dateRange")}
      >
        <CalendarDays
          className="ml-2 mr-1 h-3.5 w-3.5 shrink-0"
          style={{ color: "hsl(var(--muted-foreground))" }}
        />
        {PRESETS.map(({ label, value }) => {
          const active = activePreset === value;
          return (
            <button
              key={value}
              onClick={() => onPresetChange(value)}
              className={cn(
                "relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2"
              )}
              style={{
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {active && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 rounded-md"
                  style={{ background: "hsl(var(--background))", boxShadow: "0 1px 3px hsl(0 0% 0% / 0.15)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}

        {/* Custom range — only shown when the parent wired up onCustomRangeChange */}
        {onCustomRangeChange && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={openCustomPicker}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap",
                  "focus:outline-none focus-visible:ring-2"
                )}
                style={{
                  color: activePreset === "custom"
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {activePreset === "custom" && (
                  <motion.div
                    layoutId="filter-active"
                    className="absolute inset-0 rounded-md"
                    style={{ background: "hsl(var(--background))", boxShadow: "0 1px 3px hsl(0 0% 0% / 0.15)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative z-10">{customLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <p className="mb-3 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {t("analytics.pickDateRange")}
              </p>
              <p className="mb-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t("analytics.singleDayHint")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {t("analytics.from")}
                  </label>
                  <input
                    type="date"
                    value={draftFrom}
                    max={draftTo || undefined}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    className="w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {t("analytics.to")}
                  </label>
                  <input
                    type="date"
                    value={draftTo}
                    min={draftFrom || undefined}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPopoverOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={applyCustomRange} disabled={!draftFrom || !draftTo}>
                  <Check className="h-3.5 w-3.5" />
                  {t("analytics.apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          borderColor: "hsl(var(--border))",
          background: "hsl(var(--card))",
          color: "hsl(var(--muted-foreground))",
        }}
        aria-label={t("common.refreshData")}
      >
        <RefreshCw
          className={cn("h-3 w-3", loading && "animate-spin")}
        />
        Refresh
      </button>
    </div>
  );
}
