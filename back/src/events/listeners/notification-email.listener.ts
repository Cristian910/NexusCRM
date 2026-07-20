import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { QueueProducerService } from '@/queues/queue-producer.service';
import { EVENT } from '../events/event.tokens';
import { DealAssignedEvent, TaskCreatedEvent } from '../events/domain.events';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationEmailListener {
  private readonly logger = new Logger(NotificationEmailListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueProducer: QueueProducerService,
  ) {}

  /**
   * deal.assigned → email + in-app notification to the newly assigned user.
   * actorName is embedded in the event — no second DB query needed.
   */
  @OnEvent(EVENT.DEAL_ASSIGNED)
  async onDealAssigned(event: DealAssignedEvent): Promise<void> {
    await this.safe(async () => {
      const assignee = await this.prisma.user.findFirst({
        where: { id: event.assignedToId, organizationId: event.organizationId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!assignee) {
        this.logger.warn(
          `DealAssignedEvent: assignee ${event.assignedToId} not found in org ${event.organizationId}`,
        );
        return;
      }

      await Promise.all([
        this.queueProducer.enqueueEmail({
          to: assignee.email,
          toName: `${assignee.firstName} ${assignee.lastName}`,
          subject: `Deal assigned to you: "${event.dealTitle}"`,
          template: 'deal-assigned',
          context: {
            recipientName: assignee.firstName,
            dealTitle: event.dealTitle,
            dealValue: 'See CRM for details',
            assignedBy: event.actorName,
          },
        }),
        this.queueProducer.enqueueNotification({
          userId: assignee.id,
          organizationId: event.organizationId,
          title: 'New deal assigned',
          message: `"${event.dealTitle}" has been assigned to you by ${event.actorName}`,
          type: NotificationType.INFO,
          metadata: { dealId: event.dealId },
        }),
      ]);
    });
  }

  /**
   * task.created → email + in-app notification to assignee.
   * If task has a dueDate → also schedule a reminder job.
   */
  @OnEvent(EVENT.TASK_CREATED)
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    await this.safe(async () => {
      if (!event.assignedToId) return;

      const [assignee, task] = await Promise.all([
        this.prisma.user.findFirst({
          where: { id: event.assignedToId, organizationId: event.organizationId },
          select: { id: true, email: true, firstName: true, lastName: true },
        }),
        this.prisma.task.findFirst({
          where: { id: event.taskId },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            dealId: true,
            deal: { select: { title: true } },
          },
        }),
      ]);

      if (!assignee) {
        this.logger.warn(
          `TaskCreatedEvent: assignee ${event.assignedToId} not found in org ${event.organizationId}`,
        );
        return;
      }

      if (!task) {
        this.logger.warn(`TaskCreatedEvent: task ${event.taskId} not found`);
        return;
      }

      const formattedDate = task.dueDate
        ? new Date(task.dueDate).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'No due date';

      const assigneeName = `${assignee.firstName} ${assignee.lastName}`;

      const jobs: Promise<void>[] = [
        this.queueProducer.enqueueEmail({
          to: assignee.email,
          toName: assigneeName,
          subject: `New task assigned: "${task.title}"`,
          template: 'task-assigned',
          context: {
            recipientName: assignee.firstName,
            taskTitle: task.title,
            dueDate: formattedDate,
            dealTitle: task.deal?.title,
            description: task.description,
          },
        }),
        this.queueProducer.enqueueNotification({
          userId: assignee.id,
          organizationId: event.organizationId,
          title: 'New task assigned',
          message: `"${task.title}" has been assigned to you`,
          type: NotificationType.INFO,
          metadata: { taskId: task.id, dealId: task.dealId },
        }),
      ];

      if (task.dueDate) {
        jobs.push(
          this.queueProducer.enqueueTaskReminder({
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.dueDate.toISOString(),
            assignedToId: assignee.id,
            assignedToEmail: assignee.email,
            assignedToName: assigneeName,
            organizationId: event.organizationId,
            dealTitle: task.deal?.title,
          }),
        );
      }

      await Promise.all(jobs);
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async safe(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(
        `NotificationEmailListener error: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
