"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "../users.service";
import type {
  UpdateProfilePayload, ChangePasswordPayload,
  InviteUserPayload, UpdateUserRolePayload,
} from "../types";
import type { ApiError, SafeUser } from "@/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { queryKeys } from "@/lib/api/query-keys";
import { toast } from "@/lib/stores/toast-store";
import { t } from "@/lib/i18n/context";

export const teamKeys = {
  all:  () => ["team"] as const,
  list: () => ["team", "list"] as const,
};

// ── useTeamMembers ───────────────────────────────────────────────
// Requires ADMIN/OWNER on the backend — gate calls with <Can permission="users.read">
export function useTeamMembers(enabled = true) {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: usersService.listTeam,
    staleTime: 30_000,
    enabled,
  });
}

// ── useUpdateProfile ──────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<SafeUser, ApiError, UpdateProfilePayload>({
    mutationFn: usersService.updateProfile,
    onSuccess: (updated) => {
      setUser(updated);
      qc.setQueryData(queryKeys.auth.me, updated);
      toast.success(t("toasts.profileUpdated"));
    },
    onError: (err) => toast.error(t("toasts.profileUpdateFailed"), err.message),
  });
}

// ── useChangePassword ─────────────────────────────────────────────
export function useChangePassword() {
  return useMutation<void, ApiError, ChangePasswordPayload>({
    mutationFn: usersService.changePassword,
    onSuccess: () => toast.success(t("toasts.passwordChanged")),
    onError: (err) => toast.error(t("toasts.passwordChangeFailed"), err.message),
  });
}

// ── useInviteUser ─────────────────────────────────────────────────
export function useInviteUser() {
  const qc = useQueryClient();

  return useMutation<SafeUser, ApiError, InviteUserPayload>({
    mutationFn: usersService.invite,
    onSuccess: (newMember) => {
      qc.setQueryData<SafeUser[]>(teamKeys.list(), (old) => old ? [...old, newMember] : old);
      qc.invalidateQueries({ queryKey: teamKeys.list() });
      toast.success(t("toasts.invitationSent"), t("toasts.invitationSentBody", { name: newMember.firstName }));
    },
    onError: (err) => toast.error(t("toasts.inviteFailed"), err.message),
  });
}

// ── useUpdateUserRole ─────────────────────────────────────────────
export function useUpdateUserRole() {
  const qc = useQueryClient();

  return useMutation<SafeUser, ApiError, { id: string; payload: UpdateUserRolePayload }>({
    mutationFn: ({ id, payload }) => usersService.updateRole(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<SafeUser[]>(teamKeys.list(), (old) =>
        old?.map((u) => (u.id === updated.id ? updated : u))
      );
      toast.success(t("toasts.roleUpdated"));
    },
    onError: (err) => toast.error(t("toasts.roleUpdateFailed"), err.message),
  });
}

// ── useDeactivateUser ──────────────────────────────────────────────
export function useDeactivateUser() {
  const qc = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: usersService.deactivate,
    onSuccess: (_data, id) => {
      qc.setQueryData<SafeUser[]>(teamKeys.list(), (old) => old?.filter((u) => u.id !== id));
      toast.success(t("toasts.teammateDeactivated"));
    },
    onError: (err) => toast.error(t("toasts.deactivateFailed"), err.message),
  });
}
