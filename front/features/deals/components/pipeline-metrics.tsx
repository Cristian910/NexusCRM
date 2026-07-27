"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { Deal } from "../types";

interface PipelineMetricsProps {
  deals: Deal[];
}

export function PipelineMetrics({ deals }: PipelineMetricsProps) {
  const { t } = useTranslation();
  const totalValue   = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const wonValue     = deals.filter((d) => d.stage === "CLOSED_WON")
                           .reduce((s, d) => s + (d.value ?? 0), 0);
  const openDeals    = deals.filter((d) =>
    d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST"
  ).length;
  const convRate     = deals.length
    ? ((deals.filter((d) => d.stage === "CLOSED_WON").length / deals.length) * 100).toFixed(0)
    : "0";

  const metrics = [
    { label: t("deals.metricPipeline"), value: formatCurrency(totalValue), sub: t("deals.metricPipelineSub", { count: deals.length }) },
    { label: t("deals.metricWon"),      value: formatCurrency(wonValue),   sub: t("deals.metricWonSub", { rate: convRate }) },
    { label: t("deals.metricOpen"),     value: String(openDeals),          sub: t("deals.metricOpenSub") },
  ];

  return (
    <div
      className="grid grid-cols-3 divide-x rounded-xl border overflow-hidden"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {metrics.map(({ label, value, sub }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.18 }}
          className="px-4 py-3"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            {label}
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
            {value}
          </p>
          <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
