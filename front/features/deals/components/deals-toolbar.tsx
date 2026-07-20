"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Can } from "@/components/auth/can";
import { STAGE_CONFIG, ORDERED_STAGES } from "./kanban-config";
import type { DealStage } from "../types";

interface DealsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  stageFilter?: DealStage;
  onStageChange: (s: DealStage | undefined) => void;
  totalDeals?: number;
  isLoading?: boolean;
  onCreate: () => void;
}

export function DealsToolbar({
  search, onSearchChange, stageFilter, onStageChange,
  totalDeals, isLoading, onCreate,
}: DealsToolbarProps) {
  const hasFilters = !!search || !!stageFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[180px] max-w-xs">
        <Input
          placeholder="Search deals…"
          startIcon={<Search className="h-3.5 w-3.5" />}
          endIcon={search ? (
            <button onClick={() => onSearchChange("")} aria-label="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 text-sm"
          style={{ background: "hsl(var(--muted) / 0.4)", borderColor: "transparent" }}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            style={stageFilter ? { borderColor: STAGE_CONFIG[stageFilter].color, color: STAGE_CONFIG[stageFilter].color } : {}}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {stageFilter ? STAGE_CONFIG[stageFilter].label : "Stage"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>Filter by stage</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ORDERED_STAGES.map((s) => (
            <DropdownMenuCheckboxItem
              key={s}
              checked={stageFilter === s}
              onCheckedChange={(checked) => onStageChange(checked ? s : undefined)}
            >
              <span className="mr-2 h-2 w-2 rounded-full" style={{ background: STAGE_CONFIG[s].color }} />
              {STAGE_CONFIG[s].label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs whitespace-nowrap"
              onClick={() => { onSearchChange(""); onStageChange(undefined); }}
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      <AnimatePresence mode="wait">
        {!isLoading && totalDeals !== undefined && (
          <motion.span
            key={totalDeals}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden text-xs sm:block"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""}
          </motion.span>
        )}
      </AnimatePresence>

      {/* ── Create deal — gated on deals.write ─────────────────── */}
      <Can permission="deals.write">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" />
          New deal
        </Button>
      </Can>
    </div>
  );
}
