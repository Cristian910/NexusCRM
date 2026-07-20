"use client";

import React, { useMemo } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal, Pencil, Trash2, CheckCircle2, XCircle,
  ClipboardList, Briefcase, Clock,
} from "lucide-react";
import { TaskStatusBadge } from "./task-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCompleteTask, useCancelTask, useDeleteTask } from "../hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Can } from "@/components/auth/can";
import { formatDate } from "@/lib/utils";
import type { Task } from "../types";

const col = createColumnHelper<Task>();

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
  return new Date(task.dueDate) < new Date();
}

interface TasksTableProps {
  data: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
}

export function TasksTable({ data, isLoading, onEdit }: TasksTableProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null);

  const completeMut = useCompleteTask();
  const cancelMut   = useCancelTask();
  const deleteMut   = useDeleteTask();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<Task, any>[]>(() => [
    col.accessor("title", {
      header: "Task",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="min-w-0 max-w-[260px]">
            <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>
              {t.title}
            </p>
            {t.description && (
              <p className="mt-0.5 text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t.description}
              </p>
            )}
          </div>
        );
      },
      size: 260,
    }),
    col.accessor("dueDate", {
      header: "Due",
      cell: ({ row }) => {
        const t = row.original;
        if (!t.dueDate) return <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>;
        const overdue = isOverdue(t);
        return (
          <span
            className="inline-flex items-center gap-1 text-sm tabular-nums"
            style={{ color: overdue ? "hsl(0 72% 60%)" : "hsl(var(--foreground))" }}
          >
            {overdue && <Clock className="h-3 w-3" />}
            {formatDate(t.dueDate)}
          </span>
        );
      },
      size: 130,
    }),
    col.display({
      id: "assignee",
      header: "Assignee",
      cell: ({ row }) => {
        const a = row.original.assignedTo;
        if (!a) return <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Unassigned</span>;
        const name = `${a.firstName} ${a.lastName}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[120px]" style={{ color: "hsl(var(--foreground))" }}>{name}</span>
          </div>
        );
      },
      size: 160,
    }),
    col.display({
      id: "deal",
      header: "Deal",
      cell: ({ row }) => {
        const deal = row.original.deal;
        if (!deal) return <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-sm truncate max-w-[150px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Briefcase className="h-3 w-3 shrink-0" />
            {deal.title}
          </span>
        );
      },
      size: 160,
    }),
    col.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => <TaskStatusBadge status={getValue()} />,
      size: 120,
    }),
    col.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          task={row.original}
          onEdit={onEdit}
          onComplete={() => completeMut.mutate(row.original.id)}
          onCancel={() => cancelMut.mutate(row.original.id)}
          onDelete={() => setDeleteTarget(row.original)}
        />
      ),
      size: 56,
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [onEdit]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead style={{ background: "hsl(var(--muted) / 0.4)" }}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length}><TableEmpty /></td></tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14, delay: i * 0.02 }}
                    className="group border-b transition-colors"
                    style={{
                      borderColor: "hsl(var(--border))",
                      opacity: row.original.status === "CANCELLED" ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted) / 0.35)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3" style={{ color: "hsl(var(--foreground))" }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This action cannot be undone. The task will be permanently removed."
        confirmLabel="Delete permanently"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMut.isPending}
      />
    </>
  );
}

function RowActions({ task, onEdit, onComplete, onCancel, onDelete }: {
  task: Task; onEdit: (t: Task) => void; onComplete: () => void; onCancel: () => void; onDelete: () => void;
}) {
  const active = task.status === "PENDING" || task.status === "IN_PROGRESS";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <Can permission="tasks.write">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-3.5 w-3.5" />Edit task
          </DropdownMenuItem>
        </Can>

        {active && (
          <Can permission="tasks.write">
            <DropdownMenuItem onClick={onComplete}>
              <CheckCircle2 className="h-3.5 w-3.5" />Mark complete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel}>
              <XCircle className="h-3.5 w-3.5" />Cancel task
            </DropdownMenuItem>
          </Can>
        )}

        <DropdownMenuSeparator />

        <Can permission="tasks.delete">
          <DropdownMenuItem destructive onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />Delete
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="flex gap-4 border-b px-4 py-3" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted) / 0.4)" }}>
        {[260, 130, 160, 160, 120, 56].map((w, i) => (
          <div key={i} className="skeleton h-3.5 rounded" style={{ width: w, flexShrink: 0 }} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="space-y-1.5" style={{ width: 260, flexShrink: 0 }}>
            <div className="skeleton h-3.5 w-40 rounded" />
            <div className="skeleton h-2.5 w-24 rounded" />
          </div>
          <div className="skeleton h-3 rounded" style={{ width: 90, flexShrink: 0 }} />
          <div className="flex items-center gap-2" style={{ width: 160, flexShrink: 0 }}>
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="skeleton h-3 rounded" style={{ width: 120, flexShrink: 0 }} />
          <div className="skeleton h-5 w-20 rounded-full" style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

function TableEmpty() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="No tasks yet"
      description="Create a task to keep track of follow-ups, calls, and next steps for your deals."
    />
  );
}
