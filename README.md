![Screenshot](screenshot.gif)
<br>
[link](https://tubongechat.netlify.app)
# Tubonge


**Features**
- Username + password sign up and login with session persistence (no personal data is collected like phone number and email).
- Admin login path and admin console for managing group messages.
- Group chat with realtime updates.
- 1:1 private chat threads with user selection.
- Online presence tracking with online/offline badges and live online count.
- User list with desktop sidebar and mobile users tab.
- Unread private chat badge and per-thread unread highlighting.
- Read receipts for private messages (`Sent` / `Read`).
- Message replies in group chat with reply preview and inline reply block.
- Image sharing in group and private chats with upload progress.
- Voice messages (15s max) with recording timer and waveform indicator.
- Profile editor (display name, bio, avatar selection).
- Profile viewer modal from message/user avatars.
- Message avatars with per-user accent colors.
- Sticky message composer with mobile keyboard visibility handling.
- Responsive, glassmorphism-styled UI with tabs and mobile optimizations.
- Manual reload button on key pages.

## Netlify push function

If your site is already on Netlify, you can send FCM push notifications without Firebase Functions by using the scheduled function in `netlify/functions/`.

- Netlify will poll `notification_queue` every minute and send pending push notifications.
- Add one of these Netlify environment variables:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - `FIREBASE_SERVICE_ACCOUNT_BASE64`
- Optional environment variables:
  - `FIREBASE_DATABASE_URL`
  - `FIREBASE_PROJECT_ID`
  - `NETLIFY_PUSH_BATCH_SIZE`
- Scheduled functions only run on published deploys.
- Because this is scheduled polling, delivery can be delayed by up to about one minute.

## Node push server alternative

If you do not want to use Firebase Functions on Blaze, a standalone Node sender is available in `push-server/`.

- It watches the Realtime Database directly and sends FCM notifications with Firebase Admin.
- It needs a Firebase service account JSON file and an always-on place to run.
- Setup instructions are in `push-server/README.md`.
