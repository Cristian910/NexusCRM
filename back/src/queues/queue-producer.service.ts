import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE, JOB, DEFAULT_JOB_OPTIONS } from './queue.constants';
import {
  SendEmailJobPayload,
  CreateNotificationJobPayload,
  ScheduleReminderJobPayload,
} from './dto/job-payloads.dto';

/**
 * QueueProducerService is the single gateway for enqueuing jobs.
 *
 * Listeners call this service — they never touch the Queue instances directly.
 * This makes it trivial to mock in tests and swap queue backends in the future.
 */
@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(
    @InjectQueue(QUEUE.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE.TASK_REMINDER) private readonly taskReminderQueue: Queue,
  ) {}

  async enqueueEmail(payload: SendEmailJobPayload): Promise<void> {
    await this.emailQueue.add(JOB.SEND_EMAIL, payload, DEFAULT_JOB_OPTIONS);
    this.logger.debug(`Enqueued ${JOB.SEND_EMAIL} → ${payload.to}`);
  }

  async enqueueNotification(payload: CreateNotificationJobPayload): Promise<void> {
    await this.notificationQueue.add(JOB.CREATE_NOTIFICATION, payload, DEFAULT_JOB_OPTIONS);
    this.logger.debug(`Enqueued ${JOB.CREATE_NOTIFICATION} → userId=${payload.userId}`);
  }

  async enqueueTaskReminder(payload: ScheduleReminderJobPayload): Promise<void> {
    // Deduplicate: use taskId as jobId so re-queuing the same task
    // (e.g. if dueDate is updated) replaces the existing reminder
    await this.taskReminderQueue.add(JOB.SCHEDULE_REMINDER, payload, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `schedule:${payload.taskId}`,
    });
    this.logger.debug(`Enqueued ${JOB.SCHEDULE_REMINDER} → taskId=${payload.taskId}`);
  }
}
