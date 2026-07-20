"use client";

import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { DatePreset } from "../hooks/use-analytics-filters";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "7 days",  value: "7d"  },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "This year", value: "ytd" },
];

interface FilterBarProps {
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  loading?: boolean;
}

export function FilterBar({ activePreset, onPresetChange, loading }: FilterBarProps) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date preset pills */}
      <div
        className="flex items-center rounded-lg p-0.5 gap-0.5"
        style={{ background: "hsl(var(--muted))" }}
        role="group"
        aria-label="Date range"
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
        aria-label="Refresh data"
      >
        <RefreshCw
          className={cn("h-3 w-3", loading && "animate-spin")}
        />
        Refresh
      </button>
    </div>
  );
}
