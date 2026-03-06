const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onValueCreated } = require("firebase-functions/v2/database");

admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const db = admin.database();
const messaging = admin.messaging();
const MESSAGE_CHANNEL_ID = "tubonge_messages";
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered"
]);

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

async function getUserRecord(username) {
  if (!username) return null;
  const snapshot = await db.ref(`users/${username}`).get();
  return snapshot.exists() ? snapshot.val() : null;
}

async function getDeviceEntriesForUser(username) {
  const userRecord = await getUserRecord(username);
  const devices = userRecord?.devices || {};

  return Object.entries(devices)
    .map(([installationId, device]) => ({
      username,
      installationId,
      token: device?.token || "",
      channelId: device?.channelId || MESSAGE_CHANNEL_ID
    }))
    .filter((device) => !!device.token);
}

async function getGroupRecipientDevices(senderUsername) {
  const usersSnapshot = await db.ref("users").get();
  if (!usersSnapshot.exists()) return [];

  const users = usersSnapshot.val() || {};
  const devices = [];

  Object.entries(users).forEach(([username, profile]) => {
    if (!username || username === senderUsername) return;
    const userDevices = profile?.devices || {};
    Object.entries(userDevices).forEach(([installationId, device]) => {
      if (!device?.token) return;
      devices.push({
        username,
        installationId,
        token: device.token,
        channelId: device.channelId || MESSAGE_CHANNEL_ID
      });
    });
  });

  return devices;
}

async function removeInvalidDeviceEntries(deviceEntries, responses) {
  const removals = [];

  responses.forEach((response, index) => {
    const errorCode = response?.error?.code;
    if (!INVALID_TOKEN_CODES.has(errorCode)) return;

    const device = deviceEntries[index];
    if (!device) return;

    removals.push(db.ref(`users/${device.username}/devices/${device.installationId}`).remove());
  });

  if (removals.length) {
    await Promise.allSettled(removals);
  }
}

async function sendPushToDevices(deviceEntries, payload) {
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

    if (response.failureCount > 0) {
      await removeInvalidDeviceEntries(chunk, response.responses);
    }
  }
}

async function buildPayload(scope, message, chatId = "") {
  const senderProfile = await getUserRecord(message.username);
  const senderName = senderProfile?.displayName || message.username || "Someone";
  const title = scope === "group" ? `${senderName} in group chat` : `New message from ${senderName}`;
  const body = truncatePreview(getMessagePreview(message));

  return {
    title,
    body,
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

exports.sendGroupPushNotification = onValueCreated("/messages/{messageId}", async (event) => {
  const message = event.data.val();
  if (!message?.username) return;

  const deviceEntries = await getGroupRecipientDevices(message.username);
  if (!deviceEntries.length) return;

  const payload = await buildPayload("group", {
    ...message,
    id: event.params.messageId
  });

  await sendPushToDevices(deviceEntries, payload);
});

exports.sendPrivatePushNotification = onValueCreated("/private_messages/{chatId}/{messageId}", async (event) => {
  const message = event.data.val();
  const chatId = event.params.chatId;
  if (!message?.username || !chatId) return;

  const participants = String(chatId).split("_").filter(Boolean);
  const recipient = participants.find((username) => username !== message.username);
  if (!recipient) return;

  const deviceEntries = await getDeviceEntriesForUser(recipient);
  if (!deviceEntries.length) return;

  const payload = await buildPayload("private", {
    ...message,
    id: event.params.messageId
  }, chatId);

  await sendPushToDevices(deviceEntries, payload);
});
