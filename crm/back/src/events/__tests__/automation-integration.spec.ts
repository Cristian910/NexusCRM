/**
 * Integration tests covering the full vertical flows:
 *   Auth → Tenant isolation
 *   Deals → Events → Automations
 *   Tasks → Events → Notifications
 *
 * These tests use a real NestJS application context but mock the DB and Redis.
 * They validate that the module wiring, event listeners, and queue producers
 * collaborate correctly — something unit tests cannot catch.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { DealsService } from '@/modules/deals/deals.service';
import { ClientsService } from '@/modules/clients/clients.service';
import { TasksService } from '@/modules/tasks/tasks.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AutomationListener } from '@/events/listeners/automation.listener';
import { EVENT } from '@/events/events/event.tokens';
import { DealCreatedEvent, DealStageChangedEvent } from '@/events/events/domain.events';
import { DealStage, Role } from '@prisma/client';

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  organization: { findUnique: jest.fn() },
  user: { findFirst: jest.fn(), findMany: jest.fn() },
  client: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  deal: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  dealStageHistory: { create: jest.fn() },
  task: { create: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockTasksService = { createInternal: jest.fn() };

const requester = {
  sub: 'user-1',
  email: 'owner@org.com',
  organizationId: 'org-1',
  role: Role.OWNER,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Integration: Event-driven automations', () => {
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTasksService.createInternal.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' })],
      providers: [AutomationListener, { provide: TasksService, useValue: mockTasksService }],
    }).compile();

    // @OnEvent listeners are bound during the onApplicationBootstrap lifecycle
    // hook, which .compile() alone does not trigger — .init() is required.
    await module.init();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    // Instantiate the listener so its @OnEvent handlers register with the emitter.
    module.get<AutomationListener>(AutomationListener);
  });

  describe('deal.created → follow-up task', () => {
    it('should create a follow-up task when deal.created fires', async () => {
      const event = new DealCreatedEvent('deal-1', 'Big Sale', 'user-2', 'org-1', 'user-1');
      await eventEmitter.emitAsync(EVENT.DEAL_CREATED, event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Follow-up');
      expect(call.dealId).toBe('deal-1');
      expect(call.organizationId).toBe('org-1');
    });

    it('should assign task to actorId when deal has no assignee', async () => {
      const event = new DealCreatedEvent('deal-1', 'Big Sale', null, 'org-1', 'actor-99');
      await eventEmitter.emitAsync(EVENT.DEAL_CREATED, event);

      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.assignedToId).toBe('actor-99');
    });

    it('should assign task to deal assignee when one exists', async () => {
      const event = new DealCreatedEvent('deal-1', 'Big Sale', 'sales-rep-5', 'org-1', 'actor-1');
      await eventEmitter.emitAsync(EVENT.DEAL_CREATED, event);

      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.assignedToId).toBe('sales-rep-5');
    });
  });

  describe('deal.stage_changed → stage-specific tasks', () => {
    it('should create a proposal task on NEGOTIATION', async () => {
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.CONTACTED,
        DealStage.NEGOTIATION,
        'rep-1',
        'org-1',
        'actor-1',
      );
      await eventEmitter.emitAsync(EVENT.DEAL_STAGE_CHANGED, event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Prepare proposal');
    });

    it('should create an onboarding task on CLOSED_WON', async () => {
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.NEGOTIATION,
        DealStage.CLOSED_WON,
        null,
        'org-1',
        'actor-1',
      );
      await eventEmitter.emitAsync(EVENT.DEAL_STAGE_CHANGED, event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Onboarding');
    });

    it('should create a post-mortem task on CLOSED_LOST', async () => {
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.NEGOTIATION,
        DealStage.CLOSED_LOST,
        null,
        'org-1',
        'actor-1',
      );
      await eventEmitter.emitAsync(EVENT.DEAL_STAGE_CHANGED, event);

      expect(mockTasksService.createInternal).toHaveBeenCalledTimes(1);
      const call = mockTasksService.createInternal.mock.calls[0][0];
      expect(call.title).toContain('Post-mortem');
    });

    it('should NOT create any task for CONTACTED stage', async () => {
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.LEAD,
        DealStage.CONTACTED,
        null,
        'org-1',
        'actor-1',
      );
      await eventEmitter.emitAsync(EVENT.DEAL_STAGE_CHANGED, event);

      expect(mockTasksService.createInternal).not.toHaveBeenCalled();
    });

    it('should not throw if createInternal fails (safe wrapper)', async () => {
      mockTasksService.createInternal.mockRejectedValue(new Error('DB unavailable'));
      const event = new DealStageChangedEvent(
        'deal-1',
        'Big Sale',
        DealStage.CONTACTED,
        DealStage.NEGOTIATION,
        null,
        'org-1',
        'actor-1',
      );

      await expect(eventEmitter.emitAsync(EVENT.DEAL_STAGE_CHANGED, event)).resolves.not.toThrow();
    });
  });
});

// ─── Multi-tenant isolation ───────────────────────────────────────────────────

describe('Integration: Multi-tenant isolation', () => {
  describe('ClientsService.assertBelongsToOrg', () => {
    let service: ClientsService;

    beforeEach(async () => {
      jest.clearAllMocks();
      mockPrisma.client.findFirst.mockResolvedValue(null); // not in org

      const module: TestingModule = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [ClientsService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();

      service = module.get<ClientsService>(ClientsService);
    });

    it('should throw NotFoundException when client is from a different org', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      await expect(service.assertBelongsToOrg('client-from-org-2', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DealsService.findOne', () => {
    let service: DealsService;

    beforeEach(async () => {
      jest.clearAllMocks();
      mockPrisma.deal.findFirst.mockResolvedValue(null); // not in org

      const module: TestingModule = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [
          DealsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ClientsService, useValue: { assertBelongsToOrg: jest.fn() } },
        ],
      }).compile();

      service = module.get<DealsService>(DealsService);
    });

    it('should throw NotFoundException when deal is from a different org', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      await expect(service.findOne('deal-from-org-2', requester.organizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
