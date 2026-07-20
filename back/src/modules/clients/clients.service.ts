import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto/client.dto';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { EVENT } from '@/events/events/event.tokens';
import {
  ClientCreatedEvent,
  ClientUpdatedEvent,
  ClientArchivedEvent,
} from '@/events/events/domain.events';
import { PaginatedResult, buildPaginatedResult, clampLimit } from '@/common/types/shared.types';
import { Prisma, ClientStatus } from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateClientDto, requester: JwtPayload) {
    if (dto.email) {
      const existing = await this.prisma.client.findUnique({
        where: {
          email_organizationId: {
            email: dto.email,
            organizationId: requester.organizationId,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `A client with email "${dto.email}" already exists in this organization`,
        );
      }
    }

    const client = await this.prisma.client.create({
      data: {
        ...dto,
        organizationId: requester.organizationId,
        createdById: requester.sub,
      },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    this.eventEmitter.emit(
      EVENT.CLIENT_CREATED,
      new ClientCreatedEvent(client.id, client.name, requester.organizationId, requester.sub),
    );

    return client;
  }

  async findAll(organizationId: string, query: QueryClientDto): Promise<PaginatedResult<unknown>> {
    const { name, email, status, page = 1, limit = 20 } = query;
    const safeLimit = clampLimit(limit);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.ClientWhereInput = {
      organizationId,
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(email && { email: { contains: email, mode: 'insensitive' } }),
      ...(status ? { status } : { status: { not: ClientStatus.ARCHIVED } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { deals: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, safeLimit);
  }

  async findOne(id: string, organizationId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        deals: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            expectedCloseDate: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { deals: true } },
      },
    });

    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, organizationId: string, actorId: string) {
    const client = await this.prisma.client.findFirst({ where: { id, organizationId } });
    if (!client) throw new NotFoundException('Client not found');

    if (dto.email && dto.email !== client.email) {
      const conflict = await this.prisma.client.findUnique({
        where: { email_organizationId: { email: dto.email, organizationId } },
      });

      if (conflict) {
        throw new ConflictException(
          `A client with email "${dto.email}" already exists in this organization`,
        );
      }
    }

    // Scoped update — WHERE includes organizationId
    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    this.eventEmitter.emit(
      EVENT.CLIENT_UPDATED,
      new ClientUpdatedEvent(updated.id, updated.name, organizationId, actorId),
    );

    return updated;
  }

  async remove(id: string, organizationId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { deals: true } } },
    });

    if (!client) throw new NotFoundException('Client not found');

    if (client._count.deals > 0) {
      throw new BadRequestException(
        `Cannot delete a client with ${client._count.deals} associated deal(s). Archive the client instead.`,
      );
    }

    await this.prisma.client.delete({ where: { id } });
    this.logger.log(`Client ${id} deleted from org ${organizationId}`);
  }

  async archive(id: string, organizationId: string, actorId: string) {
    const client = await this.prisma.client.findFirst({ where: { id, organizationId } });
    if (!client) throw new NotFoundException('Client not found');

    const updated = await this.prisma.client.update({
      where: { id },
      data: { status: ClientStatus.ARCHIVED },
    });

    this.eventEmitter.emit(
      EVENT.CLIENT_ARCHIVED,
      new ClientArchivedEvent(client.id, client.name, organizationId, actorId),
    );

    return updated;
  }

  async assertBelongsToOrg(clientId: string, organizationId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found or does not belong to this organization');
    }
  }
}
