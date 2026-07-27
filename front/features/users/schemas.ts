import { z } from "zod";

// Messages are translation keys, resolved by FormField —
// see lib/i18n/context.ts#resolveFormMessage.

// Mirrors backend UpdateUserDto
export const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "validation.firstNameMin")
    .max(50, "validation.firstNameMax"),
  lastName: z
    .string()
    .min(2, "validation.lastNameMin")
    .max(50, "validation.lastNameMax"),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mirrors backend ChangePasswordDto — same strength rule as registration
export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.currentPasswordRequired"),
    newPassword: z
      .string()
      .min(8, "validation.passwordMinLength")
      .max(64, "validation.passwordMaxLength")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "validation.passwordComplexity"
      ),
    confirmPassword: z.string().min(1, "validation.confirmNewPasswordRequired"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "validation.passwordsDoNotMatch",
    path: ["confirmPassword"],
  });
export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Mirrors backend InviteUserDto
export const inviteFormSchema = z.object({
  email: z
    .string()
    .min(1, "validation.emailRequired")
    .email("validation.emailInvalid")
    .transform((v) => v.toLowerCase().trim()),
  firstName: z
    .string()
    .min(2, "validation.firstNameMin")
    .max(50, "validation.firstNameMax"),
  lastName: z
    .string()
    .min(2, "validation.lastNameMin")
    .max(50, "validation.lastNameMax"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});
export type InviteFormValues = z.infer<typeof inviteFormSchema>;
