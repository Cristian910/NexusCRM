import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealsService } from '../deals.service';
import { ClientsService } from '@/modules/clients/clients.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DealStage, Role } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  deal: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  dealStageHistory: {
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockClientsService = {
  assertBelongsToOrg: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() };

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const requester = {
  sub: 'user-1',
  email: 'admin@test.com',
  organizationId: 'org-1',
  role: Role.OWNER,
};

const mockDeal = {
  id: 'deal-1',
  title: 'Big Sale',
  value: 5000,
  stage: DealStage.LEAD,
  clientId: 'client-1',
  assignedToId: 'user-1',
  createdById: 'user-1',
  organizationId: 'org-1',
  expectedCloseDate: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 'client-1', name: 'Acme Inc', email: 'contact@acme.com', company: null },
  assignedTo: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
  createdBy: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DealsService', () => {
  let service: DealsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClientsService, useValue: mockClientsService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      title: 'Big Sale',
      value: 5000,
      clientId: 'client-1',
      assignedToId: 'user-1',
    };

    it('should create a deal when client and assignee belong to org', async () => {
      mockClientsService.assertBelongsToOrg.mockResolvedValue(undefined);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
      );
      mockPrisma.deal.create.mockResolvedValue(mockDeal);
      mockPrisma.dealStageHistory.create.mockResolvedValue({});

      const result = await service.create(dto, requester);

      expect(mockClientsService.assertBelongsToOrg).toHaveBeenCalledWith('client-1', 'org-1');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', organizationId: 'org-1', isActive: true },
      });
      expect(result).toMatchObject({ title: 'Big Sale' });
    });

    it('should throw NotFoundException when client not in org', async () => {
      mockClientsService.assertBelongsToOrg.mockRejectedValue(
        new NotFoundException('Client not found'),
      );

      await expect(service.create(dto, requester)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when assignee not in org', async () => {
      mockClientsService.assertBelongsToOrg.mockResolvedValue(undefined);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, requester)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return deal when found', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal);

      const result = await service.findOne('deal-1', 'org-1');
      expect(result).toMatchObject({ id: 'deal-1' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a deal that is not closed', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal);
      mockPrisma.deal.update.mockResolvedValue({ ...mockDeal, title: 'Updated' });

      const result = await service.update('deal-1', { title: 'Updated' }, requester);
      expect(result).toMatchObject({ title: 'Updated' });
    });

    it('should throw BadRequestException when updating a closed deal', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.CLOSED_WON,
      });

      await expect(service.update('deal-1', { title: 'New Title' }, requester)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate new assignee when changing assignee', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal);
      mockPrisma.user.findFirst.mockResolvedValue(null); // not in org

      await expect(
        service.update('deal-1', { assignedToId: 'foreign-user' }, requester),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── changeStage ─────────────────────────────────────────────────────────

  describe('changeStage', () => {
    it('should advance stage along valid path', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal); // stage: LEAD
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
      );
      mockPrisma.deal.update.mockResolvedValue({ ...mockDeal, stage: DealStage.CONTACTED });
      mockPrisma.dealStageHistory.create.mockResolvedValue({});

      const result = await service.changeStage(
        'deal-1',
        { stage: DealStage.CONTACTED, note: 'Called the client' },
        requester,
      );

      expect(result).toMatchObject({ stage: DealStage.CONTACTED });
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal); // stage: LEAD

      // Cannot jump directly from LEAD to CLOSED_WON
      await expect(
        service.changeStage('deal-1', { stage: DealStage.CLOSED_WON }, requester),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transitioning to same stage', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(mockDeal); // stage: LEAD

      await expect(
        service.changeStage('deal-1', { stage: DealStage.LEAD }, requester),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow re-opening a closed deal back to NEGOTIATION', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.CLOSED_LOST,
      });
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
      );
      mockPrisma.deal.update.mockResolvedValue({ ...mockDeal, stage: DealStage.NEGOTIATION });
      mockPrisma.dealStageHistory.create.mockResolvedValue({});

      const result = await service.changeStage(
        'deal-1',
        { stage: DealStage.NEGOTIATION, note: 'Client came back' },
        requester,
      );

      expect(result).toMatchObject({ stage: DealStage.NEGOTIATION });
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a non-won deal', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue({ ...mockDeal, stage: DealStage.LEAD });
      mockPrisma.deal.delete.mockResolvedValue(mockDeal);

      await expect(service.remove('deal-1', requester)).resolves.toBeUndefined();
      expect(mockPrisma.deal.delete).toHaveBeenCalledWith({ where: { id: 'deal-1' } });
    });

    it('should throw ForbiddenException when deleting a won deal', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue({
        ...mockDeal,
        stage: DealStage.CLOSED_WON,
      });

      await expect(service.remove('deal-1', requester)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.deal.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getPipelineSummary ──────────────────────────────────────────────────

  describe('getPipelineSummary', () => {
    it('should return all stages with counts and values', async () => {
      mockPrisma.deal.groupBy.mockResolvedValue([
        { stage: DealStage.LEAD, _count: { id: 3 }, _sum: { value: 9000 } },
        { stage: DealStage.CLOSED_WON, _count: { id: 1 }, _sum: { value: 5000 } },
      ]);

      const result = await service.getPipelineSummary('org-1');

      expect(result).toHaveLength(5); // All 5 stages always present
      const lead = result.find((r) => r.stage === DealStage.LEAD);
      expect(lead).toMatchObject({ count: 3, totalValue: 9000 });

      const contacted = result.find((r) => r.stage === DealStage.CONTACTED);
      expect(contacted).toMatchObject({ count: 0, totalValue: 0 });
    });
  });
});
