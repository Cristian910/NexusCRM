import { User } from '@prisma/client';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export function clampLimit(limit: number, max = 100): number {
  return Math.min(Math.max(1, limit), max);
}

// ─── Safe user ────────────────────────────────────────────────────────────────

export type SafeUser = Omit<User, 'password' | 'refreshToken'>;

export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, refreshToken, ...safe } = user;
  return safe;
}

// ─── Crypto ───────────────────────────────────────────────────────────────────

/**
 * Cryptographically random temp password.
 * Uses crypto.getRandomValues instead of Math.random for security.
 */
export function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}
