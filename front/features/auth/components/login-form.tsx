"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { loginSchema, type LoginFormValues } from "../schemas";
import { useLogin } from "../hooks/use-auth";
import { DEMO_CREDENTIALS } from "../demo-credentials";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { AuthError } from "./auth-error";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

/** Reads `?reset=success` without forcing the whole login page out of static rendering. */
function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  if (searchParams.get("reset") !== "success") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mb-4 flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm overflow-hidden"
      style={{
        borderColor: "hsl(var(--success) / 0.3)",
        background: "hsl(var(--success) / 0.08)",
        color: "hsl(var(--success))",
      }}
    >
      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{t("auth.resetSuccessBanner")}</span>
    </motion.div>
  );
}

export function LoginForm() {
  const { t } = useTranslation();
  const { mutate: login, isPending } = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoPending, setDemoPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      organizationSlug: "",
    },
  });

  function handleError(err: { statusCode?: number; message?: string }) {
    if (err.statusCode === 401) {
      setServerError(t("auth.invalidCredentials"));
    } else if (err.statusCode === 403) {
      setServerError(err.message ?? t("auth.accountDeactivated"));
    } else if (err.statusCode === 0) {
      setServerError(t("common.unableToConnect"));
    } else {
      setServerError(err.message ?? t("common.somethingWrong"));
    }
  }

  const onSubmit = (values: LoginFormValues) => {
    setServerError(null);
    login(values, { onError: handleError });
  };

  function handleDemoLogin() {
    setServerError(null);
    setDemoPending(true);
    login(
      {
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
        organizationSlug: DEMO_CREDENTIALS.organizationSlug,
      },
      { onError: (err) => { handleError(err); setDemoPending(false); } }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full space-y-5"
    >
      <Suspense fallback={null}>
        <ResetSuccessBanner />
      </Suspense>

      {/* Recruiter / reviewer fast-path — no signup required to explore the product. */}
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          borderColor: "hsl(var(--primary) / 0.3)",
          background: "hsl(var(--primary) / 0.06)",
          color: "hsl(var(--primary))",
        }}
      >
        <Sparkles className="h-4 w-4" />
        {demoPending ? t("auth.loadingDemo") : t("auth.exploreDemo")}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("auth.orSignIn")}
        </span>
        <div className="h-px flex-1" style={{ background: "hsl(var(--border))" }} />
      </div>

      <AuthError message={serverError} onDismiss={() => setServerError(null)} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Organization slug */}
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

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1">
          <PasswordInput
            label={t("auth.password")}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            disabled={isPending}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </motion.div>
  );
}
