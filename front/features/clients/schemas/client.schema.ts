import { z } from "zod";

const phoneRegex = /^[+\d\s\-().]+$/;

// The form always works with string values (empty string = not provided).
// Transformation to undefined happens before calling the service. Messages
// are translation keys, resolved by FormField — see lib/i18n/context.ts.
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(2, "validation.clientNameMin")
    .max(150, "validation.clientNameMax"),
  email: z
    .string()
    .max(255)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "validation.emailInvalid"),
  phone: z
    .string()
    .max(30, "validation.phoneMax")
    .refine((v) => !v || phoneRegex.test(v), "validation.phoneInvalid"),
  company: z
    .string()
    .max(150, "validation.companyMax"),
  website: z
    .string()
    .max(255)
    .refine(
      (v) => !v || /^https?:\/\/.+/.test(v),
      "validation.urlInvalid"
    ),
  notes: z
    .string()
    .max(2000, "validation.notesMax"),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

// Legacy aliases kept for barrel export compatibility
export const createClientSchema = clientFormSchema;
export const updateClientSchema = clientFormSchema;
export type CreateClientValues = ClientFormValues;
export type UpdateClientValues = ClientFormValues;
