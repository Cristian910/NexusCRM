import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEmailListener } from '../notification-email.listener';
import { QueueProducerService } from '@/queues/queue-producer.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DealAssignedEvent, TaskCreatedEvent } from '../../events/domain.events';

const mockQueueProducer = {
  enqueueEmail: jest.fn(),
  enqueueNotification: jest.fn(),
  enqueueTaskReminder: jest.fn(),
};

const mockAssignee = {
  id: 'user-2',
  email: 'assignee@test.com',
  firstName: 'Jane',
  lastName: 'Smith',
};

const mockActor = { firstName: 'John', lastName: 'Doe' };

const mockTask = {
  id: 'task-1',
  title: 'Follow-up',
  description: null,
  dueDate: new Date(Date.now() + 86_400_000),
  dealId: 'deal-1',
  deal: { title: 'Big Deal' },
};

const mockPrisma = {
  user: { findFirst: jest.fn() },
  task: { findFirst: jest.fn() },
};

describe('NotificationEmailListener', () => {
  let listener: NotificationEmailListener;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEmailListener,
        { provide: QueueProducerService, useValue: mockQueueProducer },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    listener = module.get<NotificationEmailListener>(NotificationEmailListener);
  });

  describe('onDealAssigned', () => {
    it('should enqueue email and notification when deal is assigned', async () => {
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockAssignee); // assignee lookup

      mockQueueProducer.enqueueEmail.mockResolvedValue(undefined);
      mockQueueProducer.enqueueNotification.mockResolvedValue(undefined);

      const event = new DealAssignedEvent(
        'deal-1',
        'Big Deal',
        'user-2',
        `${mockActor.firstName} ${mockActor.lastName}`,
        'org-1',
        'user-1',
      );
      await listener.onDealAssigned(event);

      expect(mockQueueProducer.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'assignee@test.com',
          template: 'deal-assigned',
        }),
      );
      expect(mockQueueProducer.enqueueNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-2', type: 'INFO' }),
      );
    });

    it('should not enqueue anything when assignee does not exist in org', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const event = new DealAssignedEvent(
        'deal-1',
        'Big Deal',
        'ghost-user',
        `${mockActor.firstName} ${mockActor.lastName}`,
        'org-1',
        'user-1',
      );
      await listener.onDealAssigned(event);

      expect(mockQueueProducer.enqueueEmail).not.toHaveBeenCalled();
      expect(mockQueueProducer.enqueueNotification).not.toHaveBeenCalled();
    });

    it('should not throw when queue fails (safe wrapper)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockAssignee);
      mockQueueProducer.enqueueEmail.mockRejectedValue(new Error('Redis down'));

      const event = new DealAssignedEvent(
        'deal-1',
        'Big Deal',
        'user-2',
        `${mockActor.firstName} ${mockActor.lastName}`,
        'org-1',
        'user-1',
      );
      await expect(listener.onDealAssigned(event)).resolves.toBeUndefined();
    });
  });

  describe('onTaskCreated', () => {
    it('should enqueue email, notification and reminder when task has due date', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockAssignee);
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      mockQueueProducer.enqueueEmail.mockResolvedValue(undefined);
      mockQueueProducer.enqueueNotification.mockResolvedValue(undefined);
      mockQueueProducer.enqueueTaskReminder.mockResolvedValue(undefined);

      const event = new TaskCreatedEvent(
        'task-1',
        'Follow-up',
        'deal-1',
        'user-2',
        'org-1',
        'user-1',
      );
      await listener.onTaskCreated(event);

      expect(mockQueueProducer.enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({ template: 'task-assigned', to: 'assignee@test.com' }),
      );
      expect(mockQueueProducer.enqueueNotification).toHaveBeenCalled();
      expect(mockQueueProducer.enqueueTaskReminder).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: 'task-1' }),
      );
    });

    it('should not enqueue reminder when task has no due date', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockAssignee);
      mockPrisma.task.findFirst.mockResolvedValue({ ...mockTask, dueDate: null });

      mockQueueProducer.enqueueEmail.mockResolvedValue(undefined);
      mockQueueProducer.enqueueNotification.mockResolvedValue(undefined);

      const event = new TaskCreatedEvent('task-1', 'Follow-up', null, 'user-2', 'org-1', 'user-1');
      await listener.onTaskCreated(event);

      expect(mockQueueProducer.enqueueTaskReminder).not.toHaveBeenCalled();
    });

    it('should skip all queuing when task has no assignee', async () => {
      const event = new TaskCreatedEvent('task-1', 'Follow-up', null, null, 'org-1', 'user-1');
      await listener.onTaskCreated(event);

      expect(mockQueueProducer.enqueueEmail).not.toHaveBeenCalled();
    });
  });
});
