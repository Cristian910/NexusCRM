import { z } from "zod";

// Use string fields for number inputs — RHF sends strings from <input type="number">
// Conversion happens before sending to the service. Messages are translation
// keys, resolved by FormField — see lib/i18n/context.ts#resolveFormMessage.
export const createDealSchema = z.object({
  title: z
    .string()
    .min(2, "validation.titleMin")
    .max(200, "validation.titleMax"),
  value: z
    .string()
    .min(1, "validation.valueRequired")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "validation.valuePositive"),
  stage: z.enum([
    "LEAD", "CONTACTED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST",
  ]),
  clientId: z.string().min(1, "validation.clientRequired"),
  probability: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), "validation.probabilityRange"),
  expectedCloseDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateDealValues = z.infer<typeof createDealSchema>;

export const updateDealSchema = createDealSchema
  .partial()
  .omit({ stage: true, clientId: true });

export type UpdateDealValues = z.infer<typeof updateDealSchema>;
