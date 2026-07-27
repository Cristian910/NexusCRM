import { z } from "zod";

// Mirrors backend UpdateOrganizationDto — message is a translation key,
// resolved by FormField — see lib/i18n/context.ts#resolveFormMessage.
export const organizationFormSchema = z.object({
  name: z
    .string()
    .min(2, "validation.organizationNameMin")
    .max(100, "validation.organizationNameMax"),
});
export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
