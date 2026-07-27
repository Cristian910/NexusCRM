"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useTranslation } from "@/lib/i18n/context";

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
  open, title, description, confirmLabel,
  confirmVariant = "destructive", onConfirm, onCancel,
  isLoading, warning,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <ModalContent size="sm" className="p-5" hideClose>
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
            {t("common.cancel")}
          </Button>
          <Button
            variant={confirmVariant === "destructive" ? "destructive" : "default"}
            size="sm"
            loading={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? t("common.working") : confirmLabel ?? t("common.confirm")}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
