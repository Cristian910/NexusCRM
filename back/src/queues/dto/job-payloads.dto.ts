import { NotificationType } from '@prisma/client';

// ─── Email jobs ───────────────────────────────────────────────────────────────

export interface SendEmailJobPayload {
  to: string;
  toName: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, unknown>;
}

export type EmailTemplate = 'deal-assigned' | 'task-assigned' | 'task-reminder' | 'password-reset';

// ─── Notification jobs ────────────────────────────────────────────────────────

export interface CreateNotificationJobPayload {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

// ─── Task reminder jobs ───────────────────────────────────────────────────────

export interface ScheduleReminderJobPayload {
  taskId: string;
  taskTitle: string;
  dueDate: string; // ISO string
  assignedToId: string;
  assignedToEmail: string;
  assignedToName: string;
  organizationId: string;
  dealTitle?: string;
}

export interface SendReminderJobPayload {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  assignedToId: string;
  assignedToEmail: string;
  assignedToName: string;
  organizationId: string;
  dealTitle?: string;
}
