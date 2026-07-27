"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/features/auth/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter,
} from "@/components/ui/modal";
import { inviteFormSchema, type InviteFormValues } from "@/features/users/schemas";
import { useInviteUser } from "@/features/users/hooks/use-users";
import { useTranslation } from "@/lib/i18n/context";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

// NOTE: this modal renders via a portal to document.body (see components/ui/modal.tsx),
// which is important — it's opened from inside a `motion.div` on the Settings page whose
// animated transform would otherwise become the containing block for `position: fixed`
// descendants, throwing off the modal's centering. Portaling out of the tree sidesteps
// that entirely, so this stays correctly centered no matter where it's invoked from.
export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const inviteMut = useInviteUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "", firstName: "", lastName: "", role: "MEMBER" },
  });

  function handleClose() {
    reset();
    setServerError(null);
    onClose();
  }

  function onSubmit(values: InviteFormValues) {
    setServerError(null);
    inviteMut.mutate(values, {
      onSuccess: handleClose,
      onError: (err) => setServerError(err.message ?? t("common.somethingWrong")),
    });
  }

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <ModalContent size="md" className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{t("settings.inviteTeammate")}</ModalTitle>
          <ModalDescription>
            {t("settings.inviteModalDescription")}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-5">
          {serverError && (
            <div
              className="rounded-md border px-3.5 py-3 text-sm"
              style={{
                borderColor: "hsl(var(--destructive) / 0.3)",
                background: "hsl(var(--destructive) / 0.08)",
                color: "hsl(var(--destructive))",
              }}
            >
              {serverError}
            </div>
          )}

          <FormField
            label={t("settings.inviteEmailLabel")}
            type="email"
            placeholder="teammate@company.com"
            error={errors.email?.message}
            disabled={inviteMut.isPending}
            {...register("email")}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label={t("settings.inviteFirstNameLabel")}
              error={errors.firstName?.message}
              disabled={inviteMut.isPending}
              {...register("firstName")}
            />
            <FormField
              label={t("settings.inviteLastNameLabel")}
              error={errors.lastName?.message}
              disabled={inviteMut.isPending}
              {...register("lastName")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">{t("settings.inviteRoleLabel")}</Label>
            <select
              id="invite-role"
              disabled={inviteMut.isPending}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
              style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
              {...register("role")}
            >
              <option value="ADMIN"  style={{ background: "hsl(var(--popover))" }}>{t("settings.inviteRoleAdmin")}</option>
              <option value="MEMBER" style={{ background: "hsl(var(--popover))" }}>{t("settings.inviteRoleMember")}</option>
              <option value="VIEWER" style={{ background: "hsl(var(--popover))" }}>{t("settings.inviteRoleViewer")}</option>
            </select>
          </div>

          <ModalFooter className="-mx-5 -mb-5 mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={inviteMut.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={inviteMut.isPending} disabled={inviteMut.isPending}>
              {inviteMut.isPending ? t("settings.sending") : t("settings.sendInvite")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
