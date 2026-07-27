import { z } from "zod";

// The form works with string values (empty string = not provided).
// Mirrors CreateTaskDto / UpdateTaskDto exactly. Messages are translation
// keys, resolved by FormField — see lib/i18n/context.ts#resolveFormMessage.
export const taskFormSchema = z.object({
  title: z
    .string()
    .min(2, "validation.titleMin")
    .max(200, "validation.titleMax"),
  description: z
    .string()
    .max(2000, "validation.descriptionMax"),
  dueDate: z.string(),
  assignedToId: z.string(),
  dealId: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
