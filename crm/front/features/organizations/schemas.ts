import { z } from "zod";

// Mirrors backend UpdateOrganizationDto
export const organizationFormSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
});
export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
