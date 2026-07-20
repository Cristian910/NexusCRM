// Mirrors Prisma ActivityType and EntityType enums exactly
export type ActivityType =
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "CLIENT_ARCHIVED"
  | "DEAL_CREATED"
  | "DEAL_UPDATED"
  | "DEAL_STAGE_CHANGED"
  | "DEAL_ASSIGNED"
  | "DEAL_CLOSED_WON"
  | "DEAL_CLOSED_LOST"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "TASK_CANCELLED"
  | "USER_INVITED";

export type EntityType = "CLIENT" | "DEAL" | "TASK" | "USER";

export interface ActivityUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  entityId: string;
  entityType: EntityType;
  metadata?: Record<string, unknown> | null;
  userId: string;
  organizationId: string;
  createdAt: string;
  user?: ActivityUser;
}

export interface ActivityFilters {
  type?: ActivityType;
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
