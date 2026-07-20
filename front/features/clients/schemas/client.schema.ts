import { z } from "zod";

const phoneRegex = /^[+\d\s\-().]+$/;

// The form always works with string values (empty string = not provided).
// Transformation to undefined happens before calling the service.
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must not exceed 150 characters"),
  email: z
    .string()
    .max(255)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Please enter a valid email address"),
  phone: z
    .string()
    .max(30, "Phone must not exceed 30 characters")
    .refine((v) => !v || phoneRegex.test(v), "Phone contains invalid characters"),
  company: z
    .string()
    .max(150, "Company must not exceed 150 characters"),
  website: z
    .string()
    .max(255)
    .refine(
      (v) => !v || /^https?:\/\/.+/.test(v),
      "Please enter a valid URL (include https://)"
    ),
  notes: z
    .string()
    .max(2000, "Notes must not exceed 2000 characters"),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

// Legacy aliases kept for barrel export compatibility
export const createClientSchema = clientFormSchema;
export const updateClientSchema = clientFormSchema;
export type CreateClientValues = ClientFormValues;
export type UpdateClientValues = ClientFormValues;
