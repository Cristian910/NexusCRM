/**
 * Auth service — thin wrapper around apiClient.
 * Called by React Query hooks. Never called directly from components.
 */
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthResponse, AuthTokens, LoginPayload, RegisterPayload, SafeUser } from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.login, payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.register, payload);
    return data;
  },

  /**
   * /users/me uses GET and returns the full SafeUser from the database.
   * (POST /auth/me only returns the decoded JWT payload, which lacks
   * firstName, lastName, isActive and other fields the UI needs.)
   */
  async me(): Promise<SafeUser> {
    const { data } = await apiClient.get<SafeUser>(ENDPOINTS.auth.me);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post(ENDPOINTS.auth.logout);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(
      ENDPOINTS.auth.refresh,
      { refreshToken },
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    return data;
  },
};
