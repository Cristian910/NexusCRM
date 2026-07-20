import type { ActivityType, EntityType } from "@/types/activity";

export interface ActivityConfig {
  label: string;
  icon: string;      // emoji — no SVG import overhead for dense lists
  color: string;
  entityRoute: (entityId: string) => string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  CLIENT_CREATED:     { label: "Client created",      icon: "👤", color: "hsl(221 83% 53%)",  entityRoute: (id) => `/clients/${id}` },
  CLIENT_UPDATED:     { label: "Client updated",      icon: "✏️",  color: "hsl(221 83% 53%)",  entityRoute: (id) => `/clients/${id}` },
  CLIENT_ARCHIVED:    { label: "Client archived",     icon: "📁", color: "hsl(43 96% 56%)",   entityRoute: (id) => `/clients/${id}` },
  DEAL_CREATED:       { label: "Deal created",        icon: "💼", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_UPDATED:       { label: "Deal updated",        icon: "🔄", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_STAGE_CHANGED: { label: "Stage changed",       icon: "🎯", color: "hsl(238 76% 65%)",  entityRoute: () => `/deals` },
  DEAL_ASSIGNED:      { label: "Deal assigned",       icon: "👥", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_CLOSED_WON:    { label: "Deal won",            icon: "🏆", color: "hsl(142 71% 45%)",  entityRoute: () => `/deals` },
  DEAL_CLOSED_LOST:   { label: "Deal lost",           icon: "❌", color: "hsl(0 72% 51%)",    entityRoute: () => `/deals` },
  TASK_CREATED:       { label: "Task created",        icon: "✅", color: "hsl(142 71% 45%)",  entityRoute: () => `/tasks` },
  TASK_COMPLETED:     { label: "Task completed",      icon: "🎉", color: "hsl(142 71% 45%)",  entityRoute: () => `/tasks` },
  TASK_CANCELLED:     { label: "Task cancelled",      icon: "🚫", color: "hsl(0 72% 51%)",    entityRoute: () => `/tasks` },
  USER_INVITED:       { label: "User invited",        icon: "📧", color: "hsl(262 73% 62%)",  entityRoute: () => `/settings` },
};

export const ENTITY_TYPE_CONFIG: Record<EntityType, { label: string }> = {
  CLIENT: { label: "Client" },
  DEAL:   { label: "Deal" },
  TASK:   { label: "Task" },
  USER:   { label: "User" },
};
