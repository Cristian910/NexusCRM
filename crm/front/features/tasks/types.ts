import type { Task, TaskStatus, PaginatedResponse } from "@/types";

export type { Task, TaskStatus };

// Query params  ↔  QueryTaskDto
export interface TaskFilters {
  status?: TaskStatus;
  assignedToId?: string;
  dealId?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  limit?: number;
}

// POST /tasks body  ↔  CreateTaskDto
export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
  dealId?: string;
}

// PATCH /tasks/:id body  ↔  UpdateTaskDto
export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskStatus;
}

export type TasksPage = PaginatedResponse<Task>;
