import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { CreateNotificationJobPayload } from '@/queues/dto/job-payloads.dto';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@/common/types/shared.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called by NotificationProcessor — never directly from controllers.
   * Runs inside a queue job so failures are retried automatically.
   */
  async createInternal(payload: CreateNotificationJobPayload): Promise<void> {
    await this.prisma.notification.create({
      data: {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        userId: payload.userId,
        organizationId: payload.organizationId,
        metadata: (payload.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    this.logger.debug(`Notification created for userId=${payload.userId} type=${payload.type}`);
  }

  async findMyNotifications(
    userId: string,
    organizationId: string,
    query: QueryNotificationDto,
  ): Promise<PaginatedResult<unknown>> {
    const { type, unreadOnly, page = 1, limit = 20 } = query;
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      organizationId,
      ...(type && { type }),
      ...(unreadOnly && { read: false }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getUnreadCount(userId: string, organizationId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, organizationId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string, organizationId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, organizationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, organizationId, read: false },
      data: { read: true },
    });

    return { updated: result.count };
  }
}
