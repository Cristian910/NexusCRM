import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService, CacheKey } from '@/common/cache/redis-cache.service';
import {
  AnalyticsFilterDto,
  DealKpis,
  DealStageBreakdown,
  UserPerformance,
  ClientKpis,
  TaskKpis,
  OverviewKpis,
} from './dto/analytics.dto';
import { DealStage, ClientStatus, TaskStatus, Prisma } from '@prisma/client';

type ClientNameRow = { id: string; name: string; company: string | null };

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Overview (dashboard hero section) ──────────────────────────────────────

  async getOverview(organizationId: string, filters: AnalyticsFilterDto): Promise<OverviewKpis> {
    const ttl = this.configService.get<number>('ANALYTICS_CACHE_OVERVIEW_TTL') ?? 60;
    const cacheKey = CacheKey.analyticsOverview(organizationId);
    const period = this.buildPeriod(filters);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(filters);

        const [
          totalDeals,
          wonDealsAgg,
          pipelineAgg,
          totalClients,
          newClients,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
        ] = await Promise.all([
          // Deals
          this.prisma.deal.count({ where: { organizationId, ...dateFilter } }),
          this.prisma.deal.aggregate({
            where: { organizationId, stage: DealStage.CLOSED_WON, ...dateFilter },
            _count: { id: true },
            _sum: { value: true },
          }),
          this.prisma.deal.aggregate({
            where: {
              organizationId,
              stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
              ...dateFilter,
            },
            _sum: { value: true },
          }),
          // Clients
          this.prisma.client.count({ where: { organizationId, status: ClientStatus.ACTIVE } }),
          this.prisma.client.count({ where: { organizationId, ...dateFilter } }),
          // Tasks
          this.prisma.task.count({ where: { organizationId } }),
          this.prisma.task.count({ where: { organizationId, status: TaskStatus.COMPLETED } }),
          this.prisma.task.count({ where: { organizationId, status: TaskStatus.PENDING } }),
          this.prisma.task.count({
            where: {
              organizationId,
              status: TaskStatus.PENDING,
              dueDate: { lt: new Date() },
            },
          }),
        ]);

        const wonCount = wonDealsAgg._count.id;
        const conversionRate =
          totalDeals > 0 ? parseFloat(((wonCount / totalDeals) * 100).toFixed(2)) : 0;

        const completionRate =
          totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

        return {
          deals: {
            totalDeals,
            totalPipelineValue: Number(pipelineAgg._sum.value ?? 0),
            wonValue: Number(wonDealsAgg._sum.value ?? 0),
            conversionRate,
          },
          clients: {
            totalClients,
            newClientsInPeriod: newClients,
          },
          tasks: {
            totalTasks,
            pendingTasks,
            overdueTasks,
            completionRate,
          },
          period,
        } satisfies OverviewKpis;
      },
      ttl,
    );
  }

  // ─── Deals analytics ─────────────────────────────────────────────────────────

  async getDealsAnalytics(organizationId: string, filters: AnalyticsFilterDto): Promise<DealKpis> {
    const ttl = this.configService.get<number>('ANALYTICS_CACHE_TTL') ?? 300;
    const suffix = this.buildFilterSuffix(filters);
    const cacheKey = CacheKey.analyticsDeals(organizationId, suffix);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(filters);
        const userFilter = filters.userId ? { assignedToId: filters.userId } : {};

        const baseWhere: Prisma.DealWhereInput = {
          organizationId,
          ...dateFilter,
          ...userFilter,
        };

        // All aggregations in a single round-trip using Promise.all
        const [totalAgg, stageGroups, wonAgg] = await Promise.all([
          this.prisma.deal.aggregate({
            where: baseWhere,
            _count: { id: true },
            _sum: { value: true },
            _avg: { value: true },
          }),
          this.prisma.deal.groupBy({
            by: ['stage'],
            where: baseWhere,
            _count: { id: true },
            _sum: { value: true },
          }),
          this.prisma.deal.aggregate({
            where: { ...baseWhere, stage: DealStage.CLOSED_WON },
            _count: { id: true },
            _sum: { value: true },
          }),
        ]);

        const totalDeals = totalAgg._count.id;
        const stageMap = new Map(stageGroups.map((g) => [g.stage, g]));

        // Build stage breakdown — every stage always present
        const stageBreakdown: DealStageBreakdown[] = Object.values(DealStage).map((stage) => {
          const row = stageMap.get(stage);
          const count = row?._count.id ?? 0;
          return {
            stage,
            count,
            totalValue: Number(row?._sum.value ?? 0),
            percentage: totalDeals > 0 ? parseFloat(((count / totalDeals) * 100).toFixed(2)) : 0,
          };
        });

        const wonCount = wonAgg._count.id;
        const lostRow = stageMap.get(DealStage.CLOSED_LOST);

        return {
          totalDeals,
          totalPipelineValue: Number(totalAgg._sum.value ?? 0),
          wonValue: Number(wonAgg._sum.value ?? 0),
          lostDeals: lostRow?._count.id ?? 0,
          conversionRate:
            totalDeals > 0 ? parseFloat(((wonCount / totalDeals) * 100).toFixed(2)) : 0,
          averageDealValue: Number(totalAgg._avg.value ?? 0),
          stageBreakdown,
        } satisfies DealKpis;
      },
      ttl,
    );
  }

  // ─── User performance ─────────────────────────────────────────────────────────

  async getUsersPerformance(
    organizationId: string,
    filters: AnalyticsFilterDto,
  ): Promise<UserPerformance[]> {
    const ttl = this.configService.get<number>('ANALYTICS_CACHE_TTL') ?? 300;
    const cacheKey = CacheKey.analyticsUsers(organizationId);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(filters);

        // Fetch all active users in org
        const users = await this.prisma.user.findMany({
          where: { organizationId, isActive: true },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: { firstName: 'asc' },
        });

        if (users.length === 0) return [];

        // Single groupBy for all deal metrics per user
        const dealGroups = await this.prisma.deal.groupBy({
          by: ['assignedToId', 'stage'],
          where: {
            organizationId,
            assignedToId: { in: users.map((u) => u.id) },
            ...dateFilter,
          },
          _count: { id: true },
          _sum: { value: true },
        });

        // Map results per user
        return users.map((user): UserPerformance => {
          const userGroups = dealGroups.filter((g) => g.assignedToId === user.id);

          const totalDeals = userGroups.reduce((s, g) => s + g._count.id, 0);
          const wonGroup = userGroups.find((g) => g.stage === DealStage.CLOSED_WON);
          const lostGroup = userGroups.find((g) => g.stage === DealStage.CLOSED_LOST);

          const wonDeals = wonGroup?._count.id ?? 0;
          const lostDeals = lostGroup?._count.id ?? 0;
          const closedDeals = wonDeals + lostDeals;

          return {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            totalDeals,
            wonDeals,
            lostDeals,
            closeRate:
              closedDeals > 0 ? parseFloat(((wonDeals / closedDeals) * 100).toFixed(2)) : 0,
            totalValue: userGroups.reduce((s, g) => s + Number(g._sum.value ?? 0), 0),
            wonValue: Number(wonGroup?._sum.value ?? 0),
          };
        });
      },
      ttl,
    );
  }

  // ─── Clients analytics ────────────────────────────────────────────────────────

  async getClientsAnalytics(
    organizationId: string,
    filters: AnalyticsFilterDto,
  ): Promise<ClientKpis> {
    const ttl = this.configService.get<number>('ANALYTICS_CACHE_TTL') ?? 300;
    const suffix = this.buildFilterSuffix(filters);
    const cacheKey = CacheKey.analyticsClients(organizationId, suffix);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(filters);

        const [totalClients, newClients, clientsWithDeals, topClients] = await Promise.all([
          this.prisma.client.count({ where: { organizationId, status: ClientStatus.ACTIVE } }),

          this.prisma.client.count({ where: { organizationId, ...dateFilter } }),

          // Clients that have at least one deal
          this.prisma.client.count({
            where: { organizationId, deals: { some: {} } },
          }),

          // Top 10 clients by total deal value — no N+1: single query with aggregation
          this.prisma.deal.groupBy({
            by: ['clientId'],
            where: { organizationId, ...dateFilter },
            _count: { id: true },
            _sum: { value: true },
            orderBy: { _sum: { value: 'desc' } },
            take: 10,
          }),
        ]);

        // Hydrate client names in a single IN query
        const clientIds = topClients.map((r) => r.clientId);
        const clients: ClientNameRow[] =
          clientIds.length > 0
            ? await this.prisma.client.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, name: true, company: true },
              })
            : [];

        const clientMap = new Map<string, ClientNameRow>(clients.map((c) => [c.id, c]));

        return {
          totalClients,
          newClientsInPeriod: newClients,
          clientsWithDeals,
          topClientsByDealValue: topClients.map((row) => {
            const client = clientMap.get(row.clientId);
            return {
              clientId: row.clientId,
              clientName: client?.name ?? 'Unknown',
              company: client?.company ?? null,
              totalDeals: row._count.id,
              totalDealValue: Number(row._sum.value ?? 0),
            };
          }),
        } satisfies ClientKpis;
      },
      ttl,
    );
  }

  // ─── Tasks analytics ──────────────────────────────────────────────────────────

  async getTasksAnalytics(organizationId: string, filters: AnalyticsFilterDto): Promise<TaskKpis> {
    const ttl = this.configService.get<number>('ANALYTICS_CACHE_TTL') ?? 300;
    const suffix = this.buildFilterSuffix(filters);
    const cacheKey = CacheKey.analyticsTasks(organizationId, suffix);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.buildDateFilter(filters);

        const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
          this.prisma.task.count({ where: { organizationId, ...dateFilter } }),
          this.prisma.task.count({
            where: { organizationId, status: TaskStatus.COMPLETED, ...dateFilter },
          }),
          this.prisma.task.count({
            where: { organizationId, status: TaskStatus.PENDING, ...dateFilter },
          }),
          this.prisma.task.count({
            where: {
              organizationId,
              status: TaskStatus.PENDING,
              dueDate: { lt: new Date() },
              ...dateFilter,
            },
          }),
        ]);

        const completionRate =
          totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

        return {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate,
        } satisfies TaskKpis;
      },
      ttl,
    );
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────────

  async invalidateOrgCache(organizationId: string): Promise<void> {
    await this.cache.delByPattern(CacheKey.orgPattern(organizationId));
    this.logger.debug(`Analytics cache invalidated for org ${organizationId}`);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private buildDateFilter(filters: AnalyticsFilterDto): { createdAt?: { gte?: Date; lte?: Date } } {
    if (!filters.dateFrom && !filters.dateTo) return {};
    return {
      createdAt: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      },
    };
  }

  private buildPeriod(filters: AnalyticsFilterDto) {
    return { from: filters.dateFrom ?? null, to: filters.dateTo ?? null };
  }

  /** Stable string key from filter values — used for cache key uniqueness. */
  private buildFilterSuffix(filters: AnalyticsFilterDto): string {
    return [
      filters.dateFrom ?? 'all',
      filters.dateTo ?? 'all',
      filters.userId ?? 'all',
      filters.stage ?? 'all',
    ].join(':');
  }
}
