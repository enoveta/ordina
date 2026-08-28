# ORDINA Database

The backend uses SQLite through Prisma's libSQL adapter (with `better-sqlite3` retained for existing low-level database tooling). The default database file is `data/ordina.sqlite`, configured by `DATABASE_URL` in `.env`.

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

The Prisma schema is in `prisma/schema.prisma`; migrations are in `prisma/migrations`. Apply committed migrations with `npm run db:setup` and generate the client with `npm run db:generate`. The legacy `schema.sql` and `npm run db:test` smoke test remain available for the existing low-level database helper.

## Verification

```bash
npm test
npm run db:test:prisma
```

The tests exercise create/read/update/delete behavior for users, categories, and tasks, verify the many-to-many relationship, check foreign-key rejection, and confirm user deletion cascades through related records. For a fresh migration during development, use `npx prisma migrate dev --name <name>`.