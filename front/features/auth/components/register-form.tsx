"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Mail, User } from "lucide-react";
import { registerSchema, type RegisterFormValues } from "../schemas";
import { useRegister } from "../hooks/use-auth";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { AuthError } from "./auth-error";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function RegisterForm() {
  const { t } = useTranslation();
  const { mutate: register, isPending } = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (values: RegisterFormValues) => {
    setServerError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stripped from the payload sent to the API
    const { confirmPassword, ...payload } = values;
    register(payload, {
      onError: (err) => {
        if (err.statusCode === 409) {
          setServerError(t("auth.orgAlreadyExists"));
        } else if (err.statusCode === 0) {
          setServerError(t("common.unableToConnect"));
        } else {
          setServerError(err.message ?? t("common.somethingWrong"));
        }
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full space-y-5"
    >
      <AuthError message={serverError} onDismiss={() => setServerError(null)} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label={t("auth.firstName")}
            placeholder={t("auth.firstNamePlaceholder")}
            autoComplete="given-name"
            startIcon={<User className="h-3.5 w-3.5" />}
            error={errors.firstName?.message}
            disabled={isPending}
            {...field("firstName")}
          />
          <FormField
            label={t("auth.lastName")}
            placeholder={t("auth.lastNamePlaceholder")}
            autoComplete="family-name"
            error={errors.lastName?.message}
            disabled={isPending}
            {...field("lastName")}
          />
        </div>

        {/* Organization */}
        <FormField
          label={t("auth.organizationName")}
          placeholder={t("auth.organizationNamePlaceholder")}
          autoComplete="organization"
          startIcon={<Building2 className="h-3.5 w-3.5" />}
          error={errors.organizationName?.message}
          hint={t("auth.organizationNameHint")}
          disabled={isPending}
          {...field("organizationName")}
        />

        {/* Email */}
        <FormField
          label={t("auth.workEmail")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          startIcon={<Mail className="h-3.5 w-3.5" />}
          error={errors.email?.message}
          disabled={isPending}
          {...field("email")}
        />

        {/* Password */}
        <PasswordInput
          label={t("auth.password")}
          placeholder={t("auth.passwordMinChars")}
          autoComplete="new-password"
          error={errors.password?.message}
          hint={t("auth.passwordRequirementsHint")}
          disabled={isPending}
          {...field("password")}
        />

        {/* Confirm password */}
        <PasswordInput
          label={t("auth.confirmPassword")}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isPending}
          {...field("confirmPassword")}
        />

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          loading={isPending}
          disabled={isPending}
        >
          {isPending ? t("auth.creatingAccount") : t("auth.createAccount")}
        </Button>
      </form>
    </motion.div>
  );
}
