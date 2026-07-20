"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import { TasksToolbar } from "@/features/tasks/components/tasks-toolbar";
import { TaskModal } from "@/features/tasks/components/task-modal";
import { Pagination } from "@/components/ui/pagination";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Task, TaskStatus } from "@/features/tasks/types";

const LIMIT = 20;

export function TasksClient() {
  const [statusFilter, setStatus]     = useState<TaskStatus | undefined>();
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Task | undefined>();

  const { can } = usePermissions();
  const currentUser = useAuthStore((s) => s.user);

  const handleStatusChange = useCallback((s: TaskStatus | undefined) => { setStatus(s); setPage(1); }, []);
  const handleAssignedToMeChange = useCallback((v: boolean) => { setAssignedToMe(v); setPage(1); }, []);

  const { data, isLoading, isError, error } = useTasks({
    status: statusFilter,
    assignedToId: assignedToMe ? currentUser?.id : undefined,
    page,
    limit: LIMIT,
  });

  const tasks       = data?.data ?? [];
  const meta        = data?.meta;
  const totalPages  = meta?.totalPages ?? 1;
  const totalCount  = meta?.total ?? 0;

  const openCreate = () => { setEditTarget(undefined); setModalOpen(true); };
  const openEdit   = (t: Task) => { setEditTarget(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(undefined); };

  return (
    <ProtectedRoute permission="tasks.read">
      <div className="space-y-4 pb-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PageHeader title="Tasks" description="Follow-ups, calls, and next steps across your pipeline" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.04 }}>
          <TasksToolbar
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            assignedToMe={assignedToMe}
            onAssignedToMeChange={handleAssignedToMeChange}
            totalCount={totalCount}
            isLoading={isLoading}
            onCreate={openCreate}
          />
        </motion.div>

        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.07)", color: "hsl(var(--destructive))" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error?.message ?? "Failed to load tasks."}</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.08 }}>
          <TasksTable
            data={tasks}
            isLoading={isLoading}
            onEdit={openEdit}
          />
        </motion.div>

        {!isLoading && totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.12 }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              limit={LIMIT}
              onPageChange={setPage}
              isLoading={isLoading}
              itemLabel="tasks"
            />
          </motion.div>
        )}

        {can("tasks.write") && (
          <TaskModal
            open={modalOpen}
            onClose={closeModal}
            mode={editTarget ? "edit" : "create"}
            task={editTarget}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
