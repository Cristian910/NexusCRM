import type { Client, ClientStatus, PaginatedResponse } from "@/types";

export type { Client, ClientStatus };

// Query params  ↔  QueryClientDto
export interface ClientFilters {
  name?: string;
  email?: string;
  status?: ClientStatus;
  page?: number;
  limit?: number;
}

// POST /clients body  ↔  CreateClientDto
export interface CreateClientPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  notes?: string;
}

// PATCH /clients/:id body  ↔  UpdateClientDto
export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: ClientStatus;
}

export type ClientsPage = PaginatedResponse<Client>;
