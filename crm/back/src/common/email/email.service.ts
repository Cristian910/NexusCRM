import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailJobPayload } from '@/queues/dto/job-payloads.dto';
import {
  dealAssignedTemplate,
  taskAssignedTemplate,
  taskReminderTemplate,
} from './templates/email.templates';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.pass'),
      },
    });

    this.logger.log('Email transporter initialized');
  }

  async send(payload: SendEmailJobPayload): Promise<void> {
    const html = this.renderTemplate(payload.template, payload.context);
    const from = `"${this.configService.get<string>('email.fromName')}" <${this.configService.get<string>('email.fromAddress')}>`;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: `"${payload.toName}" <${payload.to}>`,
        subject: payload.subject,
        html,
      });

      this.logger.log(`Email sent to ${payload.to} | messageId=${info.messageId}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${payload.to}`, err);
      throw err; // re-throw so BullMQ can retry
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      this.logger.warn('SMTP connection verification failed — emails will be queued but may fail');
      return false;
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private renderTemplate(
    template: SendEmailJobPayload['template'],
    ctx: Record<string, unknown>,
  ): string {
    switch (template) {
      case 'deal-assigned':
        return dealAssignedTemplate(ctx as Parameters<typeof dealAssignedTemplate>[0]);
      case 'task-assigned':
        return taskAssignedTemplate(ctx as Parameters<typeof taskAssignedTemplate>[0]);
      case 'task-reminder':
        return taskReminderTemplate(ctx as Parameters<typeof taskReminderTemplate>[0]);
      default:
        throw new Error(`Unknown email template: ${String(template)}`);
    }
  }
}
