import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, EntityType } from '@prisma/client';

export class LogActivityDto {
  type: ActivityType;
  description: string;
  entityId: string;
  entityType: EntityType;
  userId: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

export class QueryActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 30;
}
