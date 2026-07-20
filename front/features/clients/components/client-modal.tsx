"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ClientForm } from "./client-form";
import { useCreateClient, useUpdateClient } from "../hooks/use-clients";
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
              ? "A client with this email already exists in your organization."
              : err.message ?? "Something went wrong."
          );
        },
      });
    } else if (client) {
      updateMut.mutate({ id: client.id, payload: clean }, {
        onSuccess: (c) => { onSuccess?.(c); onClose(); },
        onError: (err) => {
          setServerError(
            err.statusCode === 409
              ? "That email is already used by another client."
              : err.message ?? "Something went wrong."
          );
        },
      });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  {mode === "create" ? "New client" : `Edit — ${client?.name}`}
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {mode === "create"
                    ? "Add a new client to your organization"
                    : "Update client information"}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-md p-1.5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <ClientForm
                mode={mode}
                defaultValues={client}
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
