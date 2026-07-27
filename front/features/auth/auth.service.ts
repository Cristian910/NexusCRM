/**
 * Auth service — thin wrapper around apiClient.
 * Called by React Query hooks. Never called directly from components.
 */
import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AuthResponse, AuthTokens, LoginPayload, RegisterPayload, SafeUser,
  ForgotPasswordPayload, ResetPasswordPayload,
} from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.login, payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.register, payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(ENDPOINTS.auth.forgotPassword, payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(ENDPOINTS.auth.resetPassword, payload);
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
