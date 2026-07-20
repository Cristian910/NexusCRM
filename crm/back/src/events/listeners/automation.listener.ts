import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TasksService } from '@/modules/tasks/tasks.service';
import { EVENT } from '../events/event.tokens';
import { DealCreatedEvent, DealStageChangedEvent } from '../events/domain.events';
import { DealStage } from '@prisma/client';

/**
 * AutomationListener converts domain events into automatic tasks.
 *
 * Rules:
 * - ALWAYS calls TasksService.createInternal() — never .create()
 * - createInternal does NOT emit TASK_CREATED, preventing infinite loops
 * - Errors are swallowed silently — automations must never fail a primary operation
 */
@Injectable()
export class AutomationListener {
  private readonly logger = new Logger(AutomationListener.name);

  constructor(private readonly tasksService: TasksService) {}

  /**
   * deal.created → "Follow-up" task due in 2 days
   */
  @OnEvent(EVENT.DEAL_CREATED)
  async onDealCreated(event: DealCreatedEvent): Promise<void> {
    const dueDate = this.daysFromNow(2);

    await this.safe(() =>
      this.tasksService.createInternal({
        title: `Follow-up: ${event.dealTitle}`,
        description: `Initial follow-up for deal "${event.dealTitle}". Make first contact with the client and qualify the opportunity.`,
        dueDate,
        dealId: event.dealId,
        assignedToId: event.assignedToId ?? event.actorId,
        organizationId: event.organizationId,
        createdById: event.actorId,
      }),
    );

    this.logger.log(`[Auto] Follow-up task created → deal "${event.dealTitle}"`);
  }

  /**
   * deal.stage_changed:
   *   → NEGOTIATION  : "Prepare proposal" task (3 days)
   *   → CLOSED_WON   : "Onboarding" task (1 day)
   *   → CLOSED_LOST  : "Post-mortem analysis" task (7 days)
   */
  @OnEvent(EVENT.DEAL_STAGE_CHANGED)
  async onDealStageChanged(event: DealStageChangedEvent): Promise<void> {
    switch (event.toStage) {
      case DealStage.NEGOTIATION:
        await this.safe(() =>
          this.tasksService.createInternal({
            title: `Prepare proposal: ${event.dealTitle}`,
            description: `Prepare and send a formal proposal for deal "${event.dealTitle}". Include pricing, timeline, and terms.`,
            dueDate: this.daysFromNow(3),
            dealId: event.dealId,
            assignedToId: event.assignedToId ?? event.actorId,
            organizationId: event.organizationId,
            createdById: event.actorId,
          }),
        );
        this.logger.log(
          `[Auto] Proposal task created → deal "${event.dealTitle}" entered NEGOTIATION`,
        );
        break;

      case DealStage.CLOSED_WON:
        await this.safe(() =>
          this.tasksService.createInternal({
            title: `Onboarding: ${event.dealTitle}`,
            description: `Initiate the onboarding process for the won deal "${event.dealTitle}". Schedule kick-off call and send welcome materials.`,
            dueDate: this.daysFromNow(1),
            dealId: event.dealId,
            assignedToId: event.assignedToId ?? event.actorId,
            organizationId: event.organizationId,
            createdById: event.actorId,
          }),
        );
        this.logger.log(`[Auto] Onboarding task created → deal "${event.dealTitle}" WON`);
        break;

      case DealStage.CLOSED_LOST:
        await this.safe(() =>
          this.tasksService.createInternal({
            title: `Post-mortem: ${event.dealTitle}`,
            description: `Analyze why deal "${event.dealTitle}" was lost. Document key objections and lessons learned for the team.`,
            dueDate: this.daysFromNow(7),
            dealId: event.dealId,
            assignedToId: event.assignedToId ?? event.actorId,
            organizationId: event.organizationId,
            createdById: event.actorId,
          }),
        );
        this.logger.log(`[Auto] Post-mortem task created → deal "${event.dealTitle}" LOST`);
        break;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private daysFromNow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  private async safe(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(
        `[Auto] Failed to create automated task: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
