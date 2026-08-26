# ORDINA Database

The backend uses SQLite through `better-sqlite3`. The default database file is `data/ordina.sqlite`; set `DATABASE_PATH` to override it for local tooling or tests.

## Entity relationship

```text
users 1 ───< tasks
users 1 ───< categories
tasks >───< categories
       via task_categories
```

Deleting a user cascades to their tasks and categories. Deleting a task or category cascades to its rows in `task_categories`. SQLite foreign-key enforcement is enabled on every connection.

## Tables

| Table | Purpose | Important constraints |
| --- | --- | --- |
| `users` | Account identity and password hash | Unique case-insensitive email |
| `tasks` | Todo records owned by a user | Status and priority checks; indexed by owner/status and due date |
| `categories` | User-owned labels | Unique category name per user |
| `task_categories` | Task/category many-to-many junction | Composite primary key and cascading foreign keys |

All tables use integer primary keys. `created_at` and mutable-record `updated_at` fields default to UTC SQLite `datetime('now')`. Dates such as `due_at` are stored as ISO-8601 text so they remain portable and sortable.

## Setup

From `backend-ordina`:

```bash
npm install
npm run db:setup
```

Initialization is idempotent and runs `schema.sql` with `CREATE TABLE/INDEX IF NOT EXISTS` statements.

## Verification

```bash
npm test
```

The test uses a temporary database, exercises create/read/update/delete behavior for users, categories, and tasks, verifies the many-to-many relationship, checks foreign-key rejection, and confirms user deletion cascades through related records.