const http = require("node:http");
const path = require("node:path");
const admin = require("firebase-admin");

const MESSAGE_CHANNEL_ID = "tubonge_messages";
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered"
]);

const startedAt = new Date().toISOString();
const state = {
  group: {
    lastId: null,
    lastTimestamp: 0
  },
  privateChats: new Map(),
  privateListeners: new Map(),
  stats: {
    sent: 0,
    failed: 0,
    invalidTokensRemoved: 0
  }
};

function resolveServiceAccountPath() {
  return process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, "service-account.json");
}

function buildDatabaseUrl(serviceAccount) {
  if (process.env.FIREBASE_DATABASE_URL) {
    return process.env.FIREBASE_DATABASE_URL;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  if (!projectId) {
    throw new Error("Missing Firebase project id. Set FIREBASE_PROJECT_ID or provide it in the service account.");
  }

  return `https://${projectId}-default-rtdb.firebaseio.com`;
}

function initializeFirebase() {
  const serviceAccountPath = resolveServiceAccountPath();
  const serviceAccount = require(serviceAccountPath);
  const databaseUrl = buildDatabaseUrl(serviceAccount);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseUrl
  });

  return {
    serviceAccountPath,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    databaseUrl
  };
}

function getMessagePreview(message) {
  if (!message) return "New message";
  if (message.type === "text") return message.text || "New message";
  if (message.type === "image") return "sent a photo";
  if (message.type === "video") return "sent a video";
  if (message.type === "voice") return "sent a voice message";
  if (message.type === "sticker") return message.sticker ? `sent a sticker ${message.sticker}` : "sent a sticker";
  return "sent a new message";
}

function truncatePreview(text, maxLength = 120) {
  if (!text) return "New message";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function getSeenState(message) {
  return {
    lastId: message?.id || null,
    lastTimestamp: Number(message?.timestamp) || 0
  };
}

function isNewerThanSeenState(seenState, message) {
  if (!message) return false;
  const messageTimestamp = Number(message.timestamp) || 0;
  if (messageTimestamp > seenState.lastTimestamp) {
    return true;
  }
  return messageTimestamp === seenState.lastTimestamp && !!message.id && message.id !== seenState.lastId;
}

function getLatestMessageFromChatSnapshot(snapshotValue) {
  const messages = Object.entries(snapshotValue || {}).map(([id, message]) => ({
    id,
    ...message
  }));

  if (!messages.length) return null;

  messages.sort((left, right) => {
    const timestampDelta = (Number(left.timestamp) || 0) - (Number(right.timestamp) || 0);
    if (timestampDelta !== 0) return timestampDelta;
    return String(left.id).localeCompare(String(right.id));
  });

  return messages[messages.length - 1];
}

async function getUserRecord(db, username) {
  if (!username) return null;
  const snapshot = await db.ref(`users/${username}`).get();
  return snapshot.exists() ? snapshot.val() : null;
}

async function getDeviceEntriesForUser(db, username) {
  const userRecord = await getUserRecord(db, username);
  const devices = userRecord?.devices || {};

  return Object.entries(devices)
    .map(([installationId, device]) => ({
      username,
      installationId,
      token: device?.token || ""
    }))
    .filter((device) => !!device.token);
}

async function getGroupRecipientDevices(db, senderUsername) {
  const snapshot = await db.ref("users").get();
  if (!snapshot.exists()) return [];

  const users = snapshot.val() || {};
  const devices = [];

  Object.entries(users).forEach(([username, profile]) => {
    if (!username || username === senderUsername) return;
    const userDevices = profile?.devices || {};
    Object.entries(userDevices).forEach(([installationId, device]) => {
      if (!device?.token) return;
      devices.push({
        username,
        installationId,
        token: device.token
      });
    });
  });

  return devices;
}

async function removeInvalidDeviceEntries(db, deviceEntries, responses) {
  const removals = [];

  responses.forEach((response, index) => {
    const errorCode = response?.error?.code;
    if (!INVALID_TOKEN_CODES.has(errorCode)) return;

    const device = deviceEntries[index];
    if (!device) return;

    removals.push(db.ref(`users/${device.username}/devices/${device.installationId}`).remove());
  });

  if (!removals.length) return;

  const results = await Promise.allSettled(removals);
  const removedCount = results.filter((result) => result.status === "fulfilled").length;
  state.stats.invalidTokensRemoved += removedCount;
}

async function sendPushToDevices(db, messaging, deviceEntries, payload) {
  if (!deviceEntries.length) return;

  const chunks = chunkArray(deviceEntries, 500);

  for (const chunk of chunks) {
    const response = await messaging.sendEachForMulticast({
      tokens: chunk.map((device) => device.token),
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data,
      android: {
        priority: "high",
        notification: {
          channelId: MESSAGE_CHANNEL_ID,
          sound: "default"
        }
      }
    });

    state.stats.sent += response.successCount;
    state.stats.failed += response.failureCount;

    if (response.failureCount > 0) {
      await removeInvalidDeviceEntries(db, chunk, response.responses);
    }
  }
}

async function buildPayload(db, scope, message, chatId = "") {
  const senderProfile = await getUserRecord(db, message.username);
  const senderName = senderProfile?.displayName || message.username || "Someone";

  return {
    title: scope === "group" ? `${senderName} in group chat` : `New message from ${senderName}`,
    body: truncatePreview(getMessagePreview(message)),
    data: {
      scope,
      chatId: String(chatId || ""),
      sender: String(message.username || ""),
      senderDisplayName: String(senderName),
      messageId: String(message.id || ""),
      type: String(message.type || "text")
    }
  };
}

async function sendGroupNotification(db, messaging, message) {
  if (!message?.username) return;
  const recipients = await getGroupRecipientDevices(db, message.username);
  if (!recipients.length) return;
  const payload = await buildPayload(db, "group", message);
  await sendPushToDevices(db, messaging, recipients, payload);
  console.log(`[group] sent push for message ${message.id} from ${message.username} to ${recipients.length} devices`);
}

async function sendPrivateNotification(db, messaging, chatId, message) {
  if (!message?.username || !chatId) return;

  const participants = String(chatId).split("_").filter(Boolean);
  const recipient = participants.find((username) => username !== message.username);
  if (!recipient) return;

  const recipients = await getDeviceEntriesForUser(db, recipient);
  if (!recipients.length) return;
  const payload = await buildPayload(db, "private", message, chatId);
  await sendPushToDevices(db, messaging, recipients, payload);
  console.log(`[private] sent push for chat ${chatId}, message ${message.id}, recipient ${recipient}, devices ${recipients.length}`);
}

function startHealthServer(projectId) {
  const port = Number(process.env.PORT || 8080);
  const server = http.createServer((request, response) => {
    if (request.url !== "/" && request.url !== "/healthz") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: false }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      ok: true,
      projectId,
      startedAt,
      watchedPrivateChats: state.privateListeners.size,
      stats: state.stats
    }));
  });

  server.listen(port, () => {
    console.log(`Health server listening on :${port}`);
  });
}

function attachGroupListener(db, messaging) {
  const groupRef = db.ref("messages");

  groupRef.limitToLast(1).get().then((snapshot) => {
    if (snapshot.exists()) {
      const latestEntry = Object.entries(snapshot.val())[0];
      if (latestEntry) {
        state.group = getSeenState({ id: latestEntry[0], ...latestEntry[1] });
      }
    }

    groupRef.on("child_added", async (snapshot) => {
      const message = { id: snapshot.key, ...snapshot.val() };
      if (!isNewerThanSeenState(state.group, message)) {
        return;
      }

      state.group = getSeenState(message);

      try {
        await sendGroupNotification(db, messaging, message);
      } catch (error) {
        console.error("[group] notification failed", error);
      }
    });
  }).catch((error) => {
    console.error("Failed to initialize group listener", error);
  });
}

function attachPrivateChatListener(db, messaging, chatId) {
  if (state.privateListeners.has(chatId)) return;

  const chatRef = db.ref(`private_messages/${chatId}`);
  const listener = async (snapshot) => {
    const message = { id: snapshot.key, ...snapshot.val() };
    const seenState = state.privateChats.get(chatId) || { lastId: null, lastTimestamp: 0 };

    if (!isNewerThanSeenState(seenState, message)) {
      return;
    }

    state.privateChats.set(chatId, getSeenState(message));

    try {
      await sendPrivateNotification(db, messaging, chatId, message);
    } catch (error) {
      console.error(`[private] notification failed for chat ${chatId}`, error);
    }
  };

  chatRef.on("child_added", listener);
  state.privateListeners.set(chatId, { ref: chatRef, listener });
}

async function initializePrivateListeners(db, messaging) {
  const privateRootRef = db.ref("private_messages");
  const snapshot = await privateRootRef.get();
  const chats = snapshot.val() || {};

  Object.entries(chats).forEach(([chatId, messages]) => {
    const latestMessage = getLatestMessageFromChatSnapshot(messages);
    if (latestMessage) {
      state.privateChats.set(chatId, getSeenState(latestMessage));
    }
    attachPrivateChatListener(db, messaging, chatId);
  });

  privateRootRef.on("child_added", async (chatSnapshot) => {
    const chatId = chatSnapshot.key;
    if (!chatId || state.privateListeners.has(chatId)) {
      return;
    }

    const latestMessage = getLatestMessageFromChatSnapshot(chatSnapshot.val());
    if (latestMessage) {
      try {
        await sendPrivateNotification(db, messaging, chatId, latestMessage);
      } catch (error) {
        console.error(`[private] notification failed for first message in chat ${chatId}`, error);
      }
      state.privateChats.set(chatId, getSeenState(latestMessage));
    } else {
      state.privateChats.set(chatId, { lastId: null, lastTimestamp: 0 });
    }

    attachPrivateChatListener(db, messaging, chatId);
  });
}

async function main() {
  const { projectId, serviceAccountPath, databaseUrl } = initializeFirebase();
  const db = admin.database();
  const messaging = admin.messaging();

  console.log(`Push server started for project ${projectId}`);
  console.log(`Using service account: ${serviceAccountPath}`);
  console.log(`Using database URL: ${databaseUrl}`);

  startHealthServer(projectId);
  attachGroupListener(db, messaging);
  await initializePrivateListeners(db, messaging);
}

main().catch((error) => {
  console.error("Push server failed to start", error);
  process.exit(1);
});
