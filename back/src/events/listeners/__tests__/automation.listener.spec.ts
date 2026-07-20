import { Test, TestingModule } from '@nestjs/testing';
import { AutomationListener } from '../automation.listener';
import { TasksService } from '@/modules/tasks/tasks.service';
import { DealCreatedEvent, DealStageChangedEvent } from '@/events/events/domain.events';
import { DealStage } from '@prisma/client';

// Re-import from correct path (relative, since this is in the listeners dir)
// The actual file imports from @/events so we mirror that structure in tests

const mockTasksService = {
  createInternal: jest.fn(),
};

describe('AutomationListener', () => {
  let listener: AutomationListener;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-21T00:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [AutomationListener, { provide: TasksService, useValue: mockTasksService }],
    }).compile();

    listener = module.get<AutomationListener>(AutomationListener);
  });

  afterEach(() => jest.useRealTimers());

  // ─── deal.created automation ─────────────────────────────────────────────

  describe('onDealCreated', () => {
    it('should create a follow-up task due in 2 days', async () => {
      mockTasksService.createInternal.mockResolvedValue(undefined);

      const event = new DealCreatedEvent('deal-1', 'Big Sale', 'user-2', 'org-1', 'user-1');
      await listener.onDealCreated(event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);

      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toBe('Follow-up: Big Sale');
      expect(call.dealId).toBe('deal-1');
      expect(call.organizationId).toBe('org-1');

      // Due date should be +2 days from now
      const expectedDue = new Date('2026-06-23T00:00:00.000Z');
      expect(call.dueDate).toEqual(expectedDue);
    });

    it('should assign to actorId when no assignee exists on deal', async () => {
      mockTasksService.createInternal.mockResolvedValue(undefined);

      const event = new DealCreatedEvent('deal-1', 'Big Sale', null, 'org-1', 'user-1');
      await listener.onDealCreated(event);

      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.assignedToId).toBe('user-1'); // falls back to actor
    });

    it('should not throw even if createInternal fails (safe wrapper)', async () => {
      mockTasksService.createInternal.mockRejectedValue(new Error('DB error'));

      const event = new DealCreatedEvent('deal-1', 'Big Sale', null, 'org-1', 'user-1');

      await expect(listener.onDealCreated(event)).resolves.toBeUndefined();
    });
  });

  // ─── deal.stage_changed automation ───────────────────────────────────────

  describe('onDealStageChanged', () => {
    it('should create a proposal task when deal enters NEGOTIATION', async () => {
      mockTasksService.createInternal.mockResolvedValue(undefined);

      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.CONTACTED,
        DealStage.NEGOTIATION,
        'user-2',
        'org-1',
        'user-1',
      );

      await listener.onDealStageChanged(event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Prepare proposal');
      expect(call.dealId).toBe('deal-1');
    });

    it('should create an onboarding task when deal enters CLOSED_WON', async () => {
      mockTasksService.createInternal.mockResolvedValue(undefined);

      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.NEGOTIATION,
        DealStage.CLOSED_WON,
        'user-2',
        'org-1',
        'user-1',
      );

      await listener.onDealStageChanged(event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Onboarding');
    });

    it('should NOT create any task for CONTACTED stage', async () => {
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.LEAD,
        DealStage.CONTACTED,
        null,
        'org-1',
        'user-1',
      );

      await listener.onDealStageChanged(event);

      expect(mockTasksService.createInternal).not.toHaveBeenCalled();
    });

    it('should not throw even if createInternal fails (safe wrapper)', async () => {
      mockTasksService.createInternal.mockRejectedValue(new Error('DB error'));

      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.CONTACTED,
        DealStage.NEGOTIATION,
        null,
        'org-1',
        'user-1',
      );

      await expect(listener.onDealStageChanged(event)).resolves.toBeUndefined();
    });
  });
});
