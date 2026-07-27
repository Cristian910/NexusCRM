"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, DollarSign, Calendar, TrendingUp, User,
  Building2, FileText, Pencil, Trash2, ArrowRight,
} from "lucide-react";
import { useDeal, useDeleteDeal } from "../hooks/use-deals";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { STAGE_CONFIG, ORDERED_STAGES } from "./kanban-config";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { Deal } from "../types";

interface DealDrawerProps {
  dealId: string | null;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
}

export function DealDrawer({ dealId, onClose, onEdit }: DealDrawerProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: deal, isLoading } = useDeal(dealId ?? "");
  const deleteMut = useDeleteDeal();

  const handleDelete = () => {
    if (!deal) return;
    deleteMut.mutate(deal.id, {
      onSuccess: () => { setConfirmDelete(false); onClose(); },
    });
  };

  const cfg = deal ? STAGE_CONFIG[deal.stage] : null;

  return (
    <>
      <AnimatePresence>
        {dealId && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              className="fixed inset-0 z-40"
              style={{ background: "hsl(0 0% 0% / 0.4)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Drawer panel — slides in from right */}
            <motion.div
              key="drawer-panel"
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l"
              style={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                boxShadow: "-8px 0 32px hsl(0 0% 0% / 0.2)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between border-b px-5 py-4 shrink-0"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {t("deals.dealDetails")}
                </h2>
                <div className="flex items-center gap-1">
                  {deal && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { onEdit(deal); onClose(); }}
                        aria-label={t("deals.editDeal")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmDelete(true)}
                        aria-label={t("deals.deleteDeal")}
                        style={{ color: "hsl(var(--destructive))" }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("common.close")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {isLoading ? (
                  <DrawerSkeleton />
                ) : !deal ? (
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {t("deals.dealNotFound")}
                  </p>
                ) : (
                  <>
                    {/* Title + stage */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h1
                          className="text-lg font-semibold leading-snug"
                          style={{ color: "hsl(var(--foreground))" }}
                        >
                          {deal.title}
                        </h1>
                        <span
                          className="mt-0.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: `${cfg?.color}18`,
                            borderColor: `${cfg?.color}40`,
                            color: cfg?.color,
                          }}
                        >
                          {t(`deals.stages.${deal.stage}`)}
                        </span>
                      </div>
                    </div>

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <Metric
                        icon={<DollarSign className="h-3.5 w-3.5" />}
                        label={t("deals.value")}
                        value={formatCurrency(deal.value ?? 0)}
                        emphasis
                      />
                      {deal.probability !== undefined && (
                        <Metric
                          icon={<TrendingUp className="h-3.5 w-3.5" />}
                          label={t("deals.probability")}
                          value={`${deal.probability}%`}
                        />
                      )}
                      {deal.expectedCloseDate && (
                        <Metric
                          icon={<Calendar className="h-3.5 w-3.5" />}
                          label={t("deals.expectedClose")}
                          value={formatDate(deal.expectedCloseDate, "MMM d, yyyy")}
                        />
                      )}
                      <Metric
                        icon={<Calendar className="h-3.5 w-3.5" />}
                        label={t("deals.created")}
                        value={formatDate(deal.createdAt, "MMM d, yyyy")}
                      />
                    </div>

                    {/* Client info */}
                    {deal.client && (
                      <div
                        className="rounded-lg border p-3.5 space-y-2"
                        style={{
                          borderColor: "hsl(var(--border))",
                          background: "hsl(var(--muted) / 0.3)",
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {t("deals.client")}
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                          <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                            {deal.client.name}
                          </span>
                        </div>
                        {deal.client.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                            <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {deal.client.company}
                            </span>
                          </div>
                        )}
                        {deal.client.email && (
                          <a
                            href={`mailto:${deal.client.email}`}
                            className="text-xs transition-colors hover:underline"
                            style={{ color: "hsl(var(--primary))" }}
                          >
                            {deal.client.email}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Stage pipeline */}
                    <div>
                      <p
                        className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {t("deals.pipelineProgress")}
                      </p>
                      <div className="flex items-center gap-1">
                        {ORDERED_STAGES.map((s, i) => {
                          const stageCfg = STAGE_CONFIG[s];
                          const isActive = s === deal.stage;
                          const isPast = ORDERED_STAGES.indexOf(s) < ORDERED_STAGES.indexOf(deal.stage);
                          return (
                            <React.Fragment key={s}>
                              <div
                                className="flex-1 rounded text-center py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors"
                                style={{
                                  background: isActive
                                    ? stageCfg.color
                                    : isPast
                                    ? `${stageCfg.color}30`
                                    : "hsl(var(--muted))",
                                  color: isActive
                                    ? "#fff"
                                    : isPast
                                    ? stageCfg.color
                                    : "hsl(var(--muted-foreground))",
                                }}
                              >
                                {t(`deals.stagesShort.${s}`)}
                              </div>
                              {i < ORDERED_STAGES.length - 1 && (
                                <ArrowRight
                                  className="h-2.5 w-2.5 shrink-0"
                                  style={{ color: "hsl(var(--muted-foreground))" }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    {deal.notes && (
                      <div>
                        <p
                          className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          <FileText className="h-3 w-3" />
                          {t("deals.notes")}
                        </p>
                        <p
                          className="text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: "hsl(var(--foreground))" }}
                        >
                          {deal.notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete}
        title={t("deals.deleteDealTitle", { title: deal?.title ?? "" })}
        description={t("deals.deleteDealDescription")}
        confirmLabel={t("deals.deleteDeal")}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        isLoading={deleteMut.isPending}
      />
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function Metric({ icon, label, value, emphasis }: {
  icon: React.ReactNode; label: string; value: string; emphasis?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.25)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: "hsl(var(--muted-foreground))" }}>{icon}</span>
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {label}
        </span>
      </div>
      <p
        className="font-mono text-sm font-semibold tabular-nums"
        style={{
          color: emphasis ? "hsl(var(--primary))" : "hsl(var(--foreground))",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-24 rounded-lg" />
      <div className="skeleton h-10 w-full rounded" />
    </div>
  );
}
