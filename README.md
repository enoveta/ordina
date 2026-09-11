# ORDINA

AI-powered personal productivity for Android and iOS.

> Tell ORDINA what you need to do. Let ORDINA put it in order.

ORDINA turns natural-language (and optional voice) instructions into real tasks, reminders, and a schedule. You confirm before anything important is saved.

## What it does

- Email/password accounts with JWT sessions, optional Google / Apple sign-in, password reset codes, and an optional app PIN
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
| `GEMINI_API_KEY` | `backend-ordina/.env` | Natural-language, voice transcription, image → task |
| `GEMINI_MODEL` | same file | Default `gemini-2.0-flash` |
| `JWT_SECRET` | same file | Sign-in tokens |
| `GOOGLE_CLIENT_ID` | same file | Verify Google ID tokens (same Web client as the app) |
| `APPLE_CLIENT_ID` | same file | Verify Sign in with Apple (bundle id or Services ID) |
| `SMTP_HOST` | same file | Send password-reset codes by email |
| `DATABASE_URL` | same file | SQLite file, default `file:./data/ordina.sqlite` |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `frontend-ordina/.env` | Google sign-in in Expo Go |

If Gemini is missing or down, ORDINA still plans with its built-in parser (multiple tasks, relative dates, reschedule, arrival reminders). Voice transcription and image → task **require** `GEMINI_API_KEY`. Confirm is always required before tasks are written. Without SMTP, forgot-password still works: the 6-digit code is shown in the app.

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
| Auth | `POST /api/auth/register`, `/login`, `/google`, `/apple`, `/forgot`, `/reset` |
| Places | `GET/POST /api/places`, `DELETE /api/places/:id` |
| Tasks | `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/complete` |
| Projects | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Goals / reminders | `/api/goals`, `/api/reminders` |
| Notifications | `GET /api/notifications`, read/delete |
| Dashboard | `GET /api/dashboard` |
| AI | `POST /api/ai/interpret`, `/from-image`, `/transcribe`, `/confirm`, `GET /api/ai/messages` |

Every protected record is scoped to the signed-in user.

## Theme

Light is default (`#F8FAFC`, primary `#5C4DF2`). Dark follows the Figma board. Switch in **Profile → Appearance**.

## Limitations (honest)

- Google / Apple sign-in only work after you set real client IDs. Missing keys return 503 or an in-app message — they are not faked.
- Password-reset email needs `SMTP_*`. Without SMTP, the app shows the reset code instead of sending mail.
- Voice recording works in Expo Go (short clips). Transcription still needs `GEMINI_API_KEY`. A native build is more stable for long recordings.
- Arrival reminders watch GPS **while the app is open** (Expo Go cannot run reliable background geofences). Save Home/Work in Integrations first.
- Image → task needs `GEMINI_API_KEY`. You still confirm before tasks are saved.

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
