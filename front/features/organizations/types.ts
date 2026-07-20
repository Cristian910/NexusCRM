import type { Organization } from "@/types";

export type { Organization };

// PATCH /organizations/me body  ↔  UpdateOrganizationDto
export interface UpdateOrganizationPayload {
  name: string;
}
