"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FormField } from "@/features/auth/components/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { inviteFormSchema, type InviteFormValues } from "@/features/users/schemas";
import { useInviteUser } from "@/features/users/hooks/use-users";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
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
      onError: (err) => setServerError(err.message ?? "Something went wrong."),
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />
          <motion.div
            key="panel"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border shadow-2xl"
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
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Invite teammate</h2>
                <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  They&apos;ll be added to your organization with a temporary password.
                </p>
              </div>
              <button
                onClick={handleClose} disabled={inviteMut.isPending}
                className="rounded-md p-1.5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                  label="Email *"
                  type="email"
                  placeholder="teammate@company.com"
                  error={errors.email?.message}
                  disabled={inviteMut.isPending}
                  {...register("email")}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="First name *"
                    error={errors.firstName?.message}
                    disabled={inviteMut.isPending}
                    {...register("firstName")}
                  />
                  <FormField
                    label="Last name *"
                    error={errors.lastName?.message}
                    disabled={inviteMut.isPending}
                    {...register("lastName")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-role">Role *</Label>
                  <select
                    id="invite-role"
                    disabled={inviteMut.isPending}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
                    style={{ borderColor: "hsl(var(--input))", background: "transparent", color: "hsl(var(--foreground))" }}
                    {...register("role")}
                  >
                    <option value="ADMIN"  style={{ background: "hsl(var(--popover))" }}>Admin — full access except billing</option>
                    <option value="MEMBER" style={{ background: "hsl(var(--popover))" }}>Member — create and manage records</option>
                    <option value="VIEWER" style={{ background: "hsl(var(--popover))" }}>Viewer — read-only access</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: "hsl(var(--border))" }}>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={inviteMut.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" loading={inviteMut.isPending} disabled={inviteMut.isPending}>
                    {inviteMut.isPending ? "Sending…" : "Send invite"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
