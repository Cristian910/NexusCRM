"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/permissions";

interface ProtectedRouteProps {
  /** Single permission required to access this route */
  permission?: Permission;
  /** At least one of these permissions required */
  anyOf?: Permission[];
  /** All of these permissions required */
  allOf?: Permission[];
  /** Where to redirect on denial (default: shows inline blocked view) */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * <ProtectedRoute> — Page-level permission gate.
 *
 * Shows a loading state while auth initializes, then either:
 *   a) Renders children if the user has the required permissions
 *   b) Redirects to `redirectTo` if provided
 *   c) Shows an inline "access denied" screen
 *
 * Usage in layout:
 *   <ProtectedRoute permission="clients.read">
 *     {children}
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  permission, anyOf, allOf, redirectTo, children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { can, canAny, canAll, isAuthenticated } = usePermissions();

  let allowed = false;
  if (!isInitializing) {
    if (!isAuthenticated) {
      allowed = false;
    } else if (permission !== undefined) {
      allowed = can(permission);
    } else if (anyOf !== undefined) {
      allowed = canAny(anyOf);
    } else if (allOf !== undefined) {
      allowed = canAll(allOf);
    } else {
      allowed = true; // No check = allow authenticated users
    }
  }

  // Redirect variant — hooks must run unconditionally on every render,
  // so the early "still initializing" return happens after this, not before.
  useEffect(() => {
    if (!isInitializing && !allowed && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isInitializing, allowed, redirectTo, router]);

  if (isInitializing) {
    // Not ready yet — render nothing to avoid flash
    return <RouteLoadingState />;
  }

  if (!allowed) {
    if (redirectTo) return <RouteLoadingState />; // Will redirect shortly
    return <AccessDeniedView />;
  }

  return <>{children}</>;
}

// ── Loading state (during auth init) ─────────────────────────────
function RouteLoadingState() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 rounded-full animate-pulse"
          style={{ background: "hsl(var(--primary) / 0.2)" }}
        />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{
                background: "hsl(var(--primary))",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Access denied inline view ─────────────────────────────────────
function AccessDeniedView() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex h-full min-h-[400px] flex-col items-center justify-center gap-5 px-4"
    >
      {/* Icon */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "hsl(var(--destructive) / 0.1)" }}
      >
        <ShieldOff
          className="h-8 w-8"
          style={{ color: "hsl(var(--destructive))" }}
        />
      </div>

      {/* Text */}
      <div className="text-center">
        <h2
          className="text-lg font-semibold"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Access restricted
        </h2>
        <p
          className="mt-1.5 text-sm max-w-[320px]"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          You don&apos;t have the permissions required to view this page.
          Contact your workspace admin if you think this is a mistake.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          Go back
        </Button>
        <Button
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
