/**
 * Single source of truth for queue names.
 * Changing a name here propagates to all producers and consumers.
 */
export const QUEUE = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  TASK_REMINDER: 'task-reminder',
} as const;

export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

/**
 * Job name constants per queue.
 * Keeps the string "send-email" from being scattered across the codebase.
 */
export const JOB = {
  // email queue
  SEND_EMAIL: 'send-email',

  // notification queue
  CREATE_NOTIFICATION: 'create-notification',

  // task-reminder queue
  SCHEDULE_REMINDER: 'schedule-reminder',
  SEND_REMINDER: 'send-reminder',
} as const;

/**
 * Default BullMQ job options — tuned for a production SaaS:
 * - 3 retries with exponential back-off
 * - Remove completed jobs after 24 h to avoid Redis bloat
 * - Keep the last 500 failed jobs for post-mortem debugging
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 86_400 }, // 24 hours
  removeOnFail: { count: 500 },
} as const;
