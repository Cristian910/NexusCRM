import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE, JOB, DEFAULT_JOB_OPTIONS } from '../queue.constants';
import {
  ScheduleReminderJobPayload,
  SendReminderJobPayload,
  SendEmailJobPayload,
  CreateNotificationJobPayload,
} from '../dto/job-payloads.dto';
import { NotificationType } from '@prisma/client';

@Processor(QUEUE.TASK_REMINDER)
export class TaskReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskReminderProcessor.name);

  constructor(
    @InjectQueue(QUEUE.TASK_REMINDER) private readonly taskReminderQueue: Queue,
    @InjectQueue(QUEUE.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ScheduleReminderJobPayload | SendReminderJobPayload>): Promise<void> {
    switch (job.name) {
      case JOB.SCHEDULE_REMINDER:
        return this.handleSchedule(job as Job<ScheduleReminderJobPayload>);
      case JOB.SEND_REMINDER:
        return this.handleSendReminder(job as Job<SendReminderJobPayload>);
      default:
        this.logger.warn(`Unknown job name "${job.name}" in ${QUEUE.TASK_REMINDER} queue`);
    }
  }

  /**
   * Calculates the delay and enqueues a delayed send-reminder job.
   * Two-step design: schedule → delayed send.
   * This keeps the delay calculation outside the producer (which doesn't know when
   * the reminder should fire) and allows cancellation before the fire time.
   */
  private async handleSchedule(job: Job<ScheduleReminderJobPayload>): Promise<void> {
    const { dueDate, taskId, ...rest } = job.data;
    const hoursBeforeReminder =
      this.configService.get<number>('queue.taskReminderHoursBefore') ?? 24;

    const due = new Date(dueDate);
    const fireAt = new Date(due.getTime() - hoursBeforeReminder * 60 * 60 * 1000);
    const now = Date.now();
    const delay = fireAt.getTime() - now;

    if (delay <= 0) {
      this.logger.warn(
        `Task ${taskId}: reminder window already passed (dueDate=${dueDate}) — skipping`,
      );
      return;
    }

    await this.taskReminderQueue.add(
      JOB.SEND_REMINDER,
      { taskId, dueDate, ...rest } as SendReminderJobPayload,
      {
        ...DEFAULT_JOB_OPTIONS,
        delay,
        // Idempotency: duplicate schedule jobs for same task replace the existing delayed job
        jobId: `reminder:${taskId}`,
      },
    );

    const minutesUntilFire = Math.round(delay / 60_000);
    this.logger.log(
      `Reminder scheduled for task ${taskId} — fires in ${minutesUntilFire} min (jobId=reminder:${taskId})`,
    );
  }

  /**
   * Fires at the delayed time — enqueues email and notification jobs in parallel.
   * Does NOT call EmailService or NotificationsService directly:
   * processors only dispatch to queues, never execute side-effects themselves.
   */
  private async handleSendReminder(job: Job<SendReminderJobPayload>): Promise<void> {
    const {
      taskId,
      taskTitle,
      dueDate,
      assignedToId,
      assignedToEmail,
      assignedToName,
      organizationId,
      dealTitle,
    } = job.data;

    const hoursBeforeReminder =
      this.configService.get<number>('queue.taskReminderHoursBefore') ?? 24;

    const formattedDate = new Date(dueDate).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const emailPayload: SendEmailJobPayload = {
      to: assignedToEmail,
      toName: assignedToName,
      subject: `Reminder: "${taskTitle}" is due soon`,
      template: 'task-reminder',
      context: {
        recipientName: assignedToName,
        taskTitle,
        dueDate: formattedDate,
        dealTitle,
        hoursUntilDue: hoursBeforeReminder,
      },
    };

    const notificationPayload: CreateNotificationJobPayload = {
      userId: assignedToId,
      organizationId,
      title: `Task due in ${hoursBeforeReminder}h`,
      message: `"${taskTitle}" is due on ${formattedDate}`,
      type: NotificationType.WARNING,
      metadata: { taskId, dueDate },
    };

    await Promise.all([
      this.emailQueue.add(JOB.SEND_EMAIL, emailPayload, DEFAULT_JOB_OPTIONS),
      this.notificationQueue.add(JOB.CREATE_NOTIFICATION, notificationPayload, DEFAULT_JOB_OPTIONS),
    ]);

    this.logger.log(
      `Reminder dispatched for task ${taskId} → ${assignedToEmail} (org=${organizationId})`,
    );
  }
}
