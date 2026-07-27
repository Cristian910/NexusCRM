"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { ClientsToolbar } from "@/features/clients/components/clients-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { ClientModal } from "@/features/clients/components/client-modal";
import { useClients } from "@/features/clients/hooks/use-clients";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useDebounce } from "@/lib/hooks";
import { useTranslation } from "@/lib/i18n/context";
import type { Client, ClientStatus } from "@/features/clients/types";

const LIMIT = 20;

export function ClientsClient() {
  const { t } = useTranslation();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<ClientStatus | undefined>();
  const [page, setPage]             = useState(1);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Client | undefined>();

  const debouncedSearch = useDebounce(search, 300);
  const { can } = usePermissions();

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStatusChange = useCallback((s: ClientStatus | undefined) => { setStatus(s); setPage(1); }, []);

  const { data, isLoading, isError, error } = useClients({
    name:   debouncedSearch || undefined,
    status: statusFilter,
    page,
    limit:  LIMIT,
  });

  const clients     = data?.data ?? [];
  const meta        = data?.meta;
  const totalPages  = meta?.totalPages ?? 1;
  const totalCount  = meta?.total ?? 0;

  const openCreate = () => { setEditTarget(undefined); setModalOpen(true); };
  const openEdit   = (c: Client) => { setEditTarget(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(undefined); };

  return (
    <ProtectedRoute permission="clients.read">
      <div className="space-y-4 pb-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PageHeader title={t("clients.pageTitle")} description={t("clients.pageDescription")} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.04 }}>
          <ClientsToolbar
            search={search}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
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
            <span>{error?.message ?? t("clients.failedToLoad")}</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.08 }}>
          <ClientsTable
            data={clients}
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
              itemLabel={t("common.items")}
            />
          </motion.div>
        )}

        {/* Only render modal if user has write permission */}
        {can("clients.write") && (
          <ClientModal
            open={modalOpen}
            onClose={closeModal}
            mode={editTarget ? "edit" : "create"}
            client={editTarget}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
