import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE } from './queue.constants';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { TaskReminderProcessor } from './processors/task-reminder.processor';
import { QueueProducerService } from './queue-producer.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { EmailModule } from '@/common/email/email.module';

const bullQueues = [QUEUE.EMAIL, QUEUE.NOTIFICATION, QUEUE.TASK_REMINDER].map((name) =>
  BullModule.registerQueueAsync({
    name,
    imports: [ConfigModule],
    useFactory: (config: ConfigService) => ({
      connection: {
        host: config.get<string>('queue.redis.host'),
        port: config.get<number>('queue.redis.port'),
        password: config.get<string>('queue.redis.password') || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 86_400 },
        removeOnFail: { count: 500 },
      },
    }),
    inject: [ConfigService],
  }),
);

@Module({
  imports: [...bullQueues, NotificationsModule, EmailModule],
  providers: [
    EmailProcessor,
    NotificationProcessor,
    TaskReminderProcessor, // No longer needs NotificationsService or EmailService
    QueueProducerService,
  ],
  exports: [QueueProducerService],
})
export class QueuesModule {}
