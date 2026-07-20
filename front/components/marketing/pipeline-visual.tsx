"use client";

import React from "react";
import { motion } from "framer-motion";

// Mirrors the real stage set/colors from features/deals/components/kanban-config.ts
// (minus CLOSED_LOST — a forward-moving "deal closing" story doesn't loop through it)
const STAGES = [
  { label: "Lead",        color: "hsl(238 76% 65%)" },
  { label: "Contacted",   color: "hsl(262 73% 62%)" },
  { label: "Negotiation", color: "hsl(43 96% 56%)"  },
  { label: "Won",         color: "hsl(142 71% 45%)" },
];

const LOOP = { duration: 7, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const };

export function PipelineVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl py-8" aria-hidden="true">
      <div className="relative h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(238 76% 65%), hsl(142 71% 45%))" }}
          animate={{ width: ["3%", "100%"] }}
          transition={LOOP}
        />
        <motion.div
          className="absolute -top-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border px-2.5 py-1.5"
          style={{
            background: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            boxShadow: "0 8px 24px -6px hsl(0 0% 0% / 0.45)",
          }}
          animate={{ left: ["3%", "100%"] }}
          transition={LOOP}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(142 71% 45%)" }} />
          <span className="whitespace-nowrap text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
            Acme Corp
          </span>
          <span className="whitespace-nowrap font-mono text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            $24,000
          </span>
        </motion.div>
      </div>

      <div className="mt-5 flex justify-between">
        {STAGES.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5">
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            />
            <span
              className="text-center font-mono text-[10px] uppercase tracking-wider sm:text-[11px]"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
