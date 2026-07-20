"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { DealCard } from "./deal-card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Can } from "@/components/auth/can";
import type { KanbanColumn as KanbanColumnType, Deal } from "../types";

interface KanbanColumnProps {
  column: KanbanColumnType;
  isOver: boolean;
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stage: string) => void;
}

export function KanbanColumn({ column, isOver, onDealClick, onAddDeal }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.stage,
    data: { type: "column", stage: column.stage },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-[272px] shrink-0 flex-col rounded-xl border transition-colors duration-150"
      style={{
        background: isOver ? `${column.accent}` : "hsl(var(--muted) / 0.3)",
        borderColor: isOver ? column.color : "hsl(var(--border))",
        boxShadow: isOver ? `0 0 0 1px ${column.color}, inset 0 0 0 1px ${column.color}` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: column.color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--foreground))" }}>
            {column.label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ background: `${column.color}20`, color: column.color }}
          >
            {column.deals.length}
          </span>
        </div>

        {/* Add deal — gated on deals.write */}
        <Can permission="deals.write">
          <button
            onClick={() => onAddDeal(column.stage)}
            className="rounded-md p-1 transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}
            aria-label={`Add deal to ${column.label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Can>
      </div>

      {/* Value */}
      <div className="border-b px-3 pb-2.5" style={{ borderColor: "hsl(var(--border))" }}>
        <span className="text-xs tabular-nums font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
          {formatCurrency(column.totalValue)}
        </span>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        style={{ minHeight: 120, maxHeight: "calc(100vh - 280px)" }}
      >
        <SortableContext items={column.deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {column.deals.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors")}
                style={{
                  borderColor: isOver ? column.color : "hsl(var(--border))",
                  background: isOver ? `${column.color}08` : "transparent",
                }}
              >
                <p className="text-[11px]" style={{ color: isOver ? column.color : "hsl(var(--muted-foreground))" }}>
                  {isOver ? "Drop here" : "No deals"}
                </p>
              </motion.div>
            ) : (
              column.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </div>
    </motion.div>
  );
}
