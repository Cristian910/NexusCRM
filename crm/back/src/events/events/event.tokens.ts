/**
 * Strongly-typed event name tokens.
 * Using constants instead of raw strings prevents typos and
 * makes event wiring refactor-safe across the codebase.
 */
export const EVENT = {
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_ARCHIVED: 'client.archived',

  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  DEAL_ASSIGNED: 'deal.assigned',

  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_CANCELLED: 'task.cancelled',
} as const;

export type EventToken = (typeof EVENT)[keyof typeof EVENT];
