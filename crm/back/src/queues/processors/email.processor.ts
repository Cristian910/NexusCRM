import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE, JOB } from '../queue.constants';
import { EmailService } from '@/common/email/email.service';
import { SendEmailJobPayload } from '../dto/job-payloads.dto';

@Processor(QUEUE.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailJobPayload>): Promise<void> {
    if (job.name !== JOB.SEND_EMAIL) {
      this.logger.warn(`Unknown job name "${job.name}" in ${QUEUE.EMAIL} queue`);
      return;
    }

    this.logger.debug(
      `Processing email job ${job.id} → template="${job.data.template}" to="${job.data.to}"`,
    );

    await this.emailService.send(job.data);

    this.logger.log(`Email job ${job.id} completed → ${job.data.to}`);
  }
}
