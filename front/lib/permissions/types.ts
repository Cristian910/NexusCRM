import type { Role } from "@/types";

// ── Permission strings ────────────────────────────────────────────
// Granular, resource.action format.
// Add here as new modules are built — the system auto-distributes them
// to roles via ROLE_PERMISSIONS below.
export const PERMISSIONS = [
  // Clients
  "clients.read",
  "clients.write",
  "clients.delete",
  "clients.archive",
  // Deals
  "deals.read",
  "deals.write",
  "deals.move",
  "deals.delete",
  // Tasks
  "tasks.read",
  "tasks.write",
  "tasks.delete",
  "tasks.assign",
  // Analytics
  "analytics.read",
  "analytics.team",        // team-level stats (users perf)
  // Notifications
  "notifications.read",
  // Users / org management
  "users.read",
  "users.manage",
  "organization.manage",
  // Settings
  "settings.read",
  "settings.write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ── Role → permissions mapping ────────────────────────────────────
// Single source of truth for access control.
// When backend adds explicit permission fields, merge them here.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Full access to everything
    ...PERMISSIONS,
  ],

  ADMIN: [
    "clients.read",    "clients.write",   "clients.delete",  "clients.archive",
    "deals.read",      "deals.write",     "deals.move",      "deals.delete",
    "tasks.read",      "tasks.write",     "tasks.delete",    "tasks.assign",
    "analytics.read",  "analytics.team",
    "notifications.read",
    "users.read",      "users.manage",
    "settings.read",   "settings.write",
  ],

  MEMBER: [
    "clients.read",
    "clients.write",
    "clients.archive",
    "deals.read",
    "deals.write",
    "deals.move",
    "tasks.read",
    "tasks.write",
    "tasks.assign",
    "analytics.read",
    "notifications.read",
    "settings.read",
  ],

  // Read-only across the board — mirrors the backend's VIEWER role,
  // which sits below MEMBER in the OWNER > ADMIN > MEMBER > VIEWER hierarchy.
  VIEWER: [
    "clients.read",
    "deals.read",
    "tasks.read",
    "analytics.read",
    "notifications.read",
    "settings.read",
  ],
};

// ── Helper: derive permission set from role ───────────────────────
export function getPermissionsForRole(role: Role): Set<Permission> {
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}
