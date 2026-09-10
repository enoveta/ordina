-- Add PIN-based authentication and local email verification state.
ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "email_verification_code" TEXT;