"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

const COLUMNS = [
  {
    label: "Lead", color: "hsl(var(--stage-lead))",
    deals: [
      { name: "Fintra Labs", value: "$8,200" },
      { name: "Orbit Retail", value: "$14,000" },
    ],
  },
  {
    label: "Contacted", color: "hsl(var(--stage-contacted))",
    deals: [
      { name: "Solace Health", value: "$31,500" },
    ],
  },
  {
    label: "Negotiation", color: "hsl(var(--stage-negotiation))",
    deals: [
      { name: "Acme Corp", value: "$24,000" },
      { name: "Nova Freight", value: "$52,300" },
    ],
  },
  {
    label: "Won", color: "hsl(var(--stage-won))",
    deals: [
      { name: "Brightside Co", value: "$19,800" },
    ],
  },
];

export function KanbanPreview() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: "hsl(var(--border))",
        background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--card) / 0.6))",
        boxShadow: "0 32px 80px -24px hsl(228 60% 2% / 0.6)",
      }}
      aria-hidden="true"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
        {COLUMNS.map((col, ci) => (
          <div key={col.label} className="min-w-0">
            <div
              className="mb-2.5 h-[2.5px] w-full rounded-full"
              style={{ background: col.color, opacity: 0.7 }}
            />
            <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: col.color }} />
              <span
                className="truncate text-[11px] font-medium uppercase tracking-wide"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {col.label}
              </span>
            </div>
            <div className="space-y-2">
              {col.deals.map((d, di) => (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + ci * 0.08 + di * 0.06 }}
                  className="rounded-lg border p-2.5"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.6)" }}
                >
                  <p className="truncate text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {d.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-[10px] tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Briefcase className="h-2.5 w-2.5" />
                    {d.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
