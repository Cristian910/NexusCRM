import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { ClientsService } from '@/modules/clients/clients.service';
import { CreateDealDto, UpdateDealDto, ChangeDealStageDto, QueryDealDto } from './dto/deal.dto';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { assertValidTransition, isClosed } from './deal-stage.rules';
import { EVENT } from '@/events/events/event.tokens';
import {
  DealCreatedEvent,
  DealUpdatedEvent,
  DealStageChangedEvent,
  DealAssignedEvent,
} from '@/events/events/domain.events';
import { Prisma, DealStage } from '@prisma/client';
import { PaginatedResult, buildPaginatedResult, clampLimit } from '@/common/types/shared.types';

const DEAL_LIST_SELECT = {
  id: true,
  title: true,
  value: true,
  stage: true,
  expectedCloseDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, email: true, company: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateDealDto, requester: JwtPayload) {
    await this.clientsService.assertBelongsToOrg(dto.clientId, requester.organizationId);

    if (dto.assignedToId) {
      await this.assertUserBelongsToOrg(dto.assignedToId, requester.organizationId);
    }

    const deal = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.deal.create({
        data: {
          title: dto.title,
          value: dto.value ?? 0,
          stage: dto.stage ?? DealStage.LEAD,
          clientId: dto.clientId,
          assignedToId: dto.assignedToId ?? null,
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
          notes: dto.notes ?? null,
          organizationId: requester.organizationId,
          createdById: requester.sub,
        },
        select: DEAL_LIST_SELECT,
      });

      await tx.dealStageHistory.create({
        data: {
          dealId: created.id,
          fromStage: null,
          toStage: created.stage,
          changedById: requester.sub,
          note: 'Deal created',
        },
      });

      return created;
    });

    this.eventEmitter.emit(
      EVENT.DEAL_CREATED,
      new DealCreatedEvent(
        deal.id,
        deal.title,
        deal.assignedTo?.id ?? null,
        requester.organizationId,
        requester.sub,
      ),
    );

    if (dto.assignedToId) {
      const actorName = await this.resolveUserName(requester.sub);
      this.eventEmitter.emit(
        EVENT.DEAL_ASSIGNED,
        new DealAssignedEvent(
          deal.id,
          deal.title,
          dto.assignedToId,
          actorName,
          requester.organizationId,
          requester.sub,
        ),
      );
    }

    return deal;
  }

  async findAll(organizationId: string, query: QueryDealDto): Promise<PaginatedResult<unknown>> {
    const {
      stage,
      assignedToId,
      clientId,
      createdFrom,
      createdTo,
      search,
      page = 1,
      limit = 20,
    } = query;

    const safeLimit = clampLimit(limit);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.DealWhereInput = {
      organizationId,
      ...(stage && { stage }),
      ...(assignedToId && { assignedToId }),
      ...(clientId && { clientId }),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              ...(createdFrom && { gte: new Date(createdFrom) }),
              ...(createdTo && { lte: new Date(createdTo) }),
            },
          }
        : {}),
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: DEAL_LIST_SELECT,
      }),
      this.prisma.deal.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, safeLimit);
  }

  async findOne(id: string, organizationId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, company: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        stageHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            note: true,
            createdAt: true,
            changedById: true,
          },
        },
        tasks: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async update(id: string, dto: UpdateDealDto, requester: JwtPayload) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!deal) throw new NotFoundException('Deal not found');

    if (isClosed(deal.stage)) {
      throw new BadRequestException(
        'A closed deal cannot be edited. Re-open it by changing the stage first.',
      );
    }

    const previousAssigneeId = deal.assignedToId;

    if (dto.assignedToId !== undefined && dto.assignedToId !== null) {
      await this.assertUserBelongsToOrg(dto.assignedToId, requester.organizationId);
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.expectedCloseDate !== undefined && {
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: DEAL_LIST_SELECT,
    });

    this.eventEmitter.emit(
      EVENT.DEAL_UPDATED,
      new DealUpdatedEvent(deal.id, updated.title, requester.organizationId, requester.sub),
    );

    // Emit assignment event only if assignee actually changed
    if (dto.assignedToId && dto.assignedToId !== previousAssigneeId) {
      const actorName = await this.resolveUserName(requester.sub);
      this.eventEmitter.emit(
        EVENT.DEAL_ASSIGNED,
        new DealAssignedEvent(
          deal.id,
          updated.title,
          dto.assignedToId,
          actorName,
          requester.organizationId,
          requester.sub,
        ),
      );
    }

    return updated;
  }

  async changeStage(id: string, dto: ChangeDealStageDto, requester: JwtPayload) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!deal) throw new NotFoundException('Deal not found');

    assertValidTransition(deal.stage, dto.stage);

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const result = await tx.deal.update({
        where: { id },
        data: { stage: dto.stage },
        select: DEAL_LIST_SELECT,
      });

      await tx.dealStageHistory.create({
        data: {
          dealId: id,
          fromStage: deal.stage,
          toStage: dto.stage,
          changedById: requester.sub,
          note: dto.note ?? null,
        },
      });

      return result;
    });

    this.eventEmitter.emit(
      EVENT.DEAL_STAGE_CHANGED,
      new DealStageChangedEvent(
        deal.id,
        updated.title,
        deal.stage,
        dto.stage,
        deal.assignedToId,
        requester.organizationId,
        requester.sub,
      ),
    );

    return updated;
  }

  async remove(id: string, requester: JwtPayload) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId: requester.organizationId },
    });

    if (!deal) throw new NotFoundException('Deal not found');

    if (deal.stage === DealStage.CLOSED_WON) {
      throw new ForbiddenException(
        'Won deals cannot be deleted. Change the stage to remove them from active pipeline.',
      );
    }

    await this.prisma.deal.delete({ where: { id } });
  }

  async getPipelineSummary(organizationId: string) {
    const stages = Object.values(DealStage);

    const results = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { organizationId },
      _count: { id: true },
      _sum: { value: true },
    });

    const stageMap = new Map(results.map((r) => [r.stage, r]));

    return stages.map((stage) => {
      const row = stageMap.get(stage);
      return {
        stage,
        count: row?._count.id ?? 0,
        totalValue: row?._sum.value ?? 0,
      };
    });
  }

  private async assertUserBelongsToOrg(userId: string, organizationId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(
        'Assigned user not found or does not belong to this organization',
      );
    }
  }
  private async resolveUserName(userId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    return user ? `${user.firstName} ${user.lastName}` : 'A team member';
  }
}
