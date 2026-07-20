"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  warning?: string;   // extra contextual warning text
}

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirm",
  confirmVariant = "destructive", onConfirm, onCancel,
  isLoading, warning,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cd-backdrop"
            className="fixed inset-0 z-50"
            style={{ background: "hsl(0 0% 0% / 0.55)", backdropFilter: "blur(3px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCancel}
          />
          <motion.div
            key="cd-panel"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5 shadow-2xl"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              boxShadow: "0 0 0 1px hsl(var(--border)), 0 20px 48px -8px hsl(0 0% 0% / 0.5)",
            }}
            initial={{ opacity: 0, scale: 0.94, y: "-48%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.94, y: "-48%" }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Icon */}
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: confirmVariant === "destructive"
                  ? "hsl(var(--destructive) / 0.1)"
                  : "hsl(var(--primary) / 0.1)",
              }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{
                  color: confirmVariant === "destructive"
                    ? "hsl(var(--destructive))"
                    : "hsl(var(--primary))",
                }}
              />
            </div>

            <h3 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {title}
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {description}
            </p>

            {warning && (
              <div
                className="mt-3 rounded-md border px-3 py-2.5 text-xs"
                style={{
                  borderColor: "hsl(var(--destructive) / 0.25)",
                  background: "hsl(var(--destructive) / 0.06)",
                  color: "hsl(var(--destructive))",
                }}
              >
                {warning}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmVariant === "destructive" ? "destructive" : "default"}
                size="sm"
                loading={isLoading}
                onClick={onConfirm}
              >
                {isLoading ? "Working…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
