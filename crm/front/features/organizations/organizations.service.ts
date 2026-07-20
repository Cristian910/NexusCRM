import { apiClient } from "@/lib/api/client";
import type { Organization, UpdateOrganizationPayload } from "./types";

export const organizationsService = {
  async getMe(): Promise<Organization> {
    const { data } = await apiClient.get<Organization>("/organizations/me");
    return data;
  },

  async update(payload: UpdateOrganizationPayload): Promise<Organization> {
    const { data } = await apiClient.patch<Organization>("/organizations/me", payload);
    return data;
  },
};
