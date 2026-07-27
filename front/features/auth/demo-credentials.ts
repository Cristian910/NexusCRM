/**
 * Single source of truth for the demo account credentials.
 * Mirrored in back/prisma/seed.ts — keep both in sync if you change these.
 */
export const DEMO_CREDENTIALS = {
  organizationSlug: "demo",
  email: "demo@nexuscrm.io",
  password: "Demo1234!",
} as const;
