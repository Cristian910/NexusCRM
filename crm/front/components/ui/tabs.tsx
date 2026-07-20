"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Unique per Tabs instance on the page — keeps the underline animation isolated */
  layoutId?: string;
  className?: string;
}

export function Tabs({ items, value, onChange, layoutId = "tabs-underline", className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex items-center gap-1 border-b overflow-x-auto", className)}
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className="relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {item.label}
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                style={{ background: "hsl(var(--primary))" }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
