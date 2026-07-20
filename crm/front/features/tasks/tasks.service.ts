import { apiClient } from "@/lib/api/client";
import type {
  Task, TasksPage, TaskFilters,
  CreateTaskPayload, UpdateTaskPayload,
} from "./types";

function toParams(f: TaskFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (f.status)       p.status       = f.status;
  if (f.assignedToId) p.assignedToId = f.assignedToId;
  if (f.dealId)        p.dealId       = f.dealId;
  if (f.dueBefore)     p.dueBefore    = f.dueBefore;
  if (f.dueAfter)      p.dueAfter     = f.dueAfter;
  if (f.page)          p.page         = f.page;
  if (f.limit)         p.limit        = f.limit;
  return p;
}

export const tasksService = {
  async list(filters: TaskFilters = {}): Promise<TasksPage> {
    const { data } = await apiClient.get<TasksPage>("/tasks", {
      params: toParams(filters),
    });
    return data;
  },

  async get(id: string): Promise<Task> {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await apiClient.post<Task>("/tasks", payload);
    return data;
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },

  async complete(id: string): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}/complete`);
    return data;
  },

  async cancel(id: string): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}/cancel`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};
