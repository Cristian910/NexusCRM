"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/auth/auth.service";
import { tokenStore } from "@/lib/api/token-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { queryKeys } from "@/lib/api/query-keys";

export function AuthInitializer() {
  const { setUser, clearAuth, setInitializing } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tokenStore.hasSession()) {
      setInitializing(false);
      return;
    }

    authService
      .me()
      .then((user) => {
        setUser(user);
        queryClient.setQueryData(queryKeys.auth.me, user);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setInitializing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
