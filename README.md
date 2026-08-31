# ORDINA

AI-powered personal productivity for Android and iOS.

> Tell ORDINA what you need to do. Let ORDINA put it in order.

This repository is a React Native (Expo) app plus a Node.js Express API with Prisma and SQLite. PostgreSQL remains an option for later cloud hosting; development uses SQLite as already configured.

## Current phase

**Phase 1 — foundation** (`feature/phase-1-foundation`)

Verified existing Expo + Prisma/SQLite setup, added the Express API shell, ORDINA branding (logo, Poppins, light/dark theme), and the five-tab navigation. Authentication and task CRUD are next.

| Branch | Phase |
| --- | --- |
| `chore/TASK-001-setup-environment` | Project setup and SQLite schema |
| `feature/phase-1-foundation` | API shell, branding, navigation, theme |
| `feature/authentication` | Phase 2 (next) |
| `feature/task-management` | Phase 3 |
| `feature/scheduling` | Phase 4 |
| `feature/ordina-ai` | Phase 6 |
| `feature/voice-assistant` | Phase 7 |

## Prerequisites

- Node.js 20+
- npm
- Git
- Expo Go or an emulator/simulator for the mobile app

## Repository layout

```text
MobileApplication/
  frontend-ordina/   Expo Router app
  backend-ordina/    Express + Prisma API
```

## Backend setup

```bash
cd backend-ordina
cp .env.example .env
npm install
npm run db:generate
npm run db:setup
npm run db:test:prisma
npm run dev
```

API health check: `GET http://localhost:4000/api/health`

### Environment variables

See `backend-ordina/.env.example`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma SQLite file, default `file:./data/ordina.sqlite` |
| `PORT` | API port, default `4000` |
| `JWT_SECRET` | Required for Phase 2 auth. Never commit a real secret. |
| `OPENAI_API_KEY` | Backend-only AI key. Required from Phase 6. Leave empty until then. |
| `CORS_ORIGIN` | Browser origin allowlist |

Do not put AI keys in the React Native app.

## Frontend setup

```bash
cd frontend-ordina
cp .env.example .env
npm install
npx expo start
```

Android emulator: set `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` if the API runs on the host machine.

Physical device: use your computer's LAN IP instead of `localhost`.

### Theme

Light mode is the default (`#F8FAFC` background, `#5C4DF2` primary). Dark mode follows the Figma board (`#0F172A` background, `#7C3AED` AI accent). Switch in **Profile → Appearance**. The choice is stored on the device.

The approved logo lockup (octagon mark + ORDINA + tagline on black) is used as-is on splash and brand surfaces.

## Database

Prisma schema: `backend-ordina/prisma/schema.prisma`

Current models: User, Task, Category, TaskCategory.

```bash
cd backend-ordina
npx prisma migrate dev --name <name>
```

Full notes: `backend-ordina/DATABASE.md`.

## API

Phase 1 exposes:

- `GET /api/health` — process + database connectivity

Responses:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "message": "..." } }
```

Auth, tasks, projects, goals, AI, and analytics routes will be added in later phases.

## AI integration

ORDINA AI is called from the **backend**. Configure `OPENAI_API_KEY` in `backend-ordina/.env` when Phase 6 starts. The mobile app only talks to `/api/...`.

## Testing

```bash
cd backend-ordina
npm test
npm run db:test:prisma
```

Use Postman against `http://localhost:4000/api/health`. Frontend checks: `npx tsc --noEmit` in `frontend-ordina`.

## Deployment (later)

Host the API and database in the cloud, point `DATABASE_URL` at managed Postgres when you migrate off SQLite, and keep secrets in the host environment. The Expo app is built with EAS for Android and iOS.

## Design reference

Figma: [ORDINA_APP](https://www.figma.com/design/SCVeMG4DD2DVHn5QAk3gbW/ORDINA_APP?node-id=0-1)
