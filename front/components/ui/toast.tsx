"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast-store";
import { useTranslation } from "@/lib/i18n/context";
import type { ToastVariant } from "@/lib/stores/toast-store";

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ACCENTS: Record<ToastVariant, string> = {
  success: "hsl(var(--success))",
  error: "hsl(var(--destructive))",
  info: "hsl(var(--primary))",
};

/**
 * <Toaster /> — mount once near the root (see Providers). Renders whatever
 * is queued in useToastStore. Fire toasts from anywhere with the `toast`
 * helper exported from lib/stores/toast-store.
 */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const Icon = ICONS[item.variant];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3.5 shadow-dialog"
              style={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }}
              role="status"
            >
              <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: ACCENTS[item.variant] }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: "hsl(var(--popover-foreground))" }}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {item.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded p-0.5 transition-colors hover:bg-accent"
                aria-label={t("common.dismissNotification")}
              >
                <X className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
