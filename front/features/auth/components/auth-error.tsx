"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import React from "react";
import { useTranslation } from "@/lib/i18n/context";

interface AuthErrorProps {
  message: string | null;
  onDismiss?: () => void;
}

export function AuthError({ message, onDismiss }: AuthErrorProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="auth-error"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{message}</span>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label={t("common.dismissError")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
