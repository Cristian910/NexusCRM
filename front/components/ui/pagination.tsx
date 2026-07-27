"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  /** Noun for the range label — "Showing 1–10 of 40 {itemLabel}". Pass a translated string. */
  itemLabel?: string;
}

export function Pagination({
  page, totalPages, totalCount, limit, onPageChange, isLoading, itemLabel,
}: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, totalCount);

  // Show pages around current
  const pages: (number | "…")[] = [];
  const WINDOW = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - WINDOW && i <= page + WINDOW)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Range label */}
      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
        {t("common.showingRange", {
          from,
          to,
          total: totalCount.toLocaleString(),
          item: itemLabel ?? t("common.items"),
        })}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || isLoading}
          aria-label={t("common.firstPage")}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
          aria-label={t("common.previousPage")}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Page pills */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={isLoading}
              className="relative flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors"
              style={{
                color: p === page
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--foreground))",
              }}
            >
              {p === page && (
                <motion.div
                  layoutId="active-page"
                  className="absolute inset-0 rounded-md"
                  style={{ background: "hsl(var(--primary))" }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative z-10">{p}</span>
            </button>
          )
        )}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isLoading}
          aria-label={t("common.nextPage")}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || isLoading}
          aria-label={t("common.lastPage")}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
