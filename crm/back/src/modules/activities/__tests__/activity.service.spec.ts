import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from '../activity.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ActivityType, EntityType } from '@prisma/client';

const mockPrisma = {
  activity: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const baseLog = {
  type: ActivityType.DEAL_CREATED,
  description: 'Deal "Big Sale" was created',
  entityId: 'deal-1',
  entityType: EntityType.DEAL,
  userId: 'user-1',
  organizationId: 'org-1',
};

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  describe('log', () => {
    it('should write an activity record', async () => {
      mockPrisma.activity.create.mockResolvedValue({ id: 'act-1', ...baseLog });

      await service.log(baseLog);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.DEAL_CREATED,
          entityId: 'deal-1',
          entityType: EntityType.DEAL,
          userId: 'user-1',
          organizationId: 'org-1',
        }),
      });
    });

    it('should write metadata when provided', async () => {
      mockPrisma.activity.create.mockResolvedValue({ id: 'act-2' });

      await service.log({ ...baseLog, metadata: { fromStage: 'LEAD', toStage: 'CONTACTED' } });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { fromStage: 'LEAD', toStage: 'CONTACTED' },
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated activities scoped to org', async () => {
      const mockActivity = { id: 'act-1', ...baseLog, createdAt: new Date() };
      mockPrisma.$transaction.mockResolvedValue([[mockActivity], 1]);

      const result = await service.findAll('org-1', { page: 1, limit: 30 });

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by entityId', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll('org-1', { entityId: 'deal-1', page: 1, limit: 30 });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('should delegate to findAll with entityId filter', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findByEntity('deal-1', 'org-1');

      expect(result.meta.total).toBe(0);
    });
  });
});
