"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Hash, CalendarDays } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/features/auth/components/form-field";
import { organizationFormSchema, type OrganizationFormValues } from "@/features/organizations/schemas";
import { useOrganization, useUpdateOrganization } from "@/features/organizations/hooks/use-organization";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

export function OrganizationTab() {
  const { t } = useTranslation();
  const { data: org, isLoading } = useOrganization();
  const updateMut = useUpdateOrganization();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    values: org ? { name: org.name } : undefined,
  });

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-3">
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-5 text-sm">
          <div className="flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Hash className="h-3.5 w-3.5" /> {t("settings.slug")}
          </div>
          <span className="text-right font-mono" style={{ color: "hsl(var(--foreground))" }}>{org.slug}</span>

          <div className="flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            <CalendarDays className="h-3.5 w-3.5" /> {t("settings.created")}
          </div>
          <span className="text-right" style={{ color: "hsl(var(--foreground))" }}>{formatDate(org.createdAt)}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            {t("settings.orgDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => updateMut.mutate(values, { onSuccess: () => reset(values) }))}
            noValidate
          >
            <FormField
              label={t("settings.orgName")}
              error={errors.name?.message}
              disabled={updateMut.isPending}
              {...register("name")}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={updateMut.isPending} disabled={!isDirty || updateMut.isPending}>
                {t("settings.saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
