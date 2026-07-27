"use client";

import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
} from "@/components/ui/modal";
import { ClientForm } from "./client-form";
import { useCreateClient, useUpdateClient } from "../hooks/use-clients";
import { useTranslation } from "@/lib/i18n/context";
import type { CreateClientValues } from "../schemas/client.schema";
import type { Client } from "../types";

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  client?: Client;
  onSuccess?: (client: Client) => void;
}

export function ClientModal({ open, onClose, mode, client, onSuccess }: ClientModalProps) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const createMut = useCreateClient();
  const updateMut = useUpdateClient();
  const isSubmitting = createMut.isPending || updateMut.isPending;

  function handleSubmit(values: CreateClientValues) {
    setServerError(null);

    // Strip empty strings so backend receives undefined
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as CreateClientValues;

    if (mode === "create") {
      createMut.mutate(clean, {
        onSuccess: (c) => { onSuccess?.(c); onClose(); },
        onError: (err) => {
          setServerError(
            err.statusCode === 409
              ? t("clients.emailExistsCreate")
              : err.message ?? t("common.somethingWrong")
          );
        },
      });
    } else if (client) {
      updateMut.mutate({ id: client.id, payload: clean }, {
        onSuccess: (c) => { onSuccess?.(c); onClose(); },
        onError: (err) => {
          setServerError(
            err.statusCode === 409
              ? t("clients.emailExistsUpdate")
              : err.message ?? t("common.somethingWrong")
          );
        },
      });
    }
  }

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent size="md" className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{mode === "create" ? t("clients.newClientTitle") : t("clients.editClientTitle", { name: client?.name ?? "" })}</ModalTitle>
          <ModalDescription>
            {mode === "create" ? t("clients.newClientDescription") : t("clients.editClientDescription")}
          </ModalDescription>
        </ModalHeader>
        <div className="p-5">
          <ClientForm
            mode={mode}
            defaultValues={client}
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
