# Tubonge Push Server

Standalone Node server that watches Firebase Realtime Database and sends FCM push notifications without Firebase Functions.

## What it needs

- Node.js 20+
- A Firebase service account JSON file with Realtime Database and Cloud Messaging access
- Your Android app already registering device tokens under `users/{username}/devices/{installationId}`

## Setup

1. Put your Firebase service account JSON in:
   `push-server/service-account.json`

   or set one of these env vars:
   - `FIREBASE_SERVICE_ACCOUNT_PATH`
   - `GOOGLE_APPLICATION_CREDENTIALS`

2. Optional env vars:
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `PORT`

3. Install dependencies:

```powershell
cd push-server
npm install
```

4. Start the server:

```powershell
npm start
```

The health endpoint will be available at:

```text
http://localhost:8080/healthz
```

## Free use

- Firebase Cloud Messaging itself is free.
- This server can be free only if you run it on your own machine or on a host with a free always-on tier.
- Many free hosts sleep or remove free plans, so fully reliable background notifications are usually not guaranteed for free.
