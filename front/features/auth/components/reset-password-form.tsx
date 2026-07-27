"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, XCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas";
import { useResetPassword } from "../hooks/use-auth";
import { PasswordInput } from "./password-input";
import { AuthError } from "./auth-error";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) return;
    setServerError(null);
    resetPassword(
      { token, newPassword: values.newPassword },
      {
        onError: (err) => {
          setServerError(
            err.statusCode === 401
              ? t("auth.linkExpired")
              : err.statusCode === 0
                ? t("common.unableToConnect")
                : err.message ?? t("common.somethingWrong")
          );
        },
      }
    );
  };

  // No token in the URL at all — this page was opened directly, not via an email link.
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex flex-col items-center gap-3 py-2 text-center"
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "hsl(var(--destructive) / 0.1)" }}
        >
          <XCircle className="h-5 w-5" style={{ color: "hsl(var(--destructive))" }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("auth.missingLinkTitle")}
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("auth.missingLinkBody")}
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-medium transition-colors"
          style={{ color: "hsl(var(--primary))" }}
        >
          {t("auth.requestNewLink")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full space-y-5"
    >
      <AuthError message={serverError} onDismiss={() => setServerError(null)} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput
          label={t("auth.newPassword")}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          disabled={isPending}
          {...register("newPassword")}
        />
        <PasswordInput
          label={t("auth.confirmNewPassword")}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isPending}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" loading={isPending} disabled={isPending}>
          {isPending ? t("auth.resetting") : t("auth.resetPassword")}
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("common.backToSignIn")}
        </Link>
      </form>
    </motion.div>
  );
}
