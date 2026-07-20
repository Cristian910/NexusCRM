import type { Permission } from "./types";
import { getPermissionsForRole } from "./types";
import type { Role } from "@/types";

/**
 * Build a permission checker object for a given role.
 * Memoization happens at the call site via useMemo.
 */
export function buildPermissionChecker(role: Role | null | undefined) {
  const set = role ? getPermissionsForRole(role) : new Set<Permission>();

  return {
    /** True if the user holds the given permission */
    hasPermission: (p: Permission): boolean => set.has(p),

    /** True if the user holds at least one of the given permissions */
    hasAnyPermission: (ps: Permission[]): boolean => ps.some((p) => set.has(p)),

    /** True if the user holds ALL of the given permissions */
    hasAllPermissions: (ps: Permission[]): boolean => ps.every((p) => set.has(p)),

    /** For debugging / logging */
    getAll: (): Permission[] => Array.from(set) as Permission[],
  };
}

export type PermissionChecker = ReturnType<typeof buildPermissionChecker>;
