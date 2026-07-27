"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { KanbanBoard } from "@/features/deals/components/kanban-board";
import { DealsToolbar } from "@/features/deals/components/deals-toolbar";
import { DealModal } from "@/features/deals/components/deal-modal";
import { DealDrawer } from "@/features/deals/components/deal-drawer";
import { PipelineMetrics } from "@/features/deals/components/pipeline-metrics";
import { useDealsKanban } from "@/features/deals/hooks/use-deals";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useDebounce } from "@/lib/hooks";
import { useTranslation } from "@/lib/i18n/context";
import type { Deal, DealStage } from "@/features/deals/types";

export function DealsClient() {
  const { t } = useTranslation();
  const [search, setSearch]         = useState("");
  const [stageFilter, setStage]     = useState<DealStage | undefined>();
  const debouncedSearch             = useDebounce(search, 300);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editDeal, setEditDeal]     = useState<Deal | undefined>();
  const [defaultStage, setDefStage] = useState<DealStage | undefined>();
  const [drawerDealId, setDrawer]   = useState<string | null>(null);

  const { can } = usePermissions();

  const { data: deals = [], isLoading } = useDealsKanban({
    search: debouncedSearch || undefined,
  });

  const filteredDeals = stageFilter
    ? deals.filter((d) => d.stage === stageFilter)
    : deals;

  const handleCreate = useCallback(() => {
    setEditDeal(undefined);
    setDefStage(undefined);
    setModalOpen(true);
  }, []);

  const handleAddToStage = useCallback((stage: string) => {
    setEditDeal(undefined);
    setDefStage(stage as DealStage);
    setModalOpen(true);
  }, []);

  const handleDealClick = useCallback((deal: Deal) => { setDrawer(deal.id); }, []);
  const handleEdit = useCallback((deal: Deal) => { setEditDeal(deal); setModalOpen(true); }, []);

  return (
    <ProtectedRoute permission="deals.read">
      <div className="flex h-full flex-col gap-4 pb-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PageHeader title={t("deals.pageTitle")} description={t("deals.pageDescription")} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.04 }}>
          <DealsToolbar
            search={search}
            onSearchChange={setSearch}
            stageFilter={stageFilter}
            onStageChange={setStage}
            totalDeals={filteredDeals.length}
            isLoading={isLoading}
            onCreate={handleCreate}
          />
        </motion.div>

        {!isLoading && deals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.08 }}>
            <PipelineMetrics deals={filteredDeals} />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }} className="flex-1 min-h-0">
          <KanbanBoard
            deals={filteredDeals}
            isLoading={isLoading}
            onDealClick={handleDealClick}
            onAddDeal={handleAddToStage}
          />
        </motion.div>

        {can("deals.write") && (
          <DealModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditDeal(undefined); }}
            mode={editDeal ? "edit" : "create"}
            deal={editDeal}
            defaultStage={defaultStage}
          />
        )}

        <DealDrawer
          dealId={drawerDealId}
          onClose={() => setDrawer(null)}
          onEdit={handleEdit}
        />
      </div>
    </ProtectedRoute>
  );
}
