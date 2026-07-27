"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { Moon, Sun, KeyRound, User as UserIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/auth/role-badge";
import { FormField } from "@/features/auth/components/form-field";
import { PasswordInput } from "@/features/auth/components/password-input";
import { profileFormSchema, passwordFormSchema, type ProfileFormValues, type PasswordFormValues } from "@/features/users/schemas";
import { useUpdateProfile, useChangePassword } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/lib/i18n/context";

export function ProfileTab() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      {/* Identity summary */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <Avatar size="lg">
            <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{user.email}</p>
            <div className="mt-1.5"><RoleBadge role={user.role} /></div>
          </div>
        </CardContent>
      </Card>

      <ProfileForm />
      <PasswordCard />
      <AppearanceCard />
    </div>
  );
}

function ProfileForm() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateMut = useUpdateProfile();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserIcon className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          {t("settings.personalInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => updateMut.mutate(values))}
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label={t("settings.firstName")}
              error={errors.firstName?.message}
              disabled={updateMut.isPending}
              {...register("firstName")}
            />
            <FormField
              label={t("settings.lastName")}
              error={errors.lastName?.message}
              disabled={updateMut.isPending}
              {...register("lastName")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={updateMut.isPending} disabled={!isDirty || updateMut.isPending}>
              {t("settings.saveChanges")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const changeMut = useChangePassword();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <KeyRound className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          {t("settings.password")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            changeMut.mutate(
              { currentPassword: values.currentPassword, newPassword: values.newPassword },
              { onSuccess: () => reset() }
            );
          })}
          noValidate
        >
          <PasswordInput
            label={t("settings.currentPassword")}
            error={errors.currentPassword?.message}
            disabled={changeMut.isPending}
            {...register("currentPassword")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <PasswordInput
              label={t("settings.newPassword")}
              error={errors.newPassword?.message}
              disabled={changeMut.isPending}
              {...register("newPassword")}
            />
            <PasswordInput
              label={t("settings.confirmNewPassword")}
              error={errors.confirmPassword?.message}
              disabled={changeMut.isPending}
              {...register("confirmPassword")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={changeMut.isPending} disabled={changeMut.isPending}>
              {t("settings.updatePassword")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("settings.appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("settings.appearanceDescription")}
        </p>
        <div className="flex items-center gap-1 rounded-md border p-1" style={{ borderColor: "hsl(var(--border))" }}>
          <ThemeOption active={theme === "dark"} icon={Moon} label={t("settings.dark")} onClick={() => setTheme("dark")} />
          <ThemeOption active={theme === "light"} icon={Sun} label={t("settings.light")} onClick={() => setTheme("light")} />
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeOption({ active, icon: Icon, label, onClick }: {
  active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: active ? "hsl(var(--primary))" : "transparent",
        color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
      }}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
