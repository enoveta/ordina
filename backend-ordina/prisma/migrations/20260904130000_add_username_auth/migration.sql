-- Add a stable username for personal sign-in alongside email.
ALTER TABLE "users" ADD COLUMN "username" TEXT;

UPDATE "users"
SET "username" = lower(replace(substr("email", 1, instr("email", '@') - 1), ' ', '_')) || '_' || "id"
WHERE "username" IS NULL;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");