import { z } from "zod";

// The form works with string values (empty string = not provided).
// Mirrors CreateTaskDto / UpdateTaskDto exactly.
export const taskFormSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters"),
  dueDate: z.string(),
  assignedToId: z.string(),
  dealId: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
