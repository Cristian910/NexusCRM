import { z } from "zod";

// Use string fields for number inputs — RHF sends strings from <input type="number">
// Conversion happens before sending to the service
export const createDealSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters"),
  value: z
    .string()
    .min(1, "Value is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Value must be a positive number"),
  stage: z.enum([
    "LEAD", "CONTACTED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST",
  ]),
  clientId: z.string().min(1, "Client is required"),
  probability: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), "Must be 0-100"),
  expectedCloseDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateDealValues = z.infer<typeof createDealSchema>;

export const updateDealSchema = createDealSchema
  .partial()
  .omit({ stage: true, clientId: true });

export type UpdateDealValues = z.infer<typeof updateDealSchema>;
