"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
  type CollisionDetection, pointerWithin, rectIntersection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { KanbanColumn } from "./kanban-column";
import { DealCardOverlay } from "./deal-card";
import { buildKanbanColumns, ORDERED_STAGES } from "./kanban-config";
import { useUpdateDealStage } from "../hooks/use-deals";
import { KanbanSkeleton } from "./kanban-skeleton";
import type { Deal, DealStage } from "../types";

// Hybrid collision detection: prefer pointer-within for drops onto columns
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

interface KanbanBoardProps {
  deals: Deal[];
  isLoading: boolean;
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stage: string) => void;
}

export function KanbanBoard({ deals, isLoading, onDealClick, onAddDeal }: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Local optimistic state — mirrors server after settle.
  // Pattern: adjust state during render instead of in an effect, so a new
  // `deals` prop is reflected in the very same commit (React bails out of
  // the extra render this would otherwise cost — see "storing information
  // from previous renders" in the React docs). Skipped while dragging so an
  // incoming refetch doesn't yank a card out from under the pointer.
  const [prevDeals, setPrevDeals] = useState(deals);
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);

  if (deals !== prevDeals && !activeDeal) {
    setPrevDeals(deals);
    setLocalDeals(deals);
  }

  const displayDeals = activeDeal ? localDeals : deals;
  const columns = useMemo(() => buildKanbanColumns(displayDeals), [displayDeals]);

  const stageMutation = useUpdateDealStage();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const deal = deals.find((d) => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
      setLocalDeals([...deals]); // snapshot
    }
  }, [deals]);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (!over) { setOverColumnId(null); return; }

    const overId = String(over.id);
    // Check if we're over a column (stage id) or a deal card (move to that deal's column)
    const isColumn = ORDERED_STAGES.includes(overId as DealStage);
    if (isColumn) {
      setOverColumnId(overId);
      return;
    }

    // Over a deal card — find its column
    const overDeal = localDeals.find((d) => d.id === overId);
    if (overDeal) {
      setOverColumnId(overDeal.stage);

      // Optimistic in-flight reorder within/across column
      if (activeDeal && activeDeal.stage !== overDeal.stage) {
        setLocalDeals((prev) =>
          prev.map((d) =>
            d.id === activeDeal.id ? { ...d, stage: overDeal.stage } : d
          )
        );
      }
    }
  }, [activeDeal, localDeals]);

  const handleDragEnd = useCallback(({ over }: DragEndEvent) => {
    setActiveDeal(null);
    setOverColumnId(null);

    if (!over || !activeDeal) return;

    const overId = String(over.id);
    const isColumn = ORDERED_STAGES.includes(overId as DealStage);
    const targetStage: DealStage | undefined = isColumn
      ? (overId as DealStage)
      : deals.find((d) => d.id === overId)?.stage;

    if (!targetStage || targetStage === activeDeal.stage) return;

    // Fire the mutation — already optimistic in kanban cache
    stageMutation.mutate({
      id: activeDeal.id,
      stage: targetStage,
      previousStage: activeDeal.stage,
    });
  }, [activeDeal, deals, stageMutation]);

  const handleDragCancel = useCallback(() => {
    setActiveDeal(null);
    setOverColumnId(null);
    setLocalDeals(deals); // restore snapshot
  }, [deals]);

  if (isLoading) return <KanbanSkeleton />;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Board scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1">
        {columns.map((col) => (
          <KanbanColumn
            key={col.stage}
            column={col}
            isOver={overColumnId === col.stage}
            onDealClick={onDealClick}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>

      {/* Drag overlay — rendered in a portal above everything */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
      }}>
        <AnimatePresence>
          {activeDeal && <DealCardOverlay deal={activeDeal} />}
        </AnimatePresence>
      </DragOverlay>
    </DndContext>
  );
}
