import { z } from "zod";

// ── Login schema — mirrors backend LoginDto ───────────────────────
// Messages are translation keys (resolved by FormField via resolveFormMessage),
// not literal text — this keeps validation errors correct when the locale changes.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "validation.emailRequired")
    .email("validation.emailInvalid")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "validation.passwordRequired")
    .min(8, "validation.passwordMinLength")
    .max(64, "validation.passwordMaxLength"),
  organizationSlug: z
    .string()
    .min(1, "validation.organizationRequired")
    .regex(/^[a-z0-9-]+$/, "validation.organizationSlugFormat")
    .transform((v) => v.toLowerCase().trim()),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Register schema — mirrors backend RegisterDto ─────────────────
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "validation.firstNameMin")
      .max(50, "validation.firstNameMax")
      .transform((v) => v.trim()),
    lastName: z
      .string()
      .min(2, "validation.lastNameMin")
      .max(50, "validation.lastNameMax")
      .transform((v) => v.trim()),
    email: z
      .string()
      .min(1, "validation.emailRequired")
      .email("validation.emailInvalid")
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "validation.passwordMinLength")
      .max(64, "validation.passwordMaxLength")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "validation.passwordComplexity"
      ),
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
    organizationName: z
      .string()
      .min(2, "validation.organizationNameMin")
      .max(100, "validation.organizationNameMax")
      .transform((v) => v.trim()),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "validation.passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Forgot password schema ─────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "validation.emailRequired")
    .email("validation.emailInvalid")
    .transform((v) => v.toLowerCase().trim()),
  organizationSlug: z
    .string()
    .min(1, "validation.organizationRequired")
    .regex(/^[a-z0-9-]+$/, "validation.organizationSlugFormat")
    .transform((v) => v.toLowerCase().trim()),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ── Reset password schema — mirrors backend ResetPasswordDto ──────
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "validation.passwordMinLength")
      .max(64, "validation.passwordMaxLength")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "validation.passwordComplexity"
      ),
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "validation.passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
