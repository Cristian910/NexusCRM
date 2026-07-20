"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper,
  type SortingState, type ColumnDef, type Column,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Pencil, Archive, Trash2, ExternalLink,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ClientStatusBadge } from "./client-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useArchiveClient, useDeleteClient } from "../hooks/use-clients";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Can } from "@/components/auth/can";
import { formatDate } from "@/lib/utils";
import type { Client } from "../types";

const col = createColumnHelper<Client>();

interface ClientsTableProps {
  data: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
}

export function ClientsTable({ data, isLoading, onEdit }: ClientsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null);

  const archiveMut = useArchiveClient();
  const deleteMut  = useDeleteClient();

  // ColumnDef's value generic is invariant, so a heterogeneous column array
  // (string columns, optional-string columns, custom cell columns, …) can't
  // be typed with `unknown` — TanStack's own patterns use `any` here too.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<Client, any>[]>(() => [
    col.accessor("name", {
      header: ({ column }) => <SortHeader label="Client" column={column} />,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="text-[11px]">{getInitials(c.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <button
                className="text-sm font-medium truncate max-w-[160px] text-left transition-colors hover:underline"
                style={{ color: "hsl(var(--foreground))" }}
                onClick={() => router.push(`/clients/${c.id}`)}
              >
                {c.name}
              </button>
              {c.company && (
                <p className="flex items-center gap-1 text-xs truncate max-w-[160px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Building2 className="h-2.5 w-2.5" />
                  {c.company}
                </p>
              )}
            </div>
          </div>
        );
      },
      size: 240,
    }),
    col.accessor("email", {
      header: "Email",
      cell: ({ getValue }) => {
        const email = getValue<string | undefined>();
        if (!email) return <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>;
        return (
          <a href={`mailto:${email}`} className="text-sm transition-colors hover:underline" style={{ color: "hsl(var(--muted-foreground))" }} onClick={(e) => e.stopPropagation()}>
            {email}
          </a>
        );
      },
      size: 200,
    }),
    col.accessor("phone", {
      header: "Phone",
      cell: ({ getValue }) => {
        const phone = getValue<string | undefined>();
        return phone
          ? <span className="text-sm font-mono tabular-nums" style={{ color: "hsl(var(--foreground))" }}>{phone}</span>
          : <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>;
      },
      enableSorting: false,
      size: 150,
    }),
    col.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => <ClientStatusBadge status={getValue()} />,
      size: 110,
    }),
    col.accessor("createdAt", {
      header: ({ column }) => <SortHeader label="Created" column={column} />,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
          {formatDate(getValue<string>())}
        </span>
      ),
      size: 120,
    }),
    col.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          client={row.original}
          onEdit={onEdit}
          onArchive={() => setArchiveTarget(row.original)}
          onDelete={() => setDeleteTarget(row.original)}
        />
      ),
      size: 56,
      enableSorting: false,
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [onEdit]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "hsl(var(--border))" }}>
        <table className="w-full min-w-[700px] border-collapse text-sm">
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
                    style={{ borderColor: "hsl(var(--border))" }}
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
        open={!!archiveTarget}
        title={`Archive ${archiveTarget?.name}?`}
        description="This client will be marked as archived and hidden from default views. Their deals and data are preserved."
        confirmLabel="Archive client"
        confirmVariant="default"
        onConfirm={() => {
          if (!archiveTarget) return;
          archiveMut.mutate(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) });
        }}
        onCancel={() => setArchiveTarget(null)}
        isLoading={archiveMut.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        description="This action cannot be undone. The client record will be permanently removed."
        confirmLabel="Delete permanently"
        warning="Note: clients with associated deals cannot be deleted. Archive them instead."
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

function SortHeader({ label, column }: { label: string; column: Column<Client, unknown> }) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 transition-colors"
      style={{ color: sorted ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {sorted === "asc" ? <ArrowUp className="h-3 w-3" />
       : sorted === "desc" ? <ArrowDown className="h-3 w-3" />
       : <ArrowUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}

function RowActions({ client, onEdit, onArchive, onDelete }: {
  client: Client; onEdit: (c: Client) => void; onArchive: () => void; onDelete: () => void;
}) {
  const router = useRouter();
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
        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
          <ExternalLink className="h-3.5 w-3.5" />View details
        </DropdownMenuItem>

        {/* Edit — requires clients.write */}
        <Can permission="clients.write">
          <DropdownMenuItem onClick={() => onEdit(client)}>
            <Pencil className="h-3.5 w-3.5" />Edit client
          </DropdownMenuItem>
        </Can>

        <DropdownMenuSeparator />

        {/* Archive — requires clients.archive */}
        <Can permission="clients.archive">
          {client.status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-3.5 w-3.5" />Archive
            </DropdownMenuItem>
          )}
        </Can>

        {/* Delete — requires clients.delete */}
        <Can permission="clients.delete">
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
        {[240, 200, 150, 110, 120, 56].map((w, i) => (
          <div key={i} className="skeleton h-3.5 rounded" style={{ width: w, flexShrink: 0 }} />
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-3" style={{ width: 240, flexShrink: 0 }}>
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-2.5 w-20 rounded" />
            </div>
          </div>
          <div className="skeleton h-3 rounded" style={{ width: 160, flexShrink: 0 }} />
          <div className="skeleton h-3 rounded" style={{ width: 110, flexShrink: 0 }} />
          <div className="skeleton h-5 w-16 rounded-full" style={{ flexShrink: 0 }} />
          <div className="skeleton h-3 w-20 rounded" style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

function TableEmpty() {
  return (
    <EmptyState
      icon={Building2}
      title="No clients found"
      description="Try adjusting your search or filters — or add your first client to get started."
    />
  );
}
