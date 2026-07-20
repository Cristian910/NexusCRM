import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { DealStage } from '@prisma/client';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;
}

// ─── Response shapes (used as return types, not validated) ────────────────────

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
  conversionRate: number; // CLOSED_WON / total (%)
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
  closeRate: number; // wonDeals / (wonDeals + lostDeals) * 100
  totalValue: number;
  wonValue: number;
}

export interface ClientKpis {
  totalClients: number; // active clients
  newClientsInPeriod: number; // within dateFrom..dateTo
  clientsWithDeals: number;
  topClientsByDealValue: TopClient[];
}

export interface TopClient {
  clientId: string;
  clientName: string;
  company: string | null;
  totalDeals: number;
  totalDealValue: number;
}

export interface TaskKpis {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface OverviewKpis {
  deals: Pick<DealKpis, 'totalDeals' | 'totalPipelineValue' | 'wonValue' | 'conversionRate'>;
  clients: Pick<ClientKpis, 'totalClients' | 'newClientsInPeriod'>;
  tasks: Pick<TaskKpis, 'totalTasks' | 'pendingTasks' | 'overdueTasks' | 'completionRate'>;
  period: { from: string | null; to: string | null };
}
