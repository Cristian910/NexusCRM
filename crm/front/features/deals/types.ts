import type { Deal, DealStage, PaginatedResponse } from "@/types";

export type { Deal, DealStage };

export interface DealFilters {
  clientId?: string;
  stage?: DealStage;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDealPayload {
  title: string;
  value: number;
  stage: DealStage;
  clientId: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateDealPayload {
  title?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateDealStagePayload {
  stage: DealStage;
}

export type DealsPage = PaginatedResponse<Deal>;

// Kanban column definition — one per DealStage
export interface KanbanColumn {
  stage: DealStage;
  label: string;
  color: string;         // hex / hsl accent
  accent: string;        // border/dot color
  deals: Deal[];
  totalValue: number;
}
