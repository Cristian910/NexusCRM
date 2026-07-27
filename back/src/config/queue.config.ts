import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    // Upstash (and most managed Redis providers) issue a single connection
    // string like rediss://default:PASSWORD@host:port — the "rediss:" scheme
    // is what tells ioredis/BullMQ to negotiate TLS. When REDIS_URL is set it
    // always wins; HOST/PORT/PASSWORD remain as the local-dev fallback.
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  taskReminderHoursBefore: parseInt(process.env.TASK_REMINDER_HOURS_BEFORE || '24', 10),
}));

export const emailConfig = registerAs('email', () => ({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromName: process.env.EMAIL_FROM_NAME || 'CRM System',
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@crm.local',
}));
