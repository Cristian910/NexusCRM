import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import { ConfigService } from '@nestjs/config';
import { DealStage } from '@prisma/client';

const mockPrisma = {
  deal: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  client: { count: jest.fn(), findMany: jest.fn() },
  task: { count: jest.fn() },
  user: { findMany: jest.fn() },
};

const mockCache = {
  getOrSet: jest.fn(),
  delByPattern: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const values: Record<string, number> = {
      ANALYTICS_CACHE_TTL: 300,
      ANALYTICS_CACHE_OVERVIEW_TTL: 60,
    };
    return values[key] ?? null;
  }),
};

const ORG = 'org-1';

function passThrough() {
  mockCache.getOrSet.mockImplementation(async (_key: string, fn: () => Promise<unknown>) => fn());
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    passThrough();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisCacheService, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getOverview', () => {
    beforeEach(() => {
      mockPrisma.deal.count.mockResolvedValue(10);
      mockPrisma.deal.aggregate
        .mockResolvedValueOnce({ _count: { id: 3 }, _sum: { value: 15000 } })
        .mockResolvedValueOnce({ _sum: { value: 40000 } });
      mockPrisma.client.count.mockResolvedValueOnce(25).mockResolvedValueOnce(5);
      mockPrisma.task.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(2);
    });

    it('should return correct KPIs', async () => {
      const result = await service.getOverview(ORG, {});
      expect(result.deals.totalDeals).toBe(10);
      expect(result.deals.wonValue).toBe(15000);
      expect(result.deals.conversionRate).toBe(30);
      expect(result.clients.totalClients).toBe(25);
      expect(result.tasks.completionRate).toBe(60);
      expect(result.tasks.overdueTasks).toBe(2);
    });

    it('should call cache.getOrSet with the overview key and 60s TTL', async () => {
      await service.getOverview(ORG, {});
      expect(mockCache.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('overview'),
        expect.any(Function),
        60,
      );
    });

    it('should return 0% conversion when no deals exist', async () => {
      mockPrisma.deal.count.mockResolvedValue(0);
      mockPrisma.deal.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { value: 0 } });
      const result = await service.getOverview(ORG, {});
      expect(result.deals.conversionRate).toBe(0);
    });
  });

  describe('getDealsAnalytics', () => {
    beforeEach(() => {
      mockPrisma.deal.aggregate
        .mockResolvedValueOnce({
          _count: { id: 10 },
          _sum: { value: 50000 },
          _avg: { value: 5000 },
        })
        .mockResolvedValueOnce({ _count: { id: 3 }, _sum: { value: 15000 } });
      mockPrisma.deal.groupBy.mockResolvedValue([
        { stage: DealStage.LEAD, _count: { id: 4 }, _sum: { value: 20000 } },
        { stage: DealStage.CONTACTED, _count: { id: 2 }, _sum: { value: 10000 } },
        { stage: DealStage.NEGOTIATION, _count: { id: 1 }, _sum: { value: 5000 } },
        { stage: DealStage.CLOSED_WON, _count: { id: 3 }, _sum: { value: 15000 } },
      ]);
    });

    it('should always return all 5 stages in the breakdown', async () => {
      const result = await service.getDealsAnalytics(ORG, {});
      expect(result.stageBreakdown).toHaveLength(5);
    });

    it('should compute conversion rate correctly', async () => {
      const result = await service.getDealsAnalytics(ORG, {});
      expect(result.conversionRate).toBe(30);
    });

    it('should include CLOSED_LOST with count 0 when no lost deals exist', async () => {
      const result = await service.getDealsAnalytics(ORG, {});
      const lost = result.stageBreakdown.find((s) => s.stage === DealStage.CLOSED_LOST);
      expect(lost?.count).toBe(0);
    });

    it('should vary the cache key by userId filter', async () => {
      await service.getDealsAnalytics(ORG, { userId: 'user-42' });
      expect(mockCache.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('user-42'),
        expect.any(Function),
        300,
      );
    });

    it('should return stage percentages that sum to ~100', async () => {
      const result = await service.getDealsAnalytics(ORG, {});
      const sum = result.stageBreakdown.reduce((s, r) => s + r.percentage, 0);
      expect(Math.round(sum)).toBe(100);
    });
  });

  describe('getUsersPerformance', () => {
    const mockUsers = [
      { id: 'u1', firstName: 'Alice', lastName: 'Smith', email: 'alice@t.com' },
      { id: 'u2', firstName: 'Bob', lastName: 'Jones', email: 'bob@t.com' },
    ];

    beforeEach(() => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.deal.groupBy.mockResolvedValue([
        {
          assignedToId: 'u1',
          stage: DealStage.CLOSED_WON,
          _count: { id: 5 },
          _sum: { value: 25000 },
        },
        {
          assignedToId: 'u1',
          stage: DealStage.CLOSED_LOST,
          _count: { id: 2 },
          _sum: { value: 8000 },
        },
        { assignedToId: 'u2', stage: DealStage.LEAD, _count: { id: 3 }, _sum: { value: 12000 } },
      ]);
    });

    it('should return one row per user', async () => {
      const result = await service.getUsersPerformance(ORG, {});
      expect(result).toHaveLength(2);
    });

    it('should compute closeRate: won / (won + lost)', async () => {
      const result = await service.getUsersPerformance(ORG, {});
      const alice = result.find((r) => r.userId === 'u1');
      expect(alice?.closeRate).toBeCloseTo(71.43, 1);
    });

    it('should return 0 closeRate for user with no closed deals', async () => {
      const result = await service.getUsersPerformance(ORG, {});
      const bob = result.find((r) => r.userId === 'u2');
      expect(bob?.closeRate).toBe(0);
    });

    it('should return empty array when org has no active users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await service.getUsersPerformance(ORG, {});
      expect(result).toEqual([]);
    });
  });

  describe('getClientsAnalytics', () => {
    beforeEach(() => {
      mockPrisma.client.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(20);
      mockPrisma.deal.groupBy.mockResolvedValue([
        { clientId: 'c1', _count: { id: 5 }, _sum: { value: 30000 } },
        { clientId: 'c2', _count: { id: 3 }, _sum: { value: 15000 } },
      ]);
      mockPrisma.client.findMany.mockResolvedValue([
        { id: 'c1', name: 'Acme Corp', company: 'Acme' },
        { id: 'c2', name: 'Beta LLC', company: 'Beta' },
      ]);
    });

    it('should return top clients by deal value', async () => {
      const result = await service.getClientsAnalytics(ORG, {});
      expect(result.topClientsByDealValue[0].clientName).toBe('Acme Corp');
      expect(result.topClientsByDealValue[0].totalDealValue).toBe(30000);
    });

    it('should return correct client counts', async () => {
      const result = await service.getClientsAnalytics(ORG, {});
      expect(result.totalClients).toBe(30);
      expect(result.newClientsInPeriod).toBe(8);
      expect(result.clientsWithDeals).toBe(20);
    });
  });

  describe('invalidateOrgCache', () => {
    it('should call delByPattern with the org analytics namespace', async () => {
      mockCache.delByPattern.mockResolvedValue(undefined);
      await service.invalidateOrgCache(ORG);
      expect(mockCache.delByPattern).toHaveBeenCalledWith(`analytics:${ORG}:*`);
    });
  });
});
