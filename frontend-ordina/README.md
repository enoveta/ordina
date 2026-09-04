# ORDINA mobile app

Expo (React Native) client for ORDINA.

## Setup

```bash
cp .env.example .env
npm install
npx expo start
```

The API base URL is `EXPO_PUBLIC_API_URL` (default `http://localhost:4000`).

## Android development build

Expo Go cannot provide Android remote push notifications and does not include the
native modules required by `expo-av` in this project. Use a development build for
microphone and notification testing:

```bash
npx expo install
npx eas login
npm run android:dev-build
npm run android:run-dev-build
```

Install the generated APK on the Android device, start the backend with SQLite,
and use the development build to test microphone permissions, local reminders,
push-token registration, and notification handling. The Android application id is
`com.ordina.app`.

Light mode is the default. Dark mode and system follow the device preference from **Profile**.
