"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../auth.service";
import { tokenStore } from "@/lib/api/token-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiError, LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload,
} from "@/types";

// ── useCurrentUser ────────────────────────────────────────────────
export function useCurrentUser() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authService.me();
      setUser(user);
      return user;
    },
    enabled: tokenStore.hasSession(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ── useLogin ─────────────────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation<void, ApiError, LoginPayload>({
    mutationFn: async (payload) => {
      const { user, tokens } = await authService.login(payload);
      tokenStore.setTokens(tokens);
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}

// ── useRegister ───────────────────────────────────────────────────
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation<void, ApiError, RegisterPayload>({
    mutationFn: async (payload) => {
      const { user, tokens } = await authService.register(payload);
      tokenStore.setTokens(tokens);
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}

// ── useLogout ─────────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      try { await authService.logout(); } catch { /* best-effort */ }
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

// ── useForgotPassword ────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation<{ message: string }, ApiError, ForgotPasswordPayload>({
    mutationFn: (payload) => authService.forgotPassword(payload),
  });
}

// ── useResetPassword ─────────────────────────────────────────────
export function useResetPassword() {
  const router = useRouter();

  return useMutation<{ message: string }, ApiError, ResetPasswordPayload>({
    mutationFn: (payload) => authService.resetPassword(payload),
    onSuccess: () => {
      // Send them to sign in with a flag the login page can use to show a
      // one-time confirmation — simpler and safer than auto-logging them in
      // with a token that's about to be invalidated anyway.
      router.push("/login?reset=success");
    },
  });
}
