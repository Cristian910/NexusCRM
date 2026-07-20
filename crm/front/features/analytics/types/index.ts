import type { DealStage } from "@/types";

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  stage?: DealStage;
}

export interface OverviewKpis {
  deals: {
    totalDeals: number;
    totalPipelineValue: number;
    wonValue: number;
    conversionRate: number;
  };
  clients: {
    totalClients: number;
    newClientsInPeriod: number;
  };
  tasks: {
    totalTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  period: { from: string | null; to: string | null };
}

export interface DealStageBreakdown {
  stage: DealStage;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface DealKpis {
  totalDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  lostDeals: number;
  conversionRate: number;
  averageDealValue: number;
  stageBreakdown: DealStageBreakdown[];
}

export interface UserPerformance {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  closeRate: number;
  totalValue: number;
  wonValue: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  company: string | null;
  totalDeals: number;
  totalDealValue: number;
}

export interface ClientKpis {
  totalClients: number;
  newClientsInPeriod: number;
  clientsWithDeals: number;
  topClientsByDealValue: TopClient[];
}
