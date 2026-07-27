"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";
import { useForgotPassword } from "../hooks/use-auth";
import { FormField } from "./form-field";
import { AuthError } from "./auth-error";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { mutate: sendReset, isPending } = useForgotPassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", organizationSlug: "" },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setServerError(null);
    sendReset(values, {
      onSuccess: () => setSent(true),
      onError: (err) => {
        setServerError(
          err.statusCode === 0 ? t("common.unableToConnect") : err.message ?? t("common.somethingWrong")
        );
      },
    });
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex flex-col items-center gap-3 py-2 text-center"
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {t("auth.checkYourEmail")}
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t("auth.checkYourEmailBody")}
          </p>
        </div>
        <Link
          href="/login"
          className="mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "hsl(var(--primary))" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("common.backToSignIn")}
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
        <FormField
          label={t("auth.organization")}
          placeholder={t("auth.organizationPlaceholder")}
          autoComplete="organization"
          autoCapitalize="none"
          startIcon={<Building2 className="h-3.5 w-3.5" />}
          error={errors.organizationSlug?.message}
          hint={t("auth.organizationHint")}
          disabled={isPending}
          {...register("organizationSlug")}
        />

        <FormField
          label={t("auth.email")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          startIcon={<Mail className="h-3.5 w-3.5" />}
          error={errors.email?.message}
          disabled={isPending}
          {...register("email")}
        />

        <Button type="submit" className="w-full" loading={isPending} disabled={isPending}>
          {isPending ? t("auth.sending") : t("auth.sendResetLink")}
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
