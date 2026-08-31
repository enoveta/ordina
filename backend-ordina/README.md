# ORDINA Backend

Express API for the ORDINA mobile app. Prisma + SQLite store users, tasks, and projects. Auth is JWT (email/password). Google and Apple routes are live and return **503** until client IDs are set.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:setup
npm run dev
```

API: `http://localhost:4000`

Android emulator should use `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` in the app.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file, default `file:./data/ordina.sqlite` |
| `JWT_SECRET` | Signs session tokens |
| `GOOGLE_CLIENT_ID` | Verifies Google ID tokens on `POST /api/auth/google` |
| `APPLE_CLIENT_ID` | Checks Apple token audience on `POST /api/auth/apple` |
| `OPENAI_API_KEY` | Enables `POST /api/ai/chat` |

Do not put API secrets in the mobile app.

## Endpoints

- `GET /api/health`
- `POST /api/auth/register` `{ email, password, name, age?, gender?, goals? }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/google` `{ idToken }`
- `POST /api/auth/apple` `{ identityToken, fullName? }`
- `POST /api/auth/forgot-password` `{ email }`
- `GET /api/auth/me` and `PATCH /api/auth/me` (Bearer token)
- `GET/POST /api/tasks` and `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/projects`
- `POST /api/ai/chat` `{ message }`
