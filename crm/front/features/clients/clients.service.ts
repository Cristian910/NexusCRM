import { apiClient } from "@/lib/api/client";
import type {
  Client, ClientsPage, ClientFilters,
  CreateClientPayload, UpdateClientPayload,
} from "./types";

function toParams(f: ClientFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (f.name)   p.name   = f.name;
  if (f.email)  p.email  = f.email;
  if (f.status) p.status = f.status;
  if (f.page)   p.page   = f.page;
  if (f.limit)  p.limit  = f.limit;
  return p;
}

export const clientsService = {
  async list(filters: ClientFilters = {}): Promise<ClientsPage> {
    const { data } = await apiClient.get<ClientsPage>("/clients", {
      params: toParams(filters),
    });
    return data;
  },

  async get(id: string): Promise<Client> {
    const { data } = await apiClient.get<Client>(`/clients/${id}`);
    return data;
  },

  async create(payload: CreateClientPayload): Promise<Client> {
    const { data } = await apiClient.post<Client>("/clients", payload);
    return data;
  },

  async update(id: string, payload: UpdateClientPayload): Promise<Client> {
    const { data } = await apiClient.patch<Client>(`/clients/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<Client> {
    const { data } = await apiClient.patch<Client>(`/clients/${id}/archive`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },
};
