"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Calendar, Percent, FileText, UserPlus } from "lucide-react";
import { createDealSchema, type CreateDealValues } from "../schemas/deal.schema";
import { ORDERED_STAGES } from "./kanban-config";
import { FormField } from "@/features/auth/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useClients } from "@/features/clients/hooks/use-clients";
import { ClientModal } from "@/features/clients/components/client-modal";
import { useTranslation, resolveFormMessage } from "@/lib/i18n/context";
import type { Client } from "@/features/clients/types";
import type { DealStage } from "../types";

// All fields are strings at the form level (HTML inputs are always strings).
// Conversion to numbers happens in the modal before calling the service.
export type DealFormDefaults = {
  title?: string;
  value?: string;
  stage?: DealStage;
  clientId?: string;
  probability?: string;
  expectedCloseDate?: string;
  notes?: string;
};

interface DealFormProps {
  mode: "create" | "edit";
  defaultStage?: DealStage;
  defaultValues?: DealFormDefaults;
  onSubmit: (values: CreateDealValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function DealForm({
  mode, defaultStage, defaultValues, onSubmit, onCancel, isSubmitting, error,
}: DealFormProps) {
  const { t } = useTranslation();
  const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 200 });
  const clients = clientsData?.data ?? [];
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateDealValues>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      title:             defaultValues?.title             ?? "",
      value:             defaultValues?.value             ?? "0",
      stage:             defaultValues?.stage             ?? defaultStage ?? "LEAD",
      clientId:          defaultValues?.clientId          ?? "",
      probability:       defaultValues?.probability       ?? "",
      expectedCloseDate: defaultValues?.expectedCloseDate ?? "",
      notes:             defaultValues?.notes             ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && (
        <div
          className="rounded-md border px-3.5 py-3 text-sm"
          style={{
            borderColor: "hsl(var(--destructive) / 0.3)",
            background: "hsl(var(--destructive) / 0.08)",
            color: "hsl(var(--destructive))",
          }}
        >
          {error}
        </div>
      )}

      {/* Title */}
      <FormField
        label={t("deals.dealTitleLabel")}
        placeholder={t("deals.dealTitlePlaceholder")}
        error={errors.title?.message}
        disabled={isSubmitting}
        {...register("title")}
      />

      {/* Client */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="deal-clientId">{t("deals.clientLabel")}</Label>
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "hsl(var(--primary))" }}
          >
            <UserPlus className="h-3 w-3" />
            {t("deals.newClient")}
          </button>
        </div>

        {!clientsLoading && clients.length === 0 ? (
          // No clients yet — a required dropdown with zero options is a dead end,
          // so guide the person straight to creating one instead of letting them
          // hit a vague validation error on submit.
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          >
            <UserPlus className="h-3.5 w-3.5 shrink-0" />
            {t("deals.noClientsYet")}
          </button>
        ) : (
          <select
            id="deal-clientId"
            disabled={isSubmitting}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
            style={{
              borderColor: errors.clientId ? "hsl(var(--destructive))" : "hsl(var(--input))",
              background: "transparent",
              color: "hsl(var(--foreground))",
            }}
            {...register("clientId")}
          >
            <option value="">{t("deals.selectClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "hsl(var(--popover))" }}>
                {c.name}{c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        )}
        {errors.clientId && (
          <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
            {resolveFormMessage(t, errors.clientId.message)}
          </p>
        )}
      </div>

      {/* Quick-create client without leaving the deal form */}
      <ClientModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        mode="create"
        onSuccess={(newClient: Client) => {
          setValue("clientId", newClient.id, { shouldValidate: true });
          setQuickAddOpen(false);
        }}
      />

      {/* Value + Stage */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("deals.valueLabel")}
          type="number"
          placeholder="25000"
          min={0}
          step={100}
          startIcon={<DollarSign className="h-3.5 w-3.5" />}
          error={errors.value?.message}
          disabled={isSubmitting}
          {...register("value")}
        />
        <div className="space-y-1.5">
          <Label htmlFor="deal-stage">{t("deals.stageLabel")}</Label>
          <select
            id="deal-stage"
            disabled={isSubmitting}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
            style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
            {...register("stage")}
          >
            {ORDERED_STAGES.map((s) => (
              <option key={s} value={s} style={{ background: "hsl(var(--popover))" }}>
                {t(`deals.stages.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Probability + Close date */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("deals.probabilityLabel")}
          type="number"
          placeholder="50"
          min={0}
          max={100}
          startIcon={<Percent className="h-3.5 w-3.5" />}
          error={errors.probability?.message}
          disabled={isSubmitting}
          {...register("probability")}
        />
        <FormField
          label={t("deals.expectedCloseLabel")}
          type="date"
          startIcon={<Calendar className="h-3.5 w-3.5" />}
          error={errors.expectedCloseDate?.message}
          disabled={isSubmitting}
          {...register("expectedCloseDate")}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="deal-notes" className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          {t("deals.notesLabel")}
        </Label>
        <textarea
          id="deal-notes"
          rows={3}
          placeholder={t("deals.notesPlaceholder")}
          disabled={isSubmitting}
          className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
          style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
          {...register("notes")}
        />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 border-t pt-4"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="sm" loading={isSubmitting} disabled={isSubmitting}>
          {mode === "create"
            ? isSubmitting ? t("deals.creating") : t("deals.createDeal")
            : isSubmitting ? t("common.saving")  : t("deals.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
