"use client";

import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
} from "@/components/ui/modal";
import { DealForm, type DealFormDefaults } from "./deal-form";
import { useCreateDeal, useUpdateDeal } from "../hooks/use-deals";
import { useTranslation } from "@/lib/i18n/context";
import type { CreateDealValues } from "../schemas/deal.schema";
import type { Deal, DealStage } from "../types";

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  deal?: Deal;
  defaultStage?: DealStage;
  /** Pre-selects a client when creating — used from the client detail page. */
  defaultClientId?: string;
  onSuccess?: (deal: Deal) => void;
}

export function DealModal({ open, onClose, mode, deal, defaultStage, defaultClientId, onSuccess }: DealModalProps) {
  const { t } = useTranslation();
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
          onError: (err) => setServerError(err.message ?? t("common.somethingWrong")),
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
          onError: (err) => setServerError(err.message ?? t("common.somethingWrong")),
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
    : defaultClientId
    ? { clientId: defaultClientId }
    : undefined;

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent size="md" className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{mode === "create" ? t("deals.newDealTitle") : t("deals.editDealTitle", { title: deal?.title ?? "" })}</ModalTitle>
          <ModalDescription>
            {mode === "create" ? t("deals.newDealDescription") : t("deals.editDealDescription")}
          </ModalDescription>
        </ModalHeader>
        <div className="p-5">
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
      </ModalContent>
    </Modal>
  );
}
