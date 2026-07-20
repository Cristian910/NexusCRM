import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationListener } from '../cache-invalidation.listener';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import {
  ClientCreatedEvent,
  DealCreatedEvent,
  DealStageChangedEvent,
} from '@/events/events/domain.events';
import { DealStage } from '@prisma/client';

const mockAnalyticsService = { invalidateOrgCache: jest.fn() };

describe('CacheInvalidationListener', () => {
  let listener: CacheInvalidationListener;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAnalyticsService.invalidateOrgCache.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationListener,
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    listener = module.get<CacheInvalidationListener>(CacheInvalidationListener);
  });

  it('should invalidate cache on deal.created', async () => {
    const event = new DealCreatedEvent('d1', 'Big Deal', null, 'org-1', 'user-1');
    await listener.onDealCreated(event);
    expect(mockAnalyticsService.invalidateOrgCache).toHaveBeenCalledWith('org-1');
  });

  it('should invalidate cache on deal.stage_changed', async () => {
    const event = new DealStageChangedEvent(
      'd1',
      'Big Deal',
      DealStage.LEAD,
      DealStage.CONTACTED,
      null,
      'org-1',
      'user-1',
    );
    await listener.onDealStageChanged(event);
    expect(mockAnalyticsService.invalidateOrgCache).toHaveBeenCalledWith('org-1');
  });

  it('should invalidate cache on client.created', async () => {
    const event = new ClientCreatedEvent('c1', 'Acme', 'org-1', 'user-1');
    await listener.onClientCreated(event);
    expect(mockAnalyticsService.invalidateOrgCache).toHaveBeenCalledWith('org-1');
  });

  it('should not throw when invalidation fails', async () => {
    mockAnalyticsService.invalidateOrgCache.mockRejectedValue(new Error('Redis down'));
    const event = new DealCreatedEvent('d1', 'Deal', null, 'org-1', 'user-1');
    await expect(listener.onDealCreated(event)).resolves.toBeUndefined();
  });
});
