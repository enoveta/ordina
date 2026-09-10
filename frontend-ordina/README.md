# ORDINA mobile app

Expo SDK 57 client for ORDINA.

## Setup

```bash
copy .env.example .env
npm install
npm start
```

`npm start` uses **Expo Go**. `EXPO_PUBLIC_API_URL` defaults to `http://localhost:4000`.

Use `http://10.0.2.2:4000` on the Android emulator and your LAN IP on a physical phone.

## Development build

Expo Go cannot always run microphone, contacts, or calendar. For those:

```bash
npm run android:dev-build
npm run android:run-dev-build
```

Application id: `com.ordina.app`.

Light mode is the default. Change theme in **Profile**.
