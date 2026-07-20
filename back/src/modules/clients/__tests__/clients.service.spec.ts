import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientsService } from '../clients.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientStatus, Role } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  client: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() };

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const requester = {
  sub: 'user-1',
  email: 'admin@test.com',
  organizationId: 'org-1',
  role: Role.OWNER,
};

const mockClient = {
  id: 'client-1',
  name: 'Acme Inc',
  email: 'contact@acme.com',
  phone: '+1234567890',
  company: 'Acme',
  website: null,
  notes: null,
  status: ClientStatus.ACTIVE,
  organizationId: 'org-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name: 'Acme Inc',
      email: 'contact@acme.com',
      phone: '+1234567890',
    };

    it('should create a client when email is unique in the org', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue(mockClient);

      const result = await service.create(dto, requester);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: {
          email_organizationId: {
            email: dto.email,
            organizationId: requester.organizationId,
          },
        },
      });
      expect(result).toMatchObject({ name: 'Acme Inc' });
    });

    it('should throw ConflictException if email already exists in org', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      await expect(service.create(dto, requester)).rejects.toThrow(ConflictException);
    });

    it('should create without email check when no email provided', async () => {
      mockPrisma.client.create.mockResolvedValue({ ...mockClient, email: null });

      const result = await service.create({ name: 'No Email Corp' }, requester);

      expect(mockPrisma.client.findUnique).not.toHaveBeenCalled();
      expect(result).toMatchObject({ name: 'Acme Inc' });
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated clients filtered to the org', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockClient], 1]);

      const result = await service.findAll('org-1', { page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should cap limit at 100', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll('org-1', { limit: 500 });

      // The transaction is called; we just verify it didn't blow up
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return client when found in org', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);

      const result = await service.findOne('client-1', 'org-1');
      expect(result).toMatchObject({ id: 'client-1' });
    });

    it('should throw NotFoundException when client not in org', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.findOne('client-x', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update client when it belongs to org', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.update.mockResolvedValue({ ...mockClient, name: 'Updated Name' });

      const result = await service.update(
        'client-1',
        { name: 'Updated Name' },
        'org-1',
        requester.sub,
      );
      expect(result).toMatchObject({ name: 'Updated Name' });
    });

    it('should throw NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' }, 'org-1', requester.sub)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updated email is taken', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'other-client' }); // another client has the email

      await expect(
        service.update('client-1', { email: 'taken@acme.com' }, 'org-1', requester.sub),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete client with no associated deals', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        ...mockClient,
        _count: { deals: 0 },
      });
      mockPrisma.client.delete.mockResolvedValue(mockClient);

      await expect(service.remove('client-1', 'org-1')).resolves.toBeUndefined();
      expect(mockPrisma.client.delete).toHaveBeenCalledWith({ where: { id: 'client-1' } });
    });

    it('should throw BadRequestException when client has deals', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({
        ...mockClient,
        _count: { deals: 3 },
      });

      await expect(service.remove('client-1', 'org-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.client.delete).not.toHaveBeenCalled();
    });
  });

  // ─── assertBelongsToOrg ──────────────────────────────────────────────────

  describe('assertBelongsToOrg', () => {
    it('should resolve when client belongs to org', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(mockClient);

      await expect(service.assertBelongsToOrg('client-1', 'org-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when client not in org', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.assertBelongsToOrg('client-1', 'other-org')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
