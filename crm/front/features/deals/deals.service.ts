import { apiClient } from "@/lib/api/client";
import type {
  Deal, DealsPage, DealFilters,
  CreateDealPayload, UpdateDealPayload, UpdateDealStagePayload,
} from "./types";

function toParams(f: DealFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (f.clientId) p.clientId = f.clientId;
  if (f.stage)    p.stage    = f.stage;
  if (f.search)   p.search   = f.search;
  if (f.page)     p.page     = f.page;
  if (f.limit)    p.limit    = f.limit;
  return p;
}

export const dealsService = {
  async list(filters: DealFilters = {}): Promise<DealsPage> {
    const { data } = await apiClient.get<DealsPage>("/deals", {
      params: toParams(filters),
    });
    return data;
  },

  async get(id: string): Promise<Deal> {
    const { data } = await apiClient.get<Deal>(`/deals/${id}`);
    return data;
  },

  async create(payload: CreateDealPayload): Promise<Deal> {
    const { data } = await apiClient.post<Deal>("/deals", payload);
    return data;
  },

  async update(id: string, payload: UpdateDealPayload): Promise<Deal> {
    const { data } = await apiClient.patch<Deal>(`/deals/${id}`, payload);
    return data;
  },

  async updateStage(id: string, payload: UpdateDealStagePayload): Promise<Deal> {
    const { data } = await apiClient.patch<Deal>(`/deals/${id}/stage`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/deals/${id}`);
  },
};
