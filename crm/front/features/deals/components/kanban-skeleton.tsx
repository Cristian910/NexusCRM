"use client";

import React from "react";
import { ORDERED_STAGES } from "./kanban-config";

const CARD_COUNTS = [3, 2, 4, 1, 2]; // rough per-column skeleton count

export function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-1">
      {ORDERED_STAGES.map((stage, ci) => (
        <div
          key={stage}
          className="flex w-[272px] shrink-0 flex-col rounded-xl border"
          style={{
            background: "hsl(var(--muted) / 0.3)",
            borderColor: "hsl(var(--border))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-4 w-5 rounded-full" />
            </div>
            <div className="skeleton h-5 w-5 rounded" />
          </div>
          {/* Value */}
          <div
            className="border-b px-3 pb-2.5"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div className="skeleton h-3 w-16 rounded" />
          </div>
          {/* Cards */}
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: CARD_COUNTS[ci] ?? 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 space-y-2"
                style={{
                  background: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <div className="flex gap-2">
                  <div className="skeleton h-3 w-2 rounded" style={{ marginTop: 2 }} />
                  <div className="space-y-1.5 flex-1">
                    <div className="skeleton h-3.5 w-full rounded" />
                    {i % 2 === 0 && <div className="skeleton h-3 w-3/4 rounded" />}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
