import { z } from "zod";

// ── Login schema — mirrors backend LoginDto ───────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must not exceed 64 characters"),
  organizationSlug: z
    .string()
    .min(1, "Organization is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens")
    .transform((v) => v.toLowerCase().trim()),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Register schema — mirrors backend RegisterDto ─────────────────
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .transform((v) => v.trim()),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .transform((v) => v.trim()),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must not exceed 64 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Must include uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must not exceed 100 characters")
      .transform((v) => v.trim()),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
