"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Building2, Phone, Mail, User, FileText } from "lucide-react";
import { createClientSchema } from "../schemas/client.schema";
import type { CreateClientValues } from "../schemas/client.schema";
import type { Client } from "../types";
import { FormField } from "@/features/auth/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation, resolveFormMessage } from "@/lib/i18n/context";

interface ClientFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<Client>;
  onSubmit: (values: CreateClientValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function ClientForm({
  mode, defaultValues, onSubmit, onCancel, isSubmitting, error,
}: ClientFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name:    defaultValues?.name    ?? "",
      email:   defaultValues?.email   ?? "",
      phone:   defaultValues?.phone   ?? "",
      company: defaultValues?.company ?? "",
      website: defaultValues?.website ?? "",
      notes:   defaultValues?.notes   ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Server error */}
      {error && (
        <div
          className="flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm"
          style={{
            borderColor: "hsl(var(--destructive) / 0.3)",
            background: "hsl(var(--destructive) / 0.08)",
            color: "hsl(var(--destructive))",
          }}
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
          {error}
        </div>
      )}

      {/* Name */}
      <FormField
        label={t("clients.fullNameLabel")}
        placeholder="Jane Smith"
        autoComplete="name"
        startIcon={<User className="h-3.5 w-3.5" />}
        error={errors.name?.message}
        disabled={isSubmitting}
        {...register("name")}
      />

      {/* Email + Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("clients.emailLabel")}
          type="email"
          placeholder="jane@company.com"
          autoComplete="email"
          startIcon={<Mail className="h-3.5 w-3.5" />}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register("email")}
        />
        <FormField
          label={t("clients.phoneLabel")}
          type="tel"
          placeholder="+1 555 000 0000"
          autoComplete="tel"
          startIcon={<Phone className="h-3.5 w-3.5" />}
          error={errors.phone?.message}
          disabled={isSubmitting}
          {...register("phone")}
        />
      </div>

      {/* Company + Website */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("clients.companyLabel")}
          placeholder="Acme Corp"
          startIcon={<Building2 className="h-3.5 w-3.5" />}
          error={errors.company?.message}
          disabled={isSubmitting}
          {...register("company")}
        />
        <FormField
          label={t("clients.websiteLabel")}
          type="url"
          placeholder="https://acme.com"
          startIcon={<Globe className="h-3.5 w-3.5" />}
          error={errors.website?.message}
          disabled={isSubmitting}
          {...register("website")}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-medium">
          <FileText
            className="h-3.5 w-3.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          {t("clients.notesLabel")}
        </Label>
        <textarea
          id="notes"
          rows={3}
          placeholder={t("clients.notesPlaceholder")}
          disabled={isSubmitting}
          className={cn(
            "w-full resize-none rounded-md border px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150"
          )}
          style={{
            borderColor: errors.notes ? "hsl(var(--destructive))" : "hsl(var(--input))",
            background: "transparent",
            color: "hsl(var(--foreground))",
          }}
          {...register("notes")}
        />
        {errors.notes && (
          <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
            {resolveFormMessage(t, errors.notes.message)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 border-t pt-4"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {mode === "create"
            ? isSubmitting ? t("clients.creating") : t("clients.createClient")
            : isSubmitting ? t("common.saving")     : t("clients.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
