"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, GripVertical, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STAGE_CONFIG } from "./kanban-config";
import type { Deal } from "../types";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  isDragging?: boolean;
}

// React's CSSProperties doesn't type custom properties (--foo) — extend it
// rather than reaching for `any` whenever we need to set one inline.
type CSSVarStyle = React.CSSProperties & { [key: `--${string}`]: string | number | undefined };

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
    data: { type: "deal", deal },
  });

  const dragging = isDragging || isSortableDragging;
  const cfg = STAGE_CONFIG[deal.stage];

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: dragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        layoutId={`deal-${deal.id}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "group relative rounded-lg border cursor-pointer select-none",
          "transition-shadow duration-150",
          dragging
            ? "shadow-2xl ring-2 scale-[1.02]"
            : "hover:shadow-md"
        )}
        style={{
          background: "hsl(var(--card))",
          borderColor: dragging ? cfg.color : "hsl(var(--border))",
          boxShadow: dragging
            ? `0 16px 32px -4px hsl(0 0% 0% / 0.35), 0 0 0 1px ${cfg.color}`
            : undefined,
          "--tw-ring-color": cfg.color,
        } as CSSVarStyle}
        onClick={() => !dragging && onClick(deal)}
        whileHover={{ y: -1 }}
      >
        {/* Stage accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
          style={{ background: cfg.color }}
        />

        {/* Content */}
        <div className="px-3.5 py-3 pl-5">
          {/* Drag handle + title row */}
          <div className="flex items-start gap-2">
            <button
              className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
              style={{ color: "hsl(var(--muted-foreground))" }}
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>

            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium leading-snug line-clamp-2"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {deal.title}
              </p>

              {/* Client name */}
              {deal.client && (
                <div className="mt-1 flex items-center gap-1">
                  <User
                    className="h-3 w-3 shrink-0"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <span
                    className="text-xs truncate"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {deal.client.name}
                    {deal.client.company ? ` · ${deal.client.company}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer: value + date */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {formatCurrency(deal.value ?? 0)}
            </span>

            <div className="flex items-center gap-2">
              {/* Probability pill */}
              {deal.probability !== undefined && (
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `${cfg.color}18`,
                    color: cfg.color,
                  }}
                >
                  <TrendingUp className="h-2.5 w-2.5" />
                  {deal.probability}%
                </span>
              )}

              {/* Due date */}
              {deal.expectedCloseDate && (
                <div
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDate(deal.expectedCloseDate, "MMM d")}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Drag overlay clone — shown while dragging ─────────────────────
export function DealCardOverlay({ deal }: { deal: Deal }) {
  const cfg = STAGE_CONFIG[deal.stage];
  return (
    <div
      className="rotate-2 rounded-lg border"
      style={{
        background: "hsl(var(--card))",
        borderColor: cfg.color,
        boxShadow: `0 20px 40px -8px hsl(0 0% 0% / 0.5), 0 0 0 1px ${cfg.color}`,
        minWidth: 220,
      }}
    >
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg" style={{ background: cfg.color }} />
      <div className="px-3.5 py-3 pl-5">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          {deal.title}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: cfg.color }}>
          {formatCurrency(deal.value ?? 0)}
        </p>
      </div>
    </div>
  );
}
