# ORDINA

AI-powered personal productivity for Android and iOS.

> Tell ORDINA what you need to do. Let ORDINA put it in order.

ORDINA turns natural-language (and optional voice) instructions into real tasks, reminders, and a schedule. You confirm before anything important is saved.

## What it does

- Email/password accounts with JWT sessions and an optional app PIN
- Tasks, projects, goals, reminders, recurrence, and a notification inbox
- Home, calendar, search, light/dark theme, and multiple languages
- ORDINA AI: create several tasks from one instruction, reschedule, “what should I do now?”, “I’m overwhelmed”, conflict-aware times
- Phone integrations (optional): microphone, notifications, contacts, calendar, location, camera/files

## Run locally

Need **Node.js 20+**. Use **two terminals**.

### 1. API

```bash
cd backend-ordina
copy .env.example .env   # Windows
npm install
npm run db:generate
npm run db:setup
npm run dev
```

Health check: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### 2. App

```bash
cd frontend-ordina
copy .env.example .env
npm install
npm start
```

Scan the QR code with **Expo Go**. If port 8081 is busy, choose the next port.

| Device | `EXPO_PUBLIC_API_URL` in `frontend-ordina/.env` |
| --- | --- |
| Same computer / iOS simulator | `http://localhost:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Physical phone | `http://YOUR_LAN_IP:4000` |

Restart Expo after changing the API URL.

## AI

The **mobile app never holds the Gemini key**. The API calls Gemini.

| Variable | Where | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | `backend-ordina/.env` | Full natural-language + voice transcription |
| `GEMINI_MODEL` | same file | Default `gemini-2.0-flash` |
| `JWT_SECRET` | same file | Sign-in tokens |
| `DATABASE_URL` | same file | SQLite file, default `file:./data/ordina.sqlite` |

If Gemini is missing or down, ORDINA still plans with its built-in parser (multiple tasks, relative dates, reschedule). Voice transcription **requires** `GEMINI_API_KEY`. Confirm is always required before tasks are written.

### Example

“Tomorrow I need to finish my React project, study PostgreSQL for two hours, call John at 4 PM, and go to the gym in the evening.”

ORDINA proposes four dated tasks. You tap **Confirm & save**.

## Layout

```text
MobileApplication/
  frontend-ordina/   Expo Router (SDK 57)
  backend-ordina/    Express + Prisma + SQLite
```

## API (authenticated unless noted)

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Tasks | `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/complete` |
| Projects | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Goals / reminders | `/api/goals`, `/api/reminders` |
| Notifications | `GET /api/notifications`, read/delete |
| Dashboard | `GET /api/dashboard` |
| AI | `POST /api/ai/interpret`, `/transcribe`, `/confirm`, `GET /api/ai/messages` |

Every protected record is scoped to the signed-in user.

## Theme

Light is default (`#F8FAFC`, primary `#5C4DF2`). Dark follows the Figma board. Switch in **Profile → Appearance**.

## Limitations (honest)

- Google / Apple sign-in and password-reset email are **not** wired (no OAuth/SMTP in this build)
- Voice and device calendar/contacts work fully on a **dev/production build**, not always in Expo Go
- Location arrival reminders are permission + settings only (no geofence in Expo Go)
- Image pick is ready for a later image-to-task model; images are not sent to Gemini yet

## Tests

```bash
cd backend-ordina
npm test
npm run db:test:prisma
node -e "const r=require('./src/lib/ai').localInterpret('Tomorrow study React for 2 hours and call John at 4 PM', []); console.log(JSON.stringify(r,null,2))"
```

Frontend: `npx tsc --noEmit` in `frontend-ordina`.

## Database

See `backend-ordina/DATABASE.md`. Do not wipe production data; only additive Prisma migrations.

## Design

Figma: [ORDINA_APP](https://www.figma.com/design/SCVeMG4DD2DVHn5QAk3gbW/ORDINA_APP?node-id=0-1)
