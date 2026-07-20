import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto, CreateTaskInternalDto } from './dto/task.dto';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { EVENT } from '@/events/events/event.tokens';
import {
  TaskCreatedEvent,
  TaskCompletedEvent,
  TaskCancelledEvent,
} from '@/events/events/domain.events';
import { Prisma, Task, TaskStatus } from '@prisma/client';
import { PaginatedResult, buildPaginatedResult, clampLimit } from '@/common/types/shared.types';

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, title: true, stage: true } },
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Public (HTTP-facing) methods ─────────────────────────────────────────

  async create(dto: CreateTaskDto, requester: JwtPayload): Promise<Partial<Task>> {
    if (dto.assignedToId) {
      await this.assertUserInOrg(dto.assignedToId, requester.organizationId);
    }

    if (dto.dealId) {
      await this.assertDealInOrg(dto.dealId, requester.organizationId);
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedToId: dto.assignedToId ?? null,
        dealId: dto.dealId ?? null,
        organizationId: requester.organizationId,
        createdById: requester.sub,
      },
      select: TASK_SELECT,
    });

    this.eventEmitter.emit(
      EVENT.TASK_CREATED,
      new TaskCreatedEvent(
        task.id,
        task.title,
        task.deal?.id ?? null,
        task.assignedTo?.id ?? null,
        requester.organizationId,
        requester.sub,
      ),
    );

    return task;
  }

  async findAll(organizationId: string, query: QueryTaskDto): Promise<PaginatedResult<unknown>> {
    const { status, assignedToId, dealId, dueBefore, dueAfter, page = 1, limit = 20 } = query;
    const safeLimit = clampLimit(limit);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.TaskWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...(dealId && { dealId }),
      ...((dueBefore || dueAfter) && {
        dueDate: {
          ...(dueAfter && { gte: new Date(dueAfter) }),
          ...(dueBefore && { lte: new Date(dueBefore) }),
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        select: TASK_SELECT,
      }),
      this.prisma.task.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, safeLimit);
  }

  async findOne(id: string, organizationId: string): Promise<Partial<Task>> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
      select: TASK_SELECT,
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, requester: JwtPayload): Promise<Partial<Task>> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('A cancelled task cannot be edited');
    }

    if (dto.assignedToId) {
      await this.assertUserInOrg(dto.assignedToId, requester.organizationId);
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: TASK_SELECT,
    });
  }

  async complete(id: string, requester: JwtPayload): Promise<Partial<Task>> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task is already completed');
    }

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('A cancelled task cannot be completed');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.COMPLETED },
      select: TASK_SELECT,
    });

    this.eventEmitter.emit(
      EVENT.TASK_COMPLETED,
      new TaskCompletedEvent(task.id, task.title, requester.organizationId, requester.sub),
    );

    return updated;
  }

  async cancel(id: string, requester: JwtPayload): Promise<Partial<Task>> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('Task is already cancelled');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('A completed task cannot be cancelled');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CANCELLED },
      select: TASK_SELECT,
    });

    this.eventEmitter.emit(
      EVENT.TASK_CANCELLED,
      new TaskCancelledEvent(task.id, task.title, requester.organizationId, requester.sub),
    );

    return updated;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Completed tasks cannot be deleted. Cancel the task first.');
    }

    await this.prisma.task.delete({ where: { id } });
  }

  // ─── Internal method (called by AutomationListener) ───────────────────────

  /**
   * Creates a task from an automated trigger.
   * Skips HTTP validation and does NOT emit a TASK_CREATED event
   * to prevent infinite automation loops.
   */
  async createInternal(dto: CreateTaskInternalDto): Promise<void> {
    await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ?? null,
        assignedToId: dto.assignedToId ?? null,
        dealId: dto.dealId ?? null,
        organizationId: dto.organizationId,
        createdById: dto.createdById,
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertUserInOrg(userId: string, organizationId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, isActive: true },
    });

    if (!user) throw new NotFoundException('Assigned user not found in this organization');
  }

  private async assertDealInOrg(dealId: string, organizationId: string): Promise<void> {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });

    if (!deal) throw new NotFoundException('Deal not found in this organization');
  }
}
