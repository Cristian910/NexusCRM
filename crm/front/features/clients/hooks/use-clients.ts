"use client";

import {
  useQuery, useMutation, useQueryClient, keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import { clientsService } from "../clients.service";
import type { ClientFilters, CreateClientPayload, UpdateClientPayload, Client, ClientsPage } from "../types";
import type { ApiError } from "@/types";
import { toast } from "@/lib/stores/toast-store";

// ── Query key factory ─────────────────────────────────────────────
export const clientKeys = {
  all:    () => ["clients"] as const,
  lists:  () => ["clients", "list"] as const,
  list:   (f: ClientFilters) => ["clients", "list", f] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

// ── useClients ────────────────────────────────────────────────────
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn:  () => clientsService.list(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,   // no blank flash on page change
  });
}

// ── useClient (single) ────────────────────────────────────────────
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn:  () => clientsService.get(id),
    enabled:  !!id,
    staleTime: 60_000,
  });
}

// ── useCreateClient ───────────────────────────────────────────────
export function useCreateClient() {
  const qc = useQueryClient();

  return useMutation<Client, ApiError, CreateClientPayload>({
    mutationFn: clientsService.create,
    onSuccess: (newClient) => {
      // Optimistic: prepend into every cached list
      qc.setQueriesData<ClientsPage>(
        { queryKey: clientKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [newClient, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        }
      );
      // Background revalidation for accuracy
      qc.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client created");
    },
    onError: (err) => toast.error("Couldn't create client", err.message),
  });
}

// ── useUpdateClient ───────────────────────────────────────────────
export function useUpdateClient() {
  const qc = useQueryClient();

  return useMutation<
    Client,
    ApiError,
    { id: string; payload: UpdateClientPayload }
  >({
    mutationFn: ({ id, payload }) => clientsService.update(id, payload),
    onSuccess: (updated) => {
      // Update detail cache
      qc.setQueryData(clientKeys.detail(updated.id), updated);
      // Update all list caches in-place
      qc.setQueriesData<ClientsPage>(
        { queryKey: clientKeys.lists() },
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.map((c) => (c.id === updated.id ? updated : c)) };
        }
      );
      toast.success("Client updated");
    },
    onError: (err) => toast.error("Couldn't update client", err.message),
  });
}

// ── useArchiveClient ──────────────────────────────────────────────
export function useArchiveClient() {
  const qc = useQueryClient();

  return useMutation<Client, ApiError, string>({
    mutationFn: clientsService.archive,
    onSuccess: (updated) => {
      qc.setQueryData(clientKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client archived");
    },
    onError: (err) => toast.error("Couldn't archive client", err.message),
  });
}

// ── useDeleteClient ───────────────────────────────────────────────
export function useDeleteClient() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, string, { snapshots: Map<QueryKey, ClientsPage | undefined> }>({
    mutationFn: clientsService.delete,
    onMutate: async (id) => {
      // Optimistic removal
      await qc.cancelQueries({ queryKey: clientKeys.lists() });
      const snapshots = new Map<QueryKey, ClientsPage | undefined>();

      qc.getQueriesData<ClientsPage>({ queryKey: clientKeys.lists() }).forEach(([key, data]) => {
        snapshots.set(key, data);
        if (data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.filter((c) => c.id !== id),
            meta: { ...data.meta, total: Math.max(0, data.meta.total - 1) },
          });
        }
      });

      return { snapshots };
    },
    onError: (err, _id, ctx) => {
      // Roll back on error
      ctx?.snapshots?.forEach((data, key) => {
        qc.setQueryData(key, data);
      });
      toast.error("Couldn't delete client", err.message);
    },
    onSuccess: () => toast.success("Client deleted"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}
