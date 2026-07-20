import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityService } from '@/modules/activities/activity.service';
import { EVENT } from '../events/event.tokens';
import { ActivityType, EntityType } from '@prisma/client';
import {
  ClientCreatedEvent,
  ClientUpdatedEvent,
  ClientArchivedEvent,
  DealCreatedEvent,
  DealUpdatedEvent,
  DealStageChangedEvent,
  DealAssignedEvent,
  TaskCreatedEvent,
  TaskCompletedEvent,
  TaskCancelledEvent,
} from '../events/domain.events';

@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(private readonly activityService: ActivityService) {}

  // ─── Client events ─────────────────────────────────────────────────────────

  @OnEvent(EVENT.CLIENT_CREATED)
  async onClientCreated(event: ClientCreatedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.CLIENT_CREATED,
        description: `Client "${event.clientName}" was created`,
        entityId: event.clientId,
        entityType: EntityType.CLIENT,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  @OnEvent(EVENT.CLIENT_UPDATED)
  async onClientUpdated(event: ClientUpdatedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.CLIENT_UPDATED,
        description: `Client "${event.clientName}" was updated`,
        entityId: event.clientId,
        entityType: EntityType.CLIENT,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  @OnEvent(EVENT.CLIENT_ARCHIVED)
  async onClientArchived(event: ClientArchivedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.CLIENT_ARCHIVED,
        description: `Client "${event.clientName}" was archived`,
        entityId: event.clientId,
        entityType: EntityType.CLIENT,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  // ─── Deal events ───────────────────────────────────────────────────────────

  @OnEvent(EVENT.DEAL_CREATED)
  async onDealCreated(event: DealCreatedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.DEAL_CREATED,
        description: `Deal "${event.dealTitle}" was created`,
        entityId: event.dealId,
        entityType: EntityType.DEAL,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  @OnEvent(EVENT.DEAL_UPDATED)
  async onDealUpdated(event: DealUpdatedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.DEAL_UPDATED,
        description: `Deal "${event.dealTitle}" was updated`,
        entityId: event.dealId,
        entityType: EntityType.DEAL,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  @OnEvent(EVENT.DEAL_STAGE_CHANGED)
  async onDealStageChanged(event: DealStageChangedEvent) {
    const isWon = event.toStage === 'CLOSED_WON';
    const isLost = event.toStage === 'CLOSED_LOST';

    const type = isWon
      ? ActivityType.DEAL_CLOSED_WON
      : isLost
        ? ActivityType.DEAL_CLOSED_LOST
        : ActivityType.DEAL_STAGE_CHANGED;

    const description = isWon
      ? `Deal "${event.dealTitle}" was WON 🎉`
      : isLost
        ? `Deal "${event.dealTitle}" was lost`
        : `Deal "${event.dealTitle}" moved from ${event.fromStage} to ${event.toStage}`;

    await this.safe(() =>
      this.activityService.log({
        type,
        description,
        entityId: event.dealId,
        entityType: EntityType.DEAL,
        userId: event.actorId,
        organizationId: event.organizationId,
        metadata: { fromStage: event.fromStage, toStage: event.toStage },
      }),
    );
  }

  @OnEvent(EVENT.DEAL_ASSIGNED)
  async onDealAssigned(event: DealAssignedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.DEAL_ASSIGNED,
        description: `Deal "${event.dealTitle}" was assigned to a team member`,
        entityId: event.dealId,
        entityType: EntityType.DEAL,
        userId: event.actorId,
        organizationId: event.organizationId,
        metadata: { assignedToId: event.assignedToId },
      }),
    );
  }

  // ─── Task events ───────────────────────────────────────────────────────────

  @OnEvent(EVENT.TASK_CREATED)
  async onTaskCreated(event: TaskCreatedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.TASK_CREATED,
        description: `Task "${event.taskTitle}" was created`,
        entityId: event.taskId,
        entityType: EntityType.TASK,
        userId: event.actorId,
        organizationId: event.organizationId,
        metadata: { dealId: event.dealId, assignedToId: event.assignedToId },
      }),
    );
  }

  @OnEvent(EVENT.TASK_COMPLETED)
  async onTaskCompleted(event: TaskCompletedEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.TASK_COMPLETED,
        description: `Task "${event.taskTitle}" was completed`,
        entityId: event.taskId,
        entityType: EntityType.TASK,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  @OnEvent(EVENT.TASK_CANCELLED)
  async onTaskCancelled(event: TaskCancelledEvent) {
    await this.safe(() =>
      this.activityService.log({
        type: ActivityType.TASK_CANCELLED,
        description: `Task "${event.taskTitle}" was cancelled`,
        entityId: event.taskId,
        entityType: EntityType.TASK,
        userId: event.actorId,
        organizationId: event.organizationId,
      }),
    );
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Wraps activity writes in a try/catch so a logging failure
   * never bubbles up and crashes the primary operation.
   */
  private async safe(fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error('ActivityListener failed to write activity log', err);
    }
  }
}
