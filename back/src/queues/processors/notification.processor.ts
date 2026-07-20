import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE, JOB } from '../queue.constants';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateNotificationJobPayload } from '../dto/job-payloads.dto';

@Processor(QUEUE.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<CreateNotificationJobPayload>): Promise<void> {
    if (job.name !== JOB.CREATE_NOTIFICATION) {
      this.logger.warn(`Unknown job name "${job.name}" in ${QUEUE.NOTIFICATION} queue`);
      return;
    }

    this.logger.debug(`Processing notification job ${job.id} → userId="${job.data.userId}"`);

    await this.notificationsService.createInternal(job.data);

    this.logger.log(`Notification job ${job.id} completed → userId=${job.data.userId}`);
  }
}
