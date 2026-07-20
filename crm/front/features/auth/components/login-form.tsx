"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "../schemas";
import { useLogin } from "../hooks/use-auth";
import { FormField } from "./form-field";
import { PasswordInput } from "./password-input";
import { AuthError } from "./auth-error";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

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

  const onSubmit = (values: LoginFormValues) => {
    setServerError(null);
    login(values, {
      onError: (err) => {
        // Map known status codes to friendly messages
        if (err.statusCode === 401) {
          setServerError("Invalid credentials. Please check your email, password, and organization.");
        } else if (err.statusCode === 403) {
          setServerError(err.message ?? "Your account or organization has been deactivated.");
        } else if (err.statusCode === 0) {
          setServerError("Unable to connect. Please check your internet connection.");
        } else {
          setServerError(err.message ?? "Something went wrong. Please try again.");
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
        {/* Organization slug */}
        <FormField
          label="Organization"
          placeholder="acme-corp"
          autoComplete="organization"
          autoCapitalize="none"
          startIcon={<Building2 className="h-3.5 w-3.5" />}
          error={errors.organizationSlug?.message}
          hint="The slug you chose when you registered"
          disabled={isPending}
          {...register("organizationSlug")}
        />

        {/* Email */}
        <FormField
          label="Email address"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          startIcon={<Mail className="h-3.5 w-3.5" />}
          error={errors.email?.message}
          disabled={isPending}
          {...register("email")}
        />

        {/* Password */}
        <div className="space-y-1">
          <PasswordInput
            label="Password"
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
              Forgot password?
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
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </motion.div>
  );
}
