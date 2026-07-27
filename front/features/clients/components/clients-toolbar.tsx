"use client";

import React from "react";
import { Search, SlidersHorizontal, X, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Can } from "@/components/auth/can";
import { useTranslation } from "@/lib/i18n/context";
import type { ClientStatus } from "../types";

const STATUS_VALUES: ClientStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];

interface ClientsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: ClientStatus | undefined;
  onStatusChange: (s: ClientStatus | undefined) => void;
  totalCount?: number;
  isLoading?: boolean;
  onCreate: () => void;
}

export function ClientsToolbar({
  search, onSearchChange, statusFilter, onStatusChange,
  totalCount, isLoading, onCreate,
}: ClientsToolbarProps) {
  const { t } = useTranslation();
  const hasFilters = !!search || !!statusFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="flex-1 min-w-[200px] max-w-sm">
        <Input
          placeholder={t("clients.searchPlaceholder")}
          startIcon={<Search className="h-3.5 w-3.5" />}
          endIcon={
            search ? (
              <button
                onClick={() => onSearchChange("")}
                className="transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                aria-label={t("clients.clearSearch")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : undefined
          }
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 text-sm"
          style={{ background: "hsl(var(--muted) / 0.4)", borderColor: "transparent" }}
        />
      </div>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            style={
              statusFilter
                ? { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }
                : {}
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {statusFilter ? t(`clients.status.${statusFilter}`) : t("clients.statusFilterLabel")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel>{t("clients.filterByStatus")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_VALUES.map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={statusFilter === value}
              onCheckedChange={(checked) => onStatusChange(checked ? value : undefined)}
            >
              {t(`clients.status.${value}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs whitespace-nowrap"
              onClick={() => { onSearchChange(""); onStatusChange(undefined); }}
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <X className="h-3 w-3" /> {t("clients.clear")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* Count */}
      <AnimatePresence mode="wait">
        {!isLoading && totalCount !== undefined && (
          <motion.span
            key={totalCount}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs tabular-nums hidden sm:block"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {totalCount === 1
              ? t("clients.clientCountSingular", { count: totalCount })
              : t("clients.clientCountPlural", { count: totalCount })}
          </motion.span>
        )}
      </AnimatePresence>

      {/* ── Create button — gated on clients.write ─────────────── */}
      <Can permission="clients.write">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={onCreate}>
          <UserPlus className="h-3.5 w-3.5" />
          {t("clients.newClient")}
        </Button>
      </Can>
    </div>
  );
}
