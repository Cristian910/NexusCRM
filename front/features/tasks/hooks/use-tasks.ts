"use client";

import {
  useQuery, useMutation, useQueryClient, keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import { tasksService } from "../tasks.service";
import type { TaskFilters, CreateTaskPayload, UpdateTaskPayload, Task, TasksPage } from "../types";
import type { ApiError } from "@/types";
import { toast } from "@/lib/stores/toast-store";
import { t as translate } from "@/lib/i18n/context";

// ── Query key factory ─────────────────────────────────────────────
export const taskKeys = {
  all:    () => ["tasks"] as const,
  lists:  () => ["tasks", "list"] as const,
  list:   (f: TaskFilters) => ["tasks", "list", f] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

// ── useTasks ─────────────────────────────────────────────────────
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn:  () => tasksService.list(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// ── useCreateTask ────────────────────────────────────────────────
export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation<Task, ApiError, CreateTaskPayload>({
    mutationFn: tasksService.create,
    onSuccess: (newTask) => {
      qc.setQueriesData<TasksPage>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [newTask, ...old.data],
          meta: { ...old.meta, total: old.meta.total + 1 },
        };
      });
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success(translate("toasts.taskCreated"));
    },
    onError: (err) => toast.error(translate("toasts.taskCreateFailed"), err.message),
  });
}

// ── useUpdateTask ────────────────────────────────────────────────
export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation<Task, ApiError, { id: string; payload: UpdateTaskPayload }>({
    mutationFn: ({ id, payload }) => tasksService.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(taskKeys.detail(updated.id), updated);
      qc.setQueriesData<TasksPage>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((t) => (t.id === updated.id ? updated : t)) };
      });
      toast.success(translate("toasts.taskUpdated"));
    },
    onError: (err) => toast.error(translate("toasts.taskUpdateFailed"), err.message),
  });
}

// ── useCompleteTask / useCancelTask ─────────────────────────────────
function useTaskTransition(fn: (id: string) => Promise<Task>, successMessage: string) {
  const qc = useQueryClient();

  return useMutation<Task, ApiError, string>({
    mutationFn: fn,
    onSuccess: (updated) => {
      qc.setQueryData(taskKeys.detail(updated.id), updated);
      qc.setQueriesData<TasksPage>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((t) => (t.id === updated.id ? updated : t)) };
      });
      toast.success(successMessage);
    },
    onError: (err) => toast.error(translate("toasts.genericFailed"), err.message),
  });
}

export function useCompleteTask() {
  return useTaskTransition(tasksService.complete, translate("toasts.taskMarkedComplete"));
}

export function useCancelTask() {
  return useTaskTransition(tasksService.cancel, translate("toasts.taskCancelled"));
}

// ── useDeleteTask ────────────────────────────────────────────────
export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, string, { snapshots: Map<QueryKey, TasksPage | undefined> }>({
    mutationFn: tasksService.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.lists() });
      const snapshots = new Map<QueryKey, TasksPage | undefined>();

      qc.getQueriesData<TasksPage>({ queryKey: taskKeys.lists() }).forEach(([key, data]) => {
        snapshots.set(key, data);
        if (data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.filter((t) => t.id !== id),
            meta: { ...data.meta, total: Math.max(0, data.meta.total - 1) },
          });
        }
      });

      return { snapshots };
    },
    onError: (err, _id, ctx) => {
      ctx?.snapshots?.forEach((data, key) => qc.setQueryData(key, data));
      toast.error(translate("toasts.taskDeleteFailed"), err.message);
    },
    onSuccess: () => toast.success(translate("toasts.taskDeleted")),
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}
