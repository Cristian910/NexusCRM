// ── Roles ───────────────────────────────────────────────────────
export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

// ── SafeUser ─────────────────────────────────────────────────────
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Auth ─────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
  organizationSlug: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: Role;
  iat: number;
  exp: number;
}

// ── Pagination ──────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Deal stage enum ─────────────────────────────────────────────
export type DealStage =
  | "LEAD"
  | "CONTACTED"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

// ── Clients ─────────────────────────────────────────────────────
export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: ClientStatus;
  tags: string[];
  website?: string;
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { deals: number; tasks: number };
}

// ── Deals ───────────────────────────────────────────────────────
export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  probability?: number;
  expectedCloseDate?: string;
  website?: string;
  notes?: string;
  clientId: string;
  client?: Pick<Client, "id" | "name" | "email" | "company">;
  assignedToId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Tasks ───────────────────────────────────────────────────────
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  dealId?: string;
  deal?: Pick<Deal, "id" | "title" | "stage">;
  assignedToId?: string;
  assignedTo?: Pick<SafeUser, "id" | "firstName" | "lastName">;
  createdById: string;
  createdBy?: Pick<SafeUser, "id" | "firstName" | "lastName">;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ───────────────────────────────────────────────
export type NotificationType =
  | "DEAL_STAGE_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "CLIENT_CREATED"
  | "DEAL_WON"
  | "DEAL_LOST";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  userId: string;
  organizationId: string;
  createdAt: string;
}

// ── Organization ────────────────────────────────────────────────
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

// ── API error ───────────────────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
