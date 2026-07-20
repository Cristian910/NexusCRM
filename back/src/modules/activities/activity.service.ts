import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LogActivityDto, QueryActivityDto } from './dto/activity.dto';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@/common/types/shared.types';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a single activity record.
   * Called exclusively by listeners — never directly from controllers.
   */
  async log(dto: LogActivityDto): Promise<void> {
    await this.prisma.activity.create({
      data: {
        type: dto.type,
        description: dto.description,
        entityId: dto.entityId,
        entityType: dto.entityType,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        userId: dto.userId,
        organizationId: dto.organizationId,
      },
    });

    this.logger.debug(`Activity logged: [${dto.type}] entity=${dto.entityType}:${dto.entityId}`);
  }

  /**
   * Paginated feed for a given organization — used by controllers.
   * Always scoped to organizationId; no cross-tenant data is possible.
   */
  async findAll(
    organizationId: string,
    query: QueryActivityDto,
  ): Promise<PaginatedResult<unknown>> {
    const { type, entityType, entityId, userId, page = 1, limit = 30 } = query;

    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.ActivityWhereInput = {
      organizationId,
      ...(type && { type }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  /**
   * Activity feed scoped to a single entity (e.g. all activity on deal X).
   */
  async findByEntity(
    entityId: string,
    organizationId: string,
    page = 1,
    limit = 30,
  ): Promise<PaginatedResult<unknown>> {
    return this.findAll(organizationId, { entityId, page, limit });
  }

  /**
   * Lightweight count of activity created in the last `sinceSeconds` —
   * powers the frontend's 30s activity-polling channel without shipping
   * the full feed payload on every tick.
   */
  async recentCount(organizationId: string, sinceSeconds = 60): Promise<number> {
    const since = new Date(Date.now() - sinceSeconds * 1000);
    return this.prisma.activity.count({
      where: { organizationId, createdAt: { gte: since } },
    });
  }
}
