import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const basePayload = {
  userId: 'user-1',
  organizationId: 'org-1',
  title: 'Test notification',
  message: 'Something happened',
  type: NotificationType.INFO,
};

const mockNotification = {
  id: 'notif-1',
  ...basePayload,
  read: false,
  metadata: null,
  createdAt: new Date(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createInternal', () => {
    it('should create a notification record', async () => {
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.createInternal(basePayload);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          organizationId: 'org-1',
          title: 'Test notification',
          type: NotificationType.INFO,
        }),
      });
    });
  });

  describe('findMyNotifications', () => {
    it('should return paginated notifications scoped to user + org', async () => {
      mockPrisma.$transaction.mockResolvedValue([[mockNotification], 1]);

      const result = await service.findMyNotifications('user-1', 'org-1', { page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by unreadOnly', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findMyNotifications('user-1', 'org-1', { unreadOnly: true });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return the unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1', 'org-1');

      expect(result).toEqual({ count: 5 });
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: 'org-1', read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read when it belongs to user', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, read: true });

      await service.markAsRead('notif-1', 'user-1', 'org-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('bad-id', 'user-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-1', 'org-1');

      expect(result).toEqual({ updated: 3 });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: 'org-1', read: false },
        data: { read: true },
      });
    });
  });
});
