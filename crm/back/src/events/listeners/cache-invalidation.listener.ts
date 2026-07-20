import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { EVENT } from '../events/event.tokens';
import {
  ClientCreatedEvent,
  ClientUpdatedEvent,
  DealCreatedEvent,
  DealUpdatedEvent,
  DealStageChangedEvent,
} from '../events/domain.events';

/**
 * CacheInvalidationListener watches domain events and invalidates the
 * analytics Redis cache for the affected organization.
 *
 * Strategy: invalidate the entire org namespace on any mutation.
 * This is safe and simple. A finer-grained strategy (invalidate only
 * the specific key that changed) would add complexity without meaningful
 * benefit at this scale — the TTL covers the window between mutations.
 */
@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @OnEvent(EVENT.DEAL_CREATED)
  async onDealCreated(event: DealCreatedEvent) {
    await this.invalidate(event.organizationId, 'deal.created');
  }

  @OnEvent(EVENT.DEAL_UPDATED)
  async onDealUpdated(event: DealUpdatedEvent) {
    await this.invalidate(event.organizationId, 'deal.updated');
  }

  @OnEvent(EVENT.DEAL_STAGE_CHANGED)
  async onDealStageChanged(event: DealStageChangedEvent) {
    await this.invalidate(event.organizationId, 'deal.stage_changed');
  }

  @OnEvent(EVENT.CLIENT_CREATED)
  async onClientCreated(event: ClientCreatedEvent) {
    await this.invalidate(event.organizationId, 'client.created');
  }

  @OnEvent(EVENT.CLIENT_UPDATED)
  async onClientUpdated(event: ClientUpdatedEvent) {
    await this.invalidate(event.organizationId, 'client.updated');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async invalidate(organizationId: string, trigger: string): Promise<void> {
    try {
      await this.analyticsService.invalidateOrgCache(organizationId);
      this.logger.debug(`Cache invalidated for org=${organizationId} trigger=${trigger}`);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for org=${organizationId}: ${(err as Error).message}`,
      );
    }
  }
}
