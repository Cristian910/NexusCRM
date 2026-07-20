"use client";

import React from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { Permission } from "@/lib/permissions";

interface CanProps {
  /** Require this single permission */
  permission?: Permission;
  /** Require at least one of these permissions */
  anyOf?: Permission[];
  /** Require all of these permissions */
  allOf?: Permission[];
  /** What to render when the check fails (default: nothing) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * <Can> — Declarative permission gate.
 *
 * Renders children when the permission check passes.
 * Renders `fallback` (or nothing) when it fails.
 *
 * Exactly one of `permission`, `anyOf`, or `allOf` should be supplied.
 *
 * Usage:
 *   <Can permission="clients.write">
 *     <Button>Create client</Button>
 *   </Can>
 *
 *   <Can anyOf={["clients.write", "clients.archive"]} fallback={<span>Read-only</span>}>
 *     <EditActions />
 *   </Can>
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = false;

  if (permission !== undefined) {
    allowed = can(permission);
  } else if (anyOf !== undefined) {
    allowed = canAny(anyOf);
  } else if (allOf !== undefined) {
    allowed = canAll(allOf);
  } else {
    // No check specified — allow (defensive: don't gate unknown cases)
    allowed = true;
  }

  return <>{allowed ? children : fallback}</>;
}
