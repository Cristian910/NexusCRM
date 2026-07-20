"use client";

import React from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Permission } from "@/lib/permissions";

interface ProtectedActionProps {
  permission: Permission;
  /** "hide" removes the element entirely; "disable" renders it as disabled with a tooltip */
  behavior?: "hide" | "disable";
  /** Message shown when hovered in disabled state */
  deniedMessage?: string;
  children: React.ReactElement<{ disabled?: boolean; style?: React.CSSProperties; "aria-disabled"?: boolean }>;
}

/**
 * <ProtectedAction> — Wraps an interactive element with permission-aware behavior.
 *
 * - "hide" (default): renders nothing when denied — use for destructive/critical actions
 * - "disable": renders the element with disabled + tooltip explaining why
 *
 * Usage:
 *   <ProtectedAction permission="clients.write" behavior="disable">
 *     <Button>Edit</Button>
 *   </ProtectedAction>
 */
export function ProtectedAction({
  permission,
  behavior = "hide",
  deniedMessage = "You don't have permission for this action",
  children,
}: ProtectedActionProps) {
  const { can } = usePermissions();
  const allowed = can(permission);

  if (allowed) return children;
  if (behavior === "hide") return null;

  // "disable" — inject disabled + style, wrap in tooltip
  const disabledChild = React.cloneElement(children, {
    disabled: true,
    "aria-disabled": true,
    style: {
      ...(children.props?.style ?? {}),
      opacity: 0.45,
      pointerEvents: "none" as const,
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Outer span needed: disabled elements swallow mouse events */}
          <span className="inline-flex cursor-not-allowed">
            {disabledChild}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
          {deniedMessage}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
