import { Module } from '@nestjs/common';
import { ActivityListener } from './listeners/activity.listener';
import { AutomationListener } from './listeners/automation.listener';
import { NotificationEmailListener } from './listeners/notification-email.listener';
import { CacheInvalidationListener } from './listeners/cache-invalidation.listener';
import { ActivitiesModule } from '@/modules/activities/activities.module';
import { TasksModule } from '@/modules/tasks/tasks.module';
import { QueuesModule } from '@/queues/queues.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';

/**
 * EventsModule owns ALL domain event listeners.
 *
 * Listener          Depends on
 * ─────────────────────────────────────────────────────────────
 * ActivityListener          → ActivitiesModule
 * AutomationListener        → TasksModule
 * NotificationEmailListener → QueuesModule + PrismaModule (global)
 * CacheInvalidationListener → AnalyticsModule
 */
@Module({
  imports: [ActivitiesModule, TasksModule, QueuesModule, AnalyticsModule],
  providers: [
    ActivityListener,
    AutomationListener,
    NotificationEmailListener,
    CacheInvalidationListener,
  ],
})
export class EventsModule {}
