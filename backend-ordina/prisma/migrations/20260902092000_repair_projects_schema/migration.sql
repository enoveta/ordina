-- Add fields required by the Prisma Project model to the pre-existing projects table.
ALTER TABLE "projects" ADD COLUMN "description" TEXT;
ALTER TABLE "projects" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
