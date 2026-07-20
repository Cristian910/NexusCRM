"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TaskForm, type TaskFormDefaults } from "./task-form";
import { useCreateTask, useUpdateTask } from "../hooks/use-tasks";
import type { TaskFormValues } from "../schemas/task.schema";
import type { Task } from "../types";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  task?: Task;
  onSuccess?: (task: Task) => void;
}

export function TaskModal({ open, onClose, mode, task, onSuccess }: TaskModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const isSubmitting = createMut.isPending || updateMut.isPending;

  function handleSubmit(values: TaskFormValues) {
    setServerError(null);
    const payload = {
      title:        values.title,
      description:  values.description || undefined,
      dueDate:      values.dueDate || undefined,
      assignedToId: values.assignedToId || undefined,
      dealId:       values.dealId || undefined,
    };

    if (mode === "create") {
      createMut.mutate(payload, {
        onSuccess: (t) => { onSuccess?.(t); onClose(); },
        onError: (err) => setServerError(err.message ?? "Something went wrong."),
      });
    } else if (task) {
      updateMut.mutate(
        { id: task.id, payload },
        {
          onSuccess: (t) => { onSuccess?.(t); onClose(); },
          onError: (err) => setServerError(err.message ?? "Something went wrong."),
        }
      );
    }
  }

  const formDefaults: TaskFormDefaults | undefined = task
    ? {
        title:        task.title,
        description:  task.description ?? "",
        dueDate:      task.dueDate ? task.dueDate.slice(0, 10) : "",
        assignedToId: task.assignedToId ?? "",
        dealId:       task.dealId ?? "",
      }
    : undefined;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border shadow-2xl"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              boxShadow: "0 0 0 1px hsl(var(--border)), 0 24px 64px -8px hsl(0 0% 0% / 0.5)",
            }}
            initial={{ opacity: 0, scale: 0.96, y: "-48%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-48%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {mode === "create" ? "New task" : `Edit — ${task?.title}`}
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {mode === "create" ? "Add a follow-up or next step" : "Update task details"}
                </p>
              </div>
              <button
                onClick={onClose} disabled={isSubmitting}
                className="rounded-md p-1.5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5 max-h-[80vh] overflow-y-auto">
              <TaskForm
                mode={mode}
                defaultValues={formDefaults}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
                error={serverError}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
