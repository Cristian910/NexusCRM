import { apiClient } from "@/lib/api/client";
import type { SafeUser } from "@/types";
import type {
  UpdateProfilePayload, ChangePasswordPayload,
  InviteUserPayload, UpdateUserRolePayload,
} from "./types";

export const usersService = {
  async listTeam(): Promise<SafeUser[]> {
    const { data } = await apiClient.get<SafeUser[]>("/users");
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<SafeUser> {
    const { data } = await apiClient.patch<SafeUser>("/users/me", payload);
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.patch("/users/me/password", payload);
  },

  async invite(payload: InviteUserPayload): Promise<SafeUser> {
    const { data } = await apiClient.post<SafeUser>("/users/invite", payload);
    return data;
  },

  async updateRole(id: string, payload: UpdateUserRolePayload): Promise<SafeUser> {
    const { data } = await apiClient.patch<SafeUser>(`/users/${id}/role`, payload);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
