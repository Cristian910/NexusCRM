"use client";

import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
} from "@/components/ui/modal";
import { TaskForm, type TaskFormDefaults } from "./task-form";
import { useCreateTask, useUpdateTask } from "../hooks/use-tasks";
import { useTranslation } from "@/lib/i18n/context";
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
  const { t } = useTranslation();
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
        onSuccess: (t2) => { onSuccess?.(t2); onClose(); },
        onError: (err) => setServerError(err.message ?? t("common.somethingWrong")),
      });
    } else if (task) {
      updateMut.mutate(
        { id: task.id, payload },
        {
          onSuccess: (t2) => { onSuccess?.(t2); onClose(); },
          onError: (err) => setServerError(err.message ?? t("common.somethingWrong")),
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
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent size="md" className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{mode === "create" ? t("tasks.newTaskTitle") : t("tasks.editTaskTitle", { title: task?.title ?? "" })}</ModalTitle>
          <ModalDescription>
            {mode === "create" ? t("tasks.newTaskDescription") : t("tasks.editTaskDescription")}
          </ModalDescription>
        </ModalHeader>
        <div className="p-5">
          <TaskForm
            mode={mode}
            defaultValues={formDefaults}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            error={serverError}
          />
        </div>
      </ModalContent>
    </Modal>
  );
}
