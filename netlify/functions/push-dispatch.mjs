import { randomUUID } from "node:crypto";
import admin from "firebase-admin";

const MESSAGE_CHANNEL_ID = "tubonge_messages";
const NOTIFICATION_QUEUE_PATH = "notification_queue";
const DISPATCH_STATE_PATH = "_notification_dispatch";
const LOCK_PATH = `${DISPATCH_STATE_PATH}/netlify_lock`;
const STATUS_PATH = `${DISPATCH_STATE_PATH}/netlify_status`;
const INVALID_TOKEN_CODES = new Set([
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered"
]);
const MAX_EVENTS_PER_RUN = parsePositiveInteger(process.env.NETLIFY_PUSH_BATCH_SIZE, 50);
const LOCK_TTL_MS = parsePositiveInteger(process.env.NETLIFY_PUSH_LOCK_TTL_MS, 25_000);
const EXECUTION_BUDGET_MS = parsePositiveInteger(process.env.NETLIFY_PUSH_EXECUTION_BUDGET_MS, 25_000);

let firebaseContextPromise = null;

export const config = {
    schedule: "* * * * *"
};

export default async function handler() {
    const startedAt = Date.now();
    const runId = randomUUID();

    try {
        const { db, messaging, projectId, databaseUrl } = await getFirebaseContext();
        const lock = await acquireLock(db, runId);

        if (!lock.acquired) {
            return jsonResponse({
                ok: true,
                skipped: true,
                reason: "dispatch-lock-active",
                runId,
                projectId
            }, 202);
        }

        try {
            const summary = await processQueue({
                db,
                messaging,
                deadline: startedAt + EXECUTION_BUDGET_MS
            });

            const payload = {
                ok: true,
                runId,
                projectId,
                databaseUrl,
                processedAt: new Date().toISOString(),
                durationMs: Date.now() - startedAt,
                ...summary
            };

            await db.ref(STATUS_PATH).set(payload);
            return jsonResponse(payload);
        } finally {
            await releaseLock(db, runId);
        }
    } catch (error) {
        console.error("[push-dispatch] failed", error);
        return jsonResponse({
            ok: false,
            runId,
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
}

function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value || "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload, null, 2), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8"
        }
    });
}

function getServiceAccount() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (serviceAccountJson) {
        return JSON.parse(serviceAccountJson);
    }

    if (serviceAccountBase64) {
        return JSON.parse(Buffer.from(serviceAccountBase64, "base64").toString("utf8"));
    }

    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64.");
}

function buildDatabaseUrl(serviceAccount) {
    if (process.env.FIREBASE_DATABASE_URL) {
        return process.env.FIREBASE_DATABASE_URL;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
    if (!projectId) {
        throw new Error("Missing FIREBASE_PROJECT_ID and project_id in the service account.");
    }

    return `https://${projectId}-default-rtdb.firebaseio.com`;
}

async function getFirebaseContext() {
    if (!firebaseContextPromise) {
        firebaseContextPromise = (async () => {
            const serviceAccount = getServiceAccount();
            const databaseUrl = buildDatabaseUrl(serviceAccount);
            const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: databaseUrl
                });
            }

            return {
                db: admin.database(),
                messaging: admin.messaging(),
                projectId,
                databaseUrl
            };
        })().catch((error) => {
            firebaseContextPromise = null;
            throw error;
        });
    }

    return firebaseContextPromise;
}

async function acquireLock(db, owner) {
    const lockRef = db.ref(LOCK_PATH);
    const now = Date.now();
    const expiresAt = now + LOCK_TTL_MS;

    const result = await lockRef.transaction((current) => {
        if (current?.expiresAt && Number(current.expiresAt) > now && current.owner !== owner) {
            return;
        }

        return {
            owner,
            acquiredAt: now,
            expiresAt
        };
    });

    const lockOwner = result.snapshot?.val()?.owner;
    return {
        acquired: Boolean(result.committed && lockOwner === owner)
    };
}

async function releaseLock(db, owner) {
    const lockRef = db.ref(LOCK_PATH);
    const snapshot = await lockRef.get();
    if (!snapshot.exists()) return;
    if (snapshot.val()?.owner !== owner) return;
    await lockRef.remove();
}

async function processQueue({ db, messaging, deadline }) {
    const queueSnapshot = await db.ref(NOTIFICATION_QUEUE_PATH).orderByKey().limitToFirst(MAX_EVENTS_PER_RUN).get();
    const summary = {
        loaded: 0,
        handled: 0,
        acked: 0,
        retried: 0,
        dropped: 0,
        sent: 0,
        failed: 0,
        invalidTokensRemoved: 0,
        timedOut: false
    };

    if (!queueSnapshot.exists()) {
        return summary;
    }

    const events = Object.entries(queueSnapshot.val()).map(([id, event]) => ({
        id,
        ...event
    }));
    const usersSnapshot = await db.ref("users").get();
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
    const acknowledgements = {};

    summary.loaded = events.length;

    for (const event of events) {
        if (Date.now() >= deadline) {
            summary.timedOut = true;
            break;
        }

        summary.handled += 1;

        try {
            const result = await dispatchNotificationEvent({
                db,
                messaging,
                users,
                event
            });

            if (result.ack) {
                acknowledgements[event.id] = null;
                summary.acked += 1;
            } else {
                summary.retried += 1;
            }

            if (result.dropped) {
                summary.dropped += 1;
            }

            summary.sent += result.sent || 0;
            summary.failed += result.failed || 0;
            summary.invalidTokensRemoved += result.invalidTokensRemoved || 0;
        } catch (error) {
            summary.retried += 1;
            console.error(`[push-dispatch] queue item ${event.id} failed`, error);
        }
    }

    if (Object.keys(acknowledgements).length) {
        await db.ref(NOTIFICATION_QUEUE_PATH).update(acknowledgements);
    }

    return summary;
}

async function dispatchNotificationEvent({ db, messaging, users, event }) {
    if (!event?.sender || !event?.scope) {
        return {
            ack: true,
            dropped: true,
            sent: 0,
            failed: 0,
            invalidTokensRemoved: 0
        };
    }

    const recipients = getRecipientsForEvent(users, event);
    if (!recipients.length) {
        return {
            ack: true,
            dropped: true,
            sent: 0,
            failed: 0,
            invalidTokensRemoved: 0
        };
    }

    const payload = buildPayload(users, event);
    const sendResult = await sendPushToDevices({
        db,
        messaging,
        users,
        deviceEntries: recipients,
        payload
    });

    return {
        ack: true,
        dropped: false,
        ...sendResult
    };
}

function getRecipientsForEvent(users, event) {
    if (event.scope === "group") {
        return getGroupRecipientDevices(users, event.sender);
    }

    if (event.scope === "private") {
        const recipient = getPrivateRecipient(event.chatId, event.sender);
        if (!recipient) return [];
        return getDeviceEntriesForUser(users, recipient);
    }

    return [];
}

function getPrivateRecipient(chatId, sender) {
    return String(chatId || "")
        .split("_")
        .map((value) => value.trim())
        .filter(Boolean)
        .find((username) => username !== sender) || "";
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

function getDeviceEntriesForUser(users, username) {
    const devices = users?.[username]?.devices || {};

    return Object.entries(devices)
        .map(([installationId, device]) => ({
            username,
            installationId,
            token: device?.token || ""
        }))
        .filter((device) => Boolean(device.token));
}

function getGroupRecipientDevices(users, senderUsername) {
    const recipients = [];

    Object.entries(users || {}).forEach(([username, profile]) => {
        if (!username || username === senderUsername) return;

        Object.entries(profile?.devices || {}).forEach(([installationId, device]) => {
            if (!device?.token) return;
            recipients.push({
                username,
                installationId,
                token: device.token
            });
        });
    });

    return recipients;
}

function buildPayload(users, event) {
    const senderProfile = users?.[event.sender];
    const senderName = senderProfile?.displayName || event.sender || "Someone";
    const scope = event.scope === "private" ? "private" : "group";

    return {
        title: scope === "group" ? `${senderName} in group chat` : `New message from ${senderName}`,
        body: truncatePreview(getMessagePreview(event)),
        data: {
            scope,
            chatId: String(event.chatId || ""),
            sender: String(event.sender || ""),
            senderDisplayName: String(senderName),
            messageId: String(event.messageId || event.id || ""),
            type: String(event.type || "text")
        }
    };
}

function chunkArray(items, chunkSize) {
    const chunks = [];
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }
    return chunks;
}

async function sendPushToDevices({ db, messaging, users, deviceEntries, payload }) {
    const chunks = chunkArray(deviceEntries, 500);
    const result = {
        sent: 0,
        failed: 0,
        invalidTokensRemoved: 0
    };

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

        result.sent += response.successCount;
        result.failed += response.failureCount;

        if (response.failureCount > 0) {
            result.invalidTokensRemoved += await removeInvalidDeviceEntries({
                db,
                users,
                deviceEntries: chunk,
                responses: response.responses
            });
        }
    }

    return result;
}

async function removeInvalidDeviceEntries({ db, users, deviceEntries, responses }) {
    const removals = [];

    responses.forEach((response, index) => {
        const errorCode = response?.error?.code;
        if (!INVALID_TOKEN_CODES.has(errorCode)) return;

        const device = deviceEntries[index];
        if (!device) return;

        removals.push(
            db.ref(`users/${device.username}/devices/${device.installationId}`).remove()
        );

        if (users?.[device.username]?.devices?.[device.installationId]) {
            delete users[device.username].devices[device.installationId];
        }
    });

    if (!removals.length) {
        return 0;
    }

    const settled = await Promise.allSettled(removals);
    return settled.filter((result) => result.status === "fulfilled").length;
}
