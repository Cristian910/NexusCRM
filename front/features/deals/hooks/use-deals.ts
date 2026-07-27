"use client";

import {
  useQuery, useMutation, useQueryClient, keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import { dealsService } from "../deals.service";
import type {
  DealFilters, CreateDealPayload, UpdateDealPayload, Deal, DealStage,
} from "../types";
import type { ApiError } from "@/types";
import { toast } from "@/lib/stores/toast-store";
import { t } from "@/lib/i18n/context";

export const dealKeys = {
  all:    ()         => ["deals"] as const,
  lists:  ()         => ["deals", "list"] as const,
  list:   (f: DealFilters) => ["deals", "list", f] as const,
  detail: (id: string) => ["deals", "detail", id] as const,
  // Kanban uses all deals, no pagination, for client-side grouping
  kanban: (filters?: { clientId?: string; search?: string }) =>
    ["deals", "kanban", filters] as const,
};

// ── useDeals (paginated) ──────────────────────────────────────────
export function useDeals(filters: DealFilters = {}) {
  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn:  () => dealsService.list(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// ── useDealsKanban — fetches ALL deals for kanban view ────────────
export function useDealsKanban(filters: { clientId?: string; search?: string } = {}) {
  return useQuery({
    queryKey: dealKeys.kanban(filters),
    queryFn:  () => dealsService.list({ ...filters, limit: 500 }),
    staleTime: 30_000,
    select: (data) => data.data,   // only the array
  });
}

// ── useDeal (single) ──────────────────────────────────────────────
export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn:  () => dealsService.get(id),
    enabled:  !!id,
    staleTime: 60_000,
  });
}

// ── useCreateDeal ─────────────────────────────────────────────────
export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation<Deal, ApiError, CreateDealPayload>({
    mutationFn: dealsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success(t("toasts.dealCreated"));
    },
    onError: (err) => toast.error(t("toasts.dealCreateFailed"), err.message),
  });
}

// ── useUpdateDealStage (optimistic) ───────────────────────────────
export function useUpdateDealStage() {
  const qc = useQueryClient();

  return useMutation<
    Deal,
    ApiError,
    { id: string; stage: DealStage; previousStage: DealStage },
    { snapshots: Map<QueryKey, Deal[] | undefined> }
  >({
    mutationFn: ({ id, stage }) => dealsService.updateStage(id, { stage }),

    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() });

      // Snapshot all kanban caches
      const snapshots = new Map<QueryKey, Deal[] | undefined>();
      qc.getQueriesData<Deal[]>({ queryKey: ["deals", "kanban"] }).forEach(
        ([key, data]) => {
          snapshots.set(key, data);
          if (data) {
            qc.setQueryData(
              key,
              data.map((d) => (d.id === id ? { ...d, stage } : d))
            );
          }
        }
      );
      return { snapshots };
    },

    onError: (err, _vars, ctx) => {
      ctx?.snapshots?.forEach((data, key) => {
        qc.setQueryData(key, data);
      });
      toast.error(t("toasts.dealMoveFailed"), err.message);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

// ── useUpdateDeal ─────────────────────────────────────────────────
export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation<Deal, ApiError, { id: string; payload: UpdateDealPayload }>({
    mutationFn: ({ id, payload }) => dealsService.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(dealKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success(t("toasts.dealUpdated"));
    },
    onError: (err) => toast.error(t("toasts.dealUpdateFailed"), err.message),
  });
}

// ── useDeleteDeal ─────────────────────────────────────────────────
export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string, { snapshots: Map<QueryKey, Deal[] | undefined> }>({
    mutationFn: dealsService.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: dealKeys.lists() });
      const snapshots = new Map<QueryKey, Deal[] | undefined>();
      qc.getQueriesData<Deal[]>({ queryKey: ["deals", "kanban"] }).forEach(
        ([key, data]) => {
          snapshots.set(key, data);
          if (data) {
            qc.setQueryData(key, data.filter((d) => d.id !== id));
          }
        }
      );
      return { snapshots };
    },
    onError: (err, _id, ctx) => {
      ctx?.snapshots?.forEach((data, key) => {
        qc.setQueryData(key, data);
      });
      toast.error(t("toasts.dealDeleteFailed"), err.message);
    },
    onSuccess: () => toast.success(t("toasts.dealDeleted")),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}
