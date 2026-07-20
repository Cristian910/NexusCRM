"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { buildPermissionChecker } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

/**
 * usePermissions — primary hook for all permission checks in UI components.
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermissions();
 *   if (can("clients.write")) { ... }
 *
 * The checker is memoized and only recomputed when the user's role changes.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const checker = useMemo(
    () => buildPermissionChecker(user?.role ?? null),
    [user?.role]
  );

  return {
    /** User holds this permission */
    can: checker.hasPermission,

    /** User holds at least one of these permissions */
    canAny: checker.hasAnyPermission,

    /** User holds all of these permissions */
    canAll: checker.hasAllPermissions,

    /** All permissions the current user has (useful for debugging) */
    permissions: checker.getAll(),

    /** Convenience: current user */
    user,
    role: user?.role ?? null,
    isAuthenticated,
    isOwner: user?.role === "OWNER",
    isAdmin: user?.role === "OWNER" || user?.role === "ADMIN",
    isMember: user?.role === "MEMBER",
    isViewer: user?.role === "VIEWER",
  };
}

/** One-shot check — use when you only need a boolean, not the full API */
export function useHasPermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}
