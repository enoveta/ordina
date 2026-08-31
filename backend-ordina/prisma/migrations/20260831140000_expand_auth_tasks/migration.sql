-- AlterTable
ALTER TABLE "users" ADD COLUMN "age" INTEGER;
ALTER TABLE "users" ADD COLUMN "gender" TEXT;
ALTER TABLE "users" ADD COLUMN "goals" TEXT;
ALTER TABLE "users" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;
ALTER TABLE "users" ADD COLUMN "apple_id" TEXT;
ALTER TABLE "users" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "theme_preference" TEXT NOT NULL DEFAULT 'light';

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- RedefineTable
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'work',
    "project_id" INTEGER,
    "due_at" DATETIME,
    "start_time" TEXT,
    "end_time" TEXT,
    "duration" TEXT,
    "reminder" BOOLEAN NOT NULL DEFAULT 0,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("id", "user_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at")
SELECT "id", "user_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
CREATE INDEX "tasks_user_id_status_idx" ON "tasks"("user_id", "status");
CREATE INDEX "tasks_due_at_idx" ON "tasks"("due_at");

CREATE TABLE "projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#8B5CF6',
    "tasks_total" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "tasks_overdue" INTEGER NOT NULL DEFAULT 0,
    "due_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
PRAGMA foreign_keys=ON;
