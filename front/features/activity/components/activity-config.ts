import type { ActivityType, EntityType } from "@/types/activity";

export interface ActivityConfig {
  icon: string;      // emoji — no SVG import overhead for dense lists
  color: string;
  entityRoute: (entityId: string) => string;
}

// Labels are translated at the point of use via t(`activity.types.${type}`) —
// this config only carries the presentational bits that don't change with locale.
export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  CLIENT_CREATED:     { icon: "👤", color: "hsl(221 83% 53%)",  entityRoute: (id) => `/clients/${id}` },
  CLIENT_UPDATED:     { icon: "✏️",  color: "hsl(221 83% 53%)",  entityRoute: (id) => `/clients/${id}` },
  CLIENT_ARCHIVED:    { icon: "📁", color: "hsl(43 96% 56%)",   entityRoute: (id) => `/clients/${id}` },
  DEAL_CREATED:       { icon: "💼", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_UPDATED:       { icon: "🔄", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_STAGE_CHANGED: { icon: "🎯", color: "hsl(238 76% 65%)",  entityRoute: () => `/deals` },
  DEAL_ASSIGNED:      { icon: "👥", color: "hsl(262 73% 62%)",  entityRoute: () => `/deals` },
  DEAL_CLOSED_WON:    { icon: "🏆", color: "hsl(142 71% 45%)",  entityRoute: () => `/deals` },
  DEAL_CLOSED_LOST:   { icon: "❌", color: "hsl(0 72% 51%)",    entityRoute: () => `/deals` },
  TASK_CREATED:       { icon: "✅", color: "hsl(142 71% 45%)",  entityRoute: () => `/tasks` },
  TASK_COMPLETED:     { icon: "🎉", color: "hsl(142 71% 45%)",  entityRoute: () => `/tasks` },
  TASK_CANCELLED:     { icon: "🚫", color: "hsl(0 72% 51%)",    entityRoute: () => `/tasks` },
  USER_INVITED:       { icon: "📧", color: "hsl(262 73% 62%)",  entityRoute: () => `/settings` },
};
