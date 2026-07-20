import type { SafeUser, Role } from "@/types";

export type { SafeUser, Role };

// PATCH /users/me body  ↔  UpdateUserDto
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

// PATCH /users/me/password body  ↔  ChangePasswordDto
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// POST /users/invite body  ↔  InviteUserDto
export interface InviteUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

// PATCH /users/:id/role body  ↔  UpdateUserRoleDto
export interface UpdateUserRolePayload {
  role: Role;
}
