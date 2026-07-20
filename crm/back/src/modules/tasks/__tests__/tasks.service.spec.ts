import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from '../tasks.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatus, Role } from '@prisma/client';
import { EVENT } from '@/events/events/event.tokens';

const mockPrisma = {
  task: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findFirst: jest.fn() },
  deal: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() };

const requester = {
  sub: 'user-1',
  email: 'user@test.com',
  organizationId: 'org-1',
  role: Role.MEMBER,
};

const mockTask = {
  id: 'task-1',
  title: 'Follow-up',
  description: null,
  dueDate: new Date(),
  status: TaskStatus.PENDING,
  assignedToId: 'user-1',
  dealId: 'deal-1',
  createdById: 'user-1',
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  assignedTo: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
  createdBy: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
  deal: { id: 'deal-1', title: 'Big Deal', stage: 'LEAD' },
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a task and emit TASK_CREATED event', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.deal.findFirst.mockResolvedValue({ id: 'deal-1' });
      mockPrisma.task.create.mockResolvedValue(mockTask);

      const result = await service.create(
        { title: 'Follow-up', assignedToId: 'user-1', dealId: 'deal-1' },
        requester,
      );

      expect(result).toMatchObject({ title: 'Follow-up' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT.TASK_CREATED,
        expect.objectContaining({ taskId: 'task-1' }),
      );
    });

    it('should throw NotFoundException when assignee not in org', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ title: 'Task', assignedToId: 'foreign-user' }, requester),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deal not in org', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ title: 'Task', dealId: 'foreign-deal' }, requester),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── complete ────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('should complete a pending task and emit TASK_COMPLETED', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({ ...mockTask, status: TaskStatus.COMPLETED });

      await service.complete('task-1', requester);

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: TaskStatus.COMPLETED } }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT.TASK_COMPLETED,
        expect.objectContaining({ taskId: 'task-1' }),
      );
    });

    it('should throw BadRequestException when already completed', async () => {
      mockPrisma.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(service.complete('task-1', requester)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when task is cancelled', async () => {
      mockPrisma.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.CANCELLED,
      });

      await expect(service.complete('task-1', requester)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── cancel ──────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel a pending task and emit TASK_CANCELLED', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({ ...mockTask, status: TaskStatus.CANCELLED });

      await service.cancel('task-1', requester);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT.TASK_CANCELLED,
        expect.objectContaining({ taskId: 'task-1' }),
      );
    });

    it('should throw BadRequestException when cancelling a completed task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(service.cancel('task-1', requester)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a pending task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockResolvedValue(mockTask);

      await expect(service.remove('task-1', 'org-1')).resolves.toBeUndefined();
    });

    it('should throw BadRequestException when deleting a completed task', async () => {
      mockPrisma.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(service.remove('task-1', 'org-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── createInternal ──────────────────────────────────────────────────────

  describe('createInternal', () => {
    it('should create task without emitting events (automation path)', async () => {
      mockPrisma.task.create.mockResolvedValue({ id: 'task-auto-1' });

      await service.createInternal({
        title: 'Follow-up: Big Deal',
        organizationId: 'org-1',
        createdById: 'user-1',
        dealId: 'deal-1',
      });

      expect(mockPrisma.task.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
