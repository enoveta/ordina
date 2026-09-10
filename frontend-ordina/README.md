# ORDINA mobile app

Expo SDK 57 client for ORDINA.

## Setup

```bash
copy .env.example .env
npm install
npm start
```

`npm start` uses **Expo Go**. `EXPO_PUBLIC_API_URL` defaults to `http://localhost:4000`.

Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` to your Google **Web** client ID if you want Google sign-in.

Use `http://10.0.2.2:4000` on the Android emulator and your LAN IP on a physical phone.

Voice, camera, and arrival reminders work in Expo Go while the app is in the foreground. A development build is still better for background location and Apple sign-in.

## Development build

Expo Go cannot always run microphone, contacts, or calendar. For those:

```bash
npm run android:dev-build
npm run android:run-dev-build
```

Application id: `com.ordina.app`.

Light mode is the default. Change theme in **Profile**.
