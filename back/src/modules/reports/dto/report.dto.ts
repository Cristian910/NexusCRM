import { IsOptional, IsDateString, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DealStage } from '@prisma/client';

export enum ReportSortField {
  CREATED_AT = 'createdAt',
  VALUE = 'value',
  TITLE = 'title',
  STAGE = 'stage',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class DealReportFilterDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReportSortField)
  sortBy?: ReportSortField = ReportSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 50;
}

export interface DealReportRow {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string | null;
  createdAt: string;
  client: { id: string; name: string; company: string | null };
  assignedTo: { id: string; name: string } | null;
  stageAge: number; // days in current stage
}

export interface DealReport {
  generatedAt: string;
  filters: Record<string, string | undefined>;
  summary: {
    totalRows: number;
    totalPages: number;
    page: number;
    totalValue: number;
    averageValue: number;
  };
  data: DealReportRow[];
}
