"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, FileText, User, Briefcase } from "lucide-react";
import { taskFormSchema, type TaskFormValues } from "../schemas/task.schema";
import { FormField } from "@/features/auth/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Can } from "@/components/auth/can";
import { useTeamMembers } from "@/features/users/hooks/use-users";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/lib/i18n/context";

export type TaskFormDefaults = {
  title?: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
  dealId?: string;
};

interface TaskFormProps {
  mode: "create" | "edit";
  defaultValues?: TaskFormDefaults;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function TaskForm({
  mode, defaultValues, onSubmit, onCancel, isSubmitting, error,
}: TaskFormProps) {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  // Only fetched when the viewer can actually see the team (ADMIN/OWNER on
  // the backend) — everyone else can still assign tasks to themselves.
  const { data: team } = useTeamMembers();
  const { data: dealsData } = useDeals({ limit: 200 });
  const deals = dealsData?.data ?? [];

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title:        defaultValues?.title        ?? "",
      description:  defaultValues?.description  ?? "",
      dueDate:      defaultValues?.dueDate       ?? "",
      assignedToId: defaultValues?.assignedToId  ?? "",
      dealId:       defaultValues?.dealId        ?? "",
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

      <FormField
        label={t("tasks.titleLabel")}
        placeholder={t("tasks.titlePlaceholder")}
        error={errors.title?.message}
        disabled={isSubmitting}
        {...register("title")}
      />

      <div className="space-y-1.5">
        <Label htmlFor="task-description" className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          {t("tasks.descriptionLabel")}
        </Label>
        <textarea
          id="task-description"
          rows={3}
          placeholder={t("tasks.descriptionPlaceholder")}
          disabled={isSubmitting}
          className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
          style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
          {...register("description")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label={t("tasks.dueDateLabel")}
          type="date"
          startIcon={<Calendar className="h-3.5 w-3.5" />}
          error={errors.dueDate?.message}
          disabled={isSubmitting}
          {...register("dueDate")}
        />

        <div className="space-y-1.5">
          <Label htmlFor="task-assignedToId" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            {t("tasks.assigneeLabel")}
          </Label>
          <select
            id="task-assignedToId"
            disabled={isSubmitting}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
            style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
            {...register("assignedToId")}
          >
            <option value="">{t("tasks.unassigned")}</option>
            {currentUser && (
              <option value={currentUser.id} style={{ background: "hsl(var(--popover))" }}>
                {t("tasks.meWithName", { name: `${currentUser.firstName} ${currentUser.lastName}` })}
              </option>
            )}
            <Can permission="users.read">
              {team
                ?.filter((u) => u.id !== currentUser?.id && u.isActive)
                .map((u) => (
                  <option key={u.id} value={u.id} style={{ background: "hsl(var(--popover))" }}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
            </Can>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-dealId" className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          {t("tasks.dealLabel")}
        </Label>
        <select
          id="task-dealId"
          disabled={isSubmitting}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
          style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
          {...register("dealId")}
        >
          <option value="">{t("tasks.none")}</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id} style={{ background: "hsl(var(--popover))" }}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: "hsl(var(--border))" }}>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="sm" loading={isSubmitting} disabled={isSubmitting}>
          {mode === "create"
            ? isSubmitting ? t("tasks.creating") : t("tasks.createTask")
            : isSubmitting ? t("common.saving")  : t("tasks.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
