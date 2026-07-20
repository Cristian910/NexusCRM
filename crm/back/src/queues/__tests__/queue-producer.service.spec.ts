import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueProducerService } from '../queue-producer.service';
import { QUEUE, JOB, DEFAULT_JOB_OPTIONS } from '../queue.constants';
import { NotificationType } from '@prisma/client';

const mockEmailQueue = { add: jest.fn() };
const mockNotificationQueue = { add: jest.fn() };
const mockTaskReminderQueue = { add: jest.fn() };

describe('QueueProducerService', () => {
  let service: QueueProducerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueProducerService,
        { provide: getQueueToken(QUEUE.EMAIL), useValue: mockEmailQueue },
        { provide: getQueueToken(QUEUE.NOTIFICATION), useValue: mockNotificationQueue },
        { provide: getQueueToken(QUEUE.TASK_REMINDER), useValue: mockTaskReminderQueue },
      ],
    }).compile();

    service = module.get<QueueProducerService>(QueueProducerService);
  });

  describe('enqueueEmail', () => {
    it('should add a send-email job to the email queue', async () => {
      const payload = {
        to: 'user@test.com',
        toName: 'John Doe',
        subject: 'Test',
        template: 'deal-assigned' as const,
        context: {
          recipientName: 'John',
          dealTitle: 'Big Deal',
          dealValue: '$5000',
          assignedBy: 'Alice',
        },
      };

      await service.enqueueEmail(payload);

      expect(mockEmailQueue.add).toHaveBeenCalledWith(JOB.SEND_EMAIL, payload, DEFAULT_JOB_OPTIONS);
    });
  });

  describe('enqueueNotification', () => {
    it('should add a create-notification job to the notification queue', async () => {
      const payload = {
        userId: 'user-1',
        organizationId: 'org-1',
        title: 'Test',
        message: 'You have a new notification',
        type: NotificationType.INFO,
      };

      await service.enqueueNotification(payload);

      expect(mockNotificationQueue.add).toHaveBeenCalledWith(
        JOB.CREATE_NOTIFICATION,
        payload,
        DEFAULT_JOB_OPTIONS,
      );
    });
  });

  describe('enqueueTaskReminder', () => {
    it('should add a schedule-reminder job with deduplication jobId', async () => {
      const payload = {
        taskId: 'task-1',
        taskTitle: 'Follow-up',
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
        assignedToId: 'user-1',
        assignedToEmail: 'user@test.com',
        assignedToName: 'John Doe',
        organizationId: 'org-1',
      };

      await service.enqueueTaskReminder(payload);

      expect(mockTaskReminderQueue.add).toHaveBeenCalledWith(
        JOB.SCHEDULE_REMINDER,
        payload,
        expect.objectContaining({ jobId: 'schedule:task-1' }),
      );
    });
  });
});
