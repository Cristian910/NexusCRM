"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DealForm, type DealFormDefaults } from "./deal-form";
import { useCreateDeal, useUpdateDeal } from "../hooks/use-deals";
import type { CreateDealValues } from "../schemas/deal.schema";
import type { Deal, DealStage } from "../types";

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  deal?: Deal;
  defaultStage?: DealStage;
  onSuccess?: (deal: Deal) => void;
}

export function DealModal({ open, onClose, mode, deal, defaultStage, onSuccess }: DealModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createMut = useCreateDeal();
  const updateMut = useUpdateDeal();
  const isSubmitting = createMut.isPending || updateMut.isPending;

  function handleSubmit(values: CreateDealValues) {
    setServerError(null);

    if (mode === "create") {
      createMut.mutate(
        {
          title: values.title,
          value: Number(values.value),
          stage: values.stage,
          clientId: values.clientId,
          probability: values.probability ? Number(values.probability) : undefined,
          expectedCloseDate: values.expectedCloseDate || undefined,
          notes: values.notes || undefined,
        },
        {
          onSuccess: (d) => { onSuccess?.(d); onClose(); },
          onError: (err) => setServerError(err.message ?? "Something went wrong."),
        }
      );
    } else if (deal) {
      updateMut.mutate(
        {
          id: deal.id,
          payload: {
            title: values.title,
            value: Number(values.value),
            probability: values.probability ? Number(values.probability) : undefined,
            expectedCloseDate: values.expectedCloseDate || undefined,
            notes: values.notes || undefined,
          },
        },
        {
          onSuccess: (d) => { onSuccess?.(d); onClose(); },
          onError: (err) => setServerError(err.message ?? "Something went wrong."),
        }
      );
    }
  }

  // Serialize Deal numbers → strings for the form
  const formDefaults: DealFormDefaults | undefined = deal
    ? {
        title:             deal.title,
        value:             String(deal.value ?? 0),
        stage:             deal.stage,
        clientId:          deal.clientId,
        probability:       deal.probability !== undefined ? String(deal.probability) : "",
        expectedCloseDate: deal.expectedCloseDate ?? "",
        notes:             deal.notes ?? "",
      }
    : undefined;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border shadow-2xl"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              boxShadow: "0 0 0 1px hsl(var(--border)), 0 24px 64px -8px hsl(0 0% 0% / 0.5)",
            }}
            initial={{ opacity: 0, scale: 0.96, y: "-48%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-48%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div>
                <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {mode === "create" ? "New deal" : `Edit — ${deal?.title}`}
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {mode === "create" ? "Add a new deal to your pipeline" : "Update deal details"}
                </p>
              </div>
              <button
                onClick={onClose} disabled={isSubmitting}
                className="rounded-md p-1.5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5 max-h-[80vh] overflow-y-auto">
              <DealForm
                mode={mode}
                defaultStage={defaultStage}
                defaultValues={formDefaults}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
                error={serverError}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
