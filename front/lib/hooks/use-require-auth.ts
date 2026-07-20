"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Programmatic auth guard hook.
 * Use inside page components that need to enforce authentication
 * beyond what middleware.ts already handles (e.g. role-based checks).
 */
export function useRequireAuth(requiredRole?: "OWNER" | "ADMIN" | "MEMBER") {
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user && user.role !== requiredRole && user.role !== "OWNER") {
      router.replace("/dashboard"); // Insufficient role
    }
  }, [isAuthenticated, isInitializing, requiredRole, router, user]);

  return { user, isAuthenticated, isInitializing };
}
