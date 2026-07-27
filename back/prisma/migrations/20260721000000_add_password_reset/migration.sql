-- AlterTable
-- Adds password-reset support: a hashed, time-limited token stored on the
-- user record. Both columns are nullable since most users never have an
-- active reset request in flight.
ALTER TABLE "users" ADD COLUMN "resetPasswordToken" TEXT,
                     ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);
