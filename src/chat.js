import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    onDisconnect,
    remove,
    limitToLast,
    query,
    update,
    get
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import {
    getStorage,
    ref as sRef,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3iPABSvpTN5KHAFFYNlAIwEPR8XEddRY",
    authDomain: "dtubonge.firebaseapp.com",
    databaseURL: "https://dtubonge-default-rtdb.firebaseio.com",
    projectId: "dtubonge",
    storageBucket: "dtubonge.firebasestorage.app",
    messagingSenderId: "194637518723",
    appId: "1:194637518723:web:891227e82ea2817e6888b6",
    measurementId: "G-5NPT1KM5DR"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

const sessionRaw = localStorage.getItem('dtubonge_session');
const adminSession = localStorage.getItem('dtubonge_admin');

if (adminSession === 'true') {
    window.location.href = 'admin.html';
}

function parseSession(raw) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return { username: parsed };
        if (parsed && typeof parsed === 'object') return parsed;
        return null;
    } catch {
        const fallback = String(raw).trim();
        return fallback ? { username: fallback } : null;
    }
}

const session = parseSession(sessionRaw);
const currentUser = session?.username ? String(session.username).trim() : '';
if (!currentUser) {
    localStorage.removeItem('dtubonge_session');
    window.location.href = 'login.html';
}

const els = {
    onlineCount: document.getElementById('online-count'),
    userList: document.getElementById('user-list'),
    userListMobile: document.getElementById('user-list-mobile'),
    headerAvatar: document.getElementById('header-avatar'),
    sessionUser: document.getElementById('session-user'),
    logoutBtn: document.getElementById('logout-btn'),
    muteBtn: document.getElementById('mute-chat-btn'),
    profileBtn: document.getElementById('profile-btn'),
    reloadBtn: document.getElementById('reload-btn'),

    tabButtons: Array.from(document.querySelectorAll('.chat-tabs .tab-btn')),
    panels: {
        group: document.getElementById('panel-group'),
        private: document.getElementById('panel-private'),
        notifications: document.getElementById('panel-notifications'),
        users: document.getElementById('panel-users')
    },

    groupMessages: document.getElementById('group-messages'),
    groupEmpty: document.getElementById('group-empty'),
    groupTyping: document.getElementById('group-typing'),

    privateList: document.getElementById('private-list'),
    privateMessages: document.getElementById('private-messages'),
    privateEmpty: document.getElementById('private-empty'),
    privateTyping: document.getElementById('private-typing'),
    privateTitle: document.getElementById('private-chat-title'),
    privateBack: document.getElementById('private-back'),

    notificationCenterList: document.getElementById('notification-center-list'),
    clearNotificationsBtn: document.getElementById('clear-notifications-btn'),
    notificationStack: document.getElementById('notification-stack'),

    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),

    attachBtn: document.getElementById('attach-btn'),
    imageInput: document.getElementById('image-input'),
    uploadStatus: document.getElementById('upload-status'),
    uploadLabel: document.getElementById('upload-label'),
    uploadBarFill: document.getElementById('upload-bar-fill'),

    stickerBtn: document.getElementById('sticker-btn'),
    stickerPanel: document.getElementById('sticker-panel'),

    voiceBtn: document.getElementById('voice-btn'),
    recordingIndicator: document.getElementById('recording-indicator'),
    recordingTimer: document.getElementById('recording-timer'),

    composerToggle: document.getElementById('composer-toggle'),
    composerMenu: document.getElementById('composer-menu'),

    replyPreview: document.getElementById('reply-preview'),
    replyText: document.getElementById('reply-text'),
    cancelReply: document.getElementById('cancel-reply'),

    privateBadge: document.getElementById('private-badge'),
    globalSearch: document.getElementById('global-search'),
    searchResults: document.getElementById('search-results'),

    profileModal: document.getElementById('profile-modal'),
    closeProfile: document.getElementById('close-profile'),
    cancelProfile: document.getElementById('cancel-profile'),
    saveProfile: document.getElementById('save-profile'),
    profileDisplay: document.getElementById('profile-display'),
    profileBio: document.getElementById('profile-bio'),
    avatarGrid: document.getElementById('avatar-grid'),
    modalLogout: document.getElementById('modal-logout-btn'),
    modalRefresh: document.getElementById('modal-refresh-btn'),
    themeReset: document.getElementById('theme-reset'),
    themeOptions: document.getElementById('theme-options'),

    viewProfileModal: document.getElementById('view-profile-modal'),
    closeViewProfile: document.getElementById('close-view-profile'),
    viewProfileAvatar: document.getElementById('view-profile-avatar'),
    viewProfileName: document.getElementById('view-profile-name'),
    viewProfileBio: document.getElementById('view-profile-bio'),
    viewProfileStatus: document.getElementById('view-profile-status'),
    viewProfileJoin: document.getElementById('view-profile-join')
};

const state = {
    usersByName: new Map(),
    userThreads: new Map(), // threadId -> otherUser
    activeTab: 'group',
    activeThreadId: null,
    activeOtherUser: null,
    reply: null,
    muted: localStorage.getItem('dtubonge_muted') === 'true',
    notifications: [],
    listenedUnread: new Set()
};

const avatarIcons = ['🐼', '🦊', '🐯', '🦁', '🐸', '🐵', '🐙', '🦄', '🐶', '🐱', '🐧', '🐨'];

function avatarIcon(i) {
    const n = Number(i);
    if (!Number.isFinite(n)) return avatarIcons[0];
    return avatarIcons[Math.abs(n) % avatarIcons.length];
}

function escapeHtml(input) {
    return String(input)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatTime(ts) {
    try {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function stableThreadId(a, b) {
    return [String(a).trim(), String(b).trim()].sort((x, y) => x.localeCompare(y)).join('__');
}

function legacyThreadId(a, b) {
    return [String(a).trim(), String(b).trim()].sort((x, y) => x.localeCompare(y)).join('_');
}

function threadIdVariants(a, b) {
    const variants = [stableThreadId(a, b), legacyThreadId(a, b)];
    return Array.from(new Set(variants.filter(Boolean)));
}

function privateMessagesPath(threadId) {
    return `private_threads/${threadId}/messages`;
}

function privateReadsPath(threadId, username) {
    return `private_threads/${threadId}/reads/${username}`;
}

function privateMessagesLegacyPath(threadId) {
    return `private_messages/${threadId}`;
}

function resolveThreadCandidates(threadId, otherUser) {
    const out = [];
    if (threadId) out.push(String(threadId).trim());
    if (otherUser) out.push(...threadIdVariants(currentUser, otherUser));
    return Array.from(new Set(out.filter(Boolean)));
}

function showPanel(tab) {
    state.activeTab = tab;
    for (const btn of els.tabButtons) {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    }
    for (const [key, panel] of Object.entries(els.panels)) {
        if (!panel) continue;
        panel.classList.toggle('active', key === tab);
    }
    if (tab === 'users') {
        renderUsersList(els.userListMobile, true);
    }
    if (tab !== 'private') {
        setPrivateThreadOpen(false);
    }
}

function setPrivateThreadOpen(open) {
    if (!els.panels.private) return;
    els.panels.private.classList.toggle('thread-open', Boolean(open));
}

function setMuted(muted) {
    state.muted = Boolean(muted);
    localStorage.setItem('dtubonge_muted', state.muted ? 'true' : 'false');
    if (els.muteBtn) els.muteBtn.textContent = state.muted ? 'Unmute' : 'Mute';
}

function toast(message) {
    state.notifications.unshift({ message, ts: Date.now() });
    state.notifications = state.notifications.slice(0, 50);
    renderNotificationCenter();

    if (!els.notificationStack) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    els.notificationStack.appendChild(item);
    setTimeout(() => item.classList.add('show'), 10);
    setTimeout(() => {
        item.classList.remove('show');
        setTimeout(() => item.remove(), 250);
    }, 3500);
}

function renderNotificationCenter() {
    if (!els.notificationCenterList) return;
    els.notificationCenterList.innerHTML = '';
    if (state.notifications.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No notifications yet.';
        els.notificationCenterList.appendChild(empty);
        return;
    }

    for (const n of state.notifications) {
        const row = document.createElement('div');
        row.className = 'notification-row';
        row.innerHTML = `
            <div class="notification-text">${escapeHtml(n.message)}</div>
            <div class="notification-time">${escapeHtml(formatTime(n.ts))}</div>
        `;
        els.notificationCenterList.appendChild(row);
    }
}

function setReply(message) {
    state.reply = message;
    if (!els.replyPreview || !els.replyText) return;
    els.replyPreview.classList.add('active');
    els.replyText.textContent = message?.text ? `Replying to ${message.username}: ${message.text}` : 'Replying...';
}

function clearReply() {
    state.reply = null;
    if (!els.replyPreview) return;
    els.replyPreview.classList.remove('active');
    if (els.replyText) els.replyText.textContent = '';
}

function avatarHtml(user, size = 32) {
    const username = user?.username || '';
    const label = (user?.displayName || username || '?').trim();
    const icon = avatarIcon(user?.avatar);
    const color = user?.color || '#e91e63';
    const safeTitle = escapeHtml(user?.displayName || username);
    return `<div class="avatar" title="${safeTitle}" style="width:${size}px;height:${size}px;background:${escapeHtml(color)}">${escapeHtml(icon)}</div>`;
}

function renderUsersList(container, compact = false) {
    if (!container) return;
    container.innerHTML = '';
    const users = Array.from(state.usersByName.values())
        .filter(u => u.username && u.username !== currentUser)
        .sort((a, b) => {
            const ao = a.online ? 1 : 0;
            const bo = b.online ? 1 : 0;
            if (ao !== bo) return bo - ao;
            return String(a.username).localeCompare(String(b.username));
        });

    for (const u of users) {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.dataset.username = u.username;
        item.innerHTML = `
            ${avatarHtml(u, compact ? 28 : 32)}
            <div class="user-meta">
                <div class="user-name">${escapeHtml(u.displayName || u.username)}</div>
                <div class="user-sub">${u.online ? 'Online' : 'Offline'}</div>
            </div>
            <span class="presence-dot ${u.online ? 'online' : 'offline'}" aria-hidden="true"></span>
        `;
        item.addEventListener('click', () => {
            openPrivateChat(u.username);
            showPanel('private');
        });
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openProfileViewer(u.username);
        });
        container.appendChild(item);
    }
}

async function ensureUserRecord() {
    const userRef = ref(db, `users/${currentUser}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
        await set(userRef, {
            username: currentUser,
            color: '#e91e63',
            joinDate: Date.now(),
            online: false
        });
    }
}

async function setupPresence() {
    const userRef = ref(db, `users/${currentUser}`);
    const onlineRef = ref(db, `users/${currentUser}/online`);
    const lastSeenRef = ref(db, `users/${currentUser}/lastSeen`);
    await update(userRef, { username: currentUser });

    await set(onlineRef, true);
    await set(lastSeenRef, Date.now());
    onDisconnect(onlineRef).set(false);
    onDisconnect(lastSeenRef).set(Date.now());
}

function wireTabs() {
    for (const btn of els.tabButtons) {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) showPanel(tab);
        });
    }
}

function wireComposerMenu() {
    if (!els.composerToggle || !els.composerMenu) return;

    const setOpen = (open) => {
        els.composerMenu.classList.toggle('open', open);
        els.composerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    els.composerToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const open = !els.composerMenu.classList.contains('open');
        setOpen(open);
    });

    document.addEventListener('click', (e) => {
        if (!els.composerMenu.classList.contains('open')) return;
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (els.composerMenu.contains(target) || els.composerToggle.contains(target)) return;
        setOpen(false);
    });

    els.composerMenu.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const menuItem = target.closest('[role="menuitem"]');
        if (menuItem) setOpen(false);
    });
}

function wireHeaderActions() {
    if (els.sessionUser) els.sessionUser.textContent = currentUser;
    if (els.logoutBtn) {
        els.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('dtubonge_session');
            window.location.href = 'login.html';
        });
    }
    if (els.modalLogout) {
        els.modalLogout.addEventListener('click', () => {
            localStorage.removeItem('dtubonge_session');
            window.location.href = 'login.html';
        });
    }
    if (els.reloadBtn) {
        els.reloadBtn.addEventListener('click', () => window.location.reload());
    }
    if (els.muteBtn) {
        els.muteBtn.addEventListener('click', () => setMuted(!state.muted));
        els.muteBtn.textContent = state.muted ? 'Unmute' : 'Mute';
    }
}

function renderMessage(container, msg, { isOwn, onSelectReply } = {}) {
    if (!container) return;
    const row = document.createElement('div');
    row.className = `message ${isOwn ? 'user-message' : 'other-message'}`;
    row.dataset.id = msg.id;

    const senderLine = `
        <div class="message-sender">
            ${escapeHtml(msg.displayName || msg.username || '')}
            <span class="message-time">${escapeHtml(formatTime(msg.timestamp || Date.now()))}</span>
        </div>
    `;

    const replyLine = msg.replyTo?.text
        ? `<div class="message-reply-ref">↪ ${escapeHtml(msg.replyTo.username || '')}: ${escapeHtml(msg.replyTo.text)}</div>`
        : '';

    let body = '';
    if (msg.type === 'image' && msg.imageUrl) {
        body = `
            <div class="message-text">${msg.text ? escapeHtml(msg.text) : ''}</div>
            <img class="message-image" src="${escapeHtml(msg.imageUrl)}" alt="Shared image">
        `;
    } else if (msg.type === 'voice' && msg.voiceUrl) {
        body = `
            <div class="message-text">${msg.text ? escapeHtml(msg.text) : ''}</div>
            <audio class="message-audio" controls src="${escapeHtml(msg.voiceUrl)}"></audio>
        `;
    } else {
        body = `<div class="message-text">${escapeHtml(msg.text || '')}</div>`;
    }

    row.innerHTML = `${senderLine}${replyLine}${body}`;
    row.addEventListener('click', () => {
        if (typeof onSelectReply === 'function') onSelectReply(msg);
    });
    container.appendChild(row);
}

function listenUsers() {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        state.usersByName.clear();
        let online = 0;
        snapshot.forEach(childSnap => {
            const user = childSnap.val();
            if (!user?.username) return;
            state.usersByName.set(user.username, user);
            if (user.online) online += 1;
        });

        if (els.onlineCount) els.onlineCount.textContent = `${online} online`;
        renderUsersList(els.userList, false);
        if (state.activeTab === 'users') renderUsersList(els.userListMobile, true);
    });
}

function listenGroupMessages() {
    const messagesRef = query(ref(db, 'messages'), limitToLast(200));
    onValue(messagesRef, (snapshot) => {
        if (!els.groupMessages) return;
        els.groupMessages.innerHTML = '';
        const messages = [];
        snapshot.forEach(s => {
            const msg = s.val();
            messages.push({ id: s.key, ...msg });
        });
        messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        for (const msg of messages) {
            renderMessage(els.groupMessages, msg, {
                isOwn: msg.username === currentUser,
                onSelectReply: (m) => setReply(m)
            });
        }
        if (els.groupEmpty) els.groupEmpty.style.display = messages.length ? 'none' : 'block';
        els.groupMessages.scrollTop = els.groupMessages.scrollHeight;
    });
}

async function sendGroupMessage(payload) {
    const text = String(payload?.text || '').trim();
    const now = Date.now();
    if (!text && !payload?.imageUrl && !payload?.voiceUrl) return;

    const user = state.usersByName.get(currentUser) || { username: currentUser };
    const msg = {
        username: currentUser,
        displayName: user.displayName || currentUser,
        color: user.color || '#e91e63',
        timestamp: now,
        text: text || '',
        type: payload?.type || 'text'
    };

    if (payload?.imageUrl) msg.imageUrl = payload.imageUrl;
    if (payload?.voiceUrl) msg.voiceUrl = payload.voiceUrl;
    if (state.reply?.id) {
        msg.replyTo = {
            id: state.reply.id,
            username: state.reply.username || '',
            text: state.reply.text ? String(state.reply.text).slice(0, 140) : ''
        };
    }

    await push(ref(db, 'messages'), msg);
}

async function ensureThreadMapping(threadId, otherUser) {
    await set(ref(db, `user_threads/${currentUser}/${threadId}`), otherUser);
    await set(ref(db, `user_threads/${otherUser}/${threadId}`), currentUser);
    state.userThreads.set(threadId, otherUser);
}

function listenThreads() {
    const threadsRef = ref(db, `user_threads/${currentUser}`);
    onValue(threadsRef, (snapshot) => {
        state.userThreads.clear();
        snapshot.forEach(s => {
            state.userThreads.set(s.key, s.val());
        });
        renderPrivateList();
        updatePrivateBadge();
    }, (error) => {
        console.error('Failed to read user thread mapping:', error);
    });

    const inferThreadFromRoot = (rootPath) => {
        const rootRef = ref(db, rootPath);
        onValue(rootRef, (snapshot) => {
            let changed = false;
            snapshot.forEach((chatSnap) => {
                const threadId = String(chatSnap.key || '');
                if (!threadId || state.userThreads.has(threadId)) return;
                let parts = threadId.split('__');
                if (parts.length !== 2) {
                    parts = threadId.split('_');
                }
                if (parts.length !== 2) return;
                const [a, b] = parts.map((p) => String(p || '').trim());
                if (!a || !b) return;
                if (a !== currentUser && b !== currentUser) return;
                const otherUser = a === currentUser ? b : a;
                if (!otherUser) return;
                state.userThreads.set(threadId, otherUser);
                changed = true;
            });
            if (changed) {
                renderPrivateList();
                updatePrivateBadge();
            }
        });
    };

    // Fallbacks for older/incomplete data where user_threads mapping is missing.
    inferThreadFromRoot('private_threads');
    inferThreadFromRoot('private_messages');
}

function renderPrivateList() {
    if (!els.privateList) return;
    els.privateList.innerHTML = '';
    const rows = Array.from(state.userThreads.entries()).map(([threadId, otherUser]) => {
        const other = state.usersByName.get(otherUser) || { username: otherUser };
        return { threadId, otherUser, other };
    }).sort((a, b) => String(a.otherUser).localeCompare(String(b.otherUser)));

    if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No private chats yet. Pick a user to start chatting.';
        els.privateList.appendChild(empty);
        return;
    }

    for (const row of rows) {
        const item = document.createElement('div');
        item.className = `private-item ${state.activeThreadId === row.threadId ? 'active' : ''}`;
        item.innerHTML = `
            ${avatarHtml(row.other, 28)}
            <div class="private-item-meta">
                <div class="private-item-name">${escapeHtml(row.other.displayName || row.otherUser)}</div>
                <div class="private-item-sub">${row.other.online ? 'Online' : 'Offline'}</div>
            </div>
            <span class="private-unread" data-thread="${escapeHtml(row.threadId)}"></span>
        `;
        item.addEventListener('click', () => openThread(row.threadId, row.otherUser));
        els.privateList.appendChild(item);
    }
}

function updatePrivateBadge() {
    if (!els.privateBadge) return;
    const total = Array.from(document.querySelectorAll('.private-unread.active')).reduce((acc, el) => {
        const n = Number(el.textContent || '0');
        return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    if (total > 0) {
        els.privateBadge.textContent = String(total);
        els.privateBadge.classList.add('active');
    } else {
        els.privateBadge.textContent = '';
        els.privateBadge.classList.remove('active');
    }
}

function listenUnreadCounts(threadId) {
    if (state.listenedUnread.has(threadId)) return;
    state.listenedUnread.add(threadId);
    const readsRef = ref(db, privateReadsPath(threadId, currentUser));
    const messagesRef = query(ref(db, privateMessagesPath(threadId)), limitToLast(200));

    let lastRead = 0;
    onValue(readsRef, (snap) => {
        lastRead = Number(snap.val() || 0);
    });

    onValue(messagesRef, (snap) => {
        let unread = 0;
        snap.forEach(s => {
            const msg = s.val();
            if (msg?.username && msg.username !== currentUser && (msg.timestamp || 0) > lastRead) unread += 1;
        });
        const el = document.querySelector(`.private-unread[data-thread="${CSS.escape(threadId)}"]`);
        if (el) {
            if (unread > 0) {
                el.textContent = String(unread);
                el.classList.add('active');
            } else {
                el.textContent = '';
                el.classList.remove('active');
            }
        }
        updatePrivateBadge();
    });
}

function listenAllUnreadCounts() {
    for (const [threadId] of state.userThreads.entries()) {
        listenUnreadCounts(threadId);
    }
}

let unsubPrivateMessages = [];

function openThread(threadId, otherUser) {
    state.activeThreadId = threadId;
    state.activeOtherUser = otherUser;
    showPanel('private');
    setPrivateThreadOpen(true);
    renderPrivateList();
    if (els.privateTitle) {
        const other = state.usersByName.get(otherUser);
        els.privateTitle.textContent = other?.displayName || otherUser || 'Chat';
    }
    clearReply();

    if (Array.isArray(unsubPrivateMessages)) {
        unsubPrivateMessages.forEach((fn) => {
            if (typeof fn === 'function') fn();
        });
    }
    unsubPrivateMessages = [];

    const candidates = resolveThreadCandidates(threadId, otherUser);
    const mergeKeySet = new Set();
    const messageBuckets = new Map();
    const renderMergedMessages = () => {
        if (!els.privateMessages) return;
        const messages = Array.from(messageBuckets.values());
        messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        els.privateMessages.innerHTML = '';
        for (const msg of messages) {
            renderMessage(els.privateMessages, msg, {
                isOwn: msg.username === currentUser,
                onSelectReply: (m) => setReply(m)
            });
        }
        if (els.privateEmpty) els.privateEmpty.style.display = messages.length ? 'none' : 'block';
        els.privateMessages.scrollTop = els.privateMessages.scrollHeight;
    };

    for (const candidateId of candidates) {
        const sources = [
            query(ref(db, privateMessagesPath(candidateId)), limitToLast(250)),
            query(ref(db, privateMessagesLegacyPath(candidateId)), limitToLast(250))
        ];
        for (const source of sources) {
            const unsub = onValue(source, (snapshot) => {
                snapshot.forEach((s) => {
                    const msg = { id: s.key, ...s.val() };
                    const key = `${candidateId}:${s.key}`;
                    mergeKeySet.add(key);
                    messageBuckets.set(key, msg);
                });
                renderMergedMessages();
            });
            unsubPrivateMessages.push(unsub);
        }

        set(ref(db, privateReadsPath(candidateId, currentUser)), Date.now()).catch((e) => {
            console.warn('Could not update private read receipt:', e);
        });
    }
}

async function openPrivateChat(otherUser) {
    const other = String(otherUser).trim();
    if (!other || other === currentUser) return;
    const variants = threadIdVariants(currentUser, other);
    const existing = variants.find((id) => state.userThreads.has(id));
    const threadId = existing || variants[0];
    try {
        await ensureThreadMapping(threadId, other);
    } catch (e) {
        console.warn('Could not write user_threads mapping, continuing:', e);
    }
    try {
        await update(ref(db, `private_threads/${threadId}`), {
            updatedAt: Date.now(),
            participants: { [currentUser]: true, [other]: true }
        });
    } catch (e) {
        console.warn('Could not write private_threads metadata, continuing:', e);
    }
    openThread(threadId, other);
}

async function sendPrivateMessage(payload) {
    if (!state.activeThreadId || !state.activeOtherUser) {
        toast('Pick a user to start a private chat.');
        showPanel('users');
        return;
    }

    const text = String(payload?.text || '').trim();
    const now = Date.now();
    if (!text && !payload?.imageUrl && !payload?.voiceUrl) return;

    const user = state.usersByName.get(currentUser) || { username: currentUser };
    const msg = {
        username: currentUser,
        displayName: user.displayName || currentUser,
        color: user.color || '#e91e63',
        timestamp: now,
        text: text || '',
        type: payload?.type || 'text'
    };

    if (payload?.imageUrl) msg.imageUrl = payload.imageUrl;
    if (payload?.voiceUrl) msg.voiceUrl = payload.voiceUrl;
    if (state.reply?.id) {
        msg.replyTo = {
            id: state.reply.id,
            username: state.reply.username || '',
            text: state.reply.text ? String(state.reply.text).slice(0, 140) : ''
        };
    }

    const candidateIds = resolveThreadCandidates(state.activeThreadId, state.activeOtherUser);
    const pathAttempts = [];
    for (const id of candidateIds) {
        pathAttempts.push(privateMessagesPath(id));
        pathAttempts.push(privateMessagesLegacyPath(id));
    }
    let sentOnThreadId = null;
    let lastError = null;

    for (const path of pathAttempts) {
        try {
            await push(ref(db, path), msg);
            const pieces = String(path).split('/');
            sentOnThreadId = pieces[1] || state.activeThreadId;
            break;
        } catch (e) {
            lastError = e;
            console.warn('Private message path failed:', path, e);
        }
    }

    if (!sentOnThreadId) {
        throw lastError || new Error('Private message send failed on all paths.');
    }

    if (sentOnThreadId !== state.activeThreadId) {
        state.activeThreadId = sentOnThreadId;
    }

    try {
        await update(ref(db, `private_threads/${state.activeThreadId}`), { updatedAt: now });
    } catch (e) {
        console.warn('Could not update private thread metadata:', e);
    }
}

function activeScope() {
    return state.activeTab === 'private' ? 'private' : 'group';
}

async function handleSend() {
    const text = String(els.messageInput?.value || '').trim();
    if (!text) return;
    if (els.messageInput) els.messageInput.value = '';
    const scope = activeScope();
    try {
        if (scope === 'private') await sendPrivateMessage({ text, type: 'text' });
        else await sendGroupMessage({ text, type: 'text' });
        clearReply();
    } catch (e) {
        console.error(e);
        toast('Failed to send message. Check connection / rules.');
    }
}

function wireComposer() {
    if (els.sendBtn) els.sendBtn.addEventListener('click', handleSend);
    if (els.messageInput) {
        els.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }

    if (els.cancelReply) els.cancelReply.addEventListener('click', clearReply);

    if (els.attachBtn && els.imageInput) {
        els.attachBtn.addEventListener('click', () => els.imageInput.click());
        els.imageInput.addEventListener('change', async () => {
            const file = els.imageInput.files?.[0];
            if (!file) return;
            els.imageInput.value = '';
            await uploadImageAndSend(file);
        });
    }

    if (els.stickerBtn && els.stickerPanel) {
        els.stickerBtn.addEventListener('click', () => {
            els.stickerPanel.classList.toggle('active');
        });
        renderStickers();
    }

    if (els.voiceBtn) {
        els.voiceBtn.addEventListener('click', () => toggleRecording());
    }
}

async function uploadImageAndSend(file) {
    const scope = activeScope();
    const path = scope === 'private'
        ? `uploads/private/${state.activeThreadId || 'unknown'}/${Date.now()}_${file.name}`
        : `uploads/group/${Date.now()}_${file.name}`;

    if (els.uploadStatus) els.uploadStatus.classList.add('active');
    if (els.uploadLabel) els.uploadLabel.textContent = `Uploading ${file.name}...`;
    if (els.uploadBarFill) els.uploadBarFill.style.width = '0%';

    const task = uploadBytesResumable(sRef(storage, path), file);
    const url = await new Promise((resolve, reject) => {
        task.on('state_changed', (snap) => {
            const pct = snap.totalBytes ? (snap.bytesTransferred / snap.totalBytes) * 100 : 0;
            if (els.uploadBarFill) els.uploadBarFill.style.width = `${pct.toFixed(1)}%`;
        }, reject, async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
        });
    });

    if (els.uploadLabel) els.uploadLabel.textContent = 'Upload complete.';
    if (els.uploadBarFill) els.uploadBarFill.style.width = '100%';
    setTimeout(() => {
        if (els.uploadStatus) els.uploadStatus.classList.remove('active');
    }, 1000);

    if (scope === 'private') await sendPrivateMessage({ type: 'image', imageUrl: url });
    else await sendGroupMessage({ type: 'image', imageUrl: url });
}

function renderStickers() {
    if (!els.stickerPanel) return;
    const stickers = ['👍', '😂', '🔥', '❤️', '😎', '🎉', '🙌', '😅', '😮', '😢', '🤝', '💯'];
    els.stickerPanel.innerHTML = '';
    for (const s of stickers) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sticker';
        btn.textContent = s;
        btn.addEventListener('click', () => {
            if (!els.messageInput) return;
            els.messageInput.value = (els.messageInput.value || '') + s;
            els.messageInput.focus();
        });
        els.stickerPanel.appendChild(btn);
    }
}

let recorder = null;
let recordingStart = 0;
let recordingTimerId = null;

function setRecordingUi(active) {
    if (els.recordingIndicator) els.recordingIndicator.classList.toggle('active', active);
    if (els.voiceBtn) els.voiceBtn.classList.toggle('active', active);
    if (els.voiceBtn) els.voiceBtn.title = active ? 'Stop recording' : 'Record voice';
}

function updateRecordingTimer() {
    if (!els.recordingTimer) return;
    const elapsed = Math.max(0, Date.now() - recordingStart);
    const seconds = Math.floor(elapsed / 1000);
    const mm = Math.floor(seconds / 60);
    const ss = String(seconds % 60).padStart(2, '0');
    els.recordingTimer.textContent = `${mm}:${ss}`;
}

async function toggleRecording() {
    if (recorder && recorder.state === 'recording') {
        recorder.stop();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        toast('Voice recording not supported on this browser.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
            if (e.data?.size) chunks.push(e.data);
        };
        recorder.onstop = async () => {
            try {
                setRecordingUi(false);
                if (recordingTimerId) clearInterval(recordingTimerId);
                recordingTimerId = null;
                updateRecordingTimer();

                stream.getTracks().forEach(t => t.stop());

                const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
                if (blob.size < 1000) return;

                const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type });
                await uploadVoiceAndSend(file);
            } catch (e) {
                console.error(e);
                toast('Failed to send voice message.');
            }
        };

        recordingStart = Date.now();
        updateRecordingTimer();
        recordingTimerId = setInterval(() => {
            updateRecordingTimer();
            if (Date.now() - recordingStart >= 15000) recorder.stop();
        }, 250);

        setRecordingUi(true);
        recorder.start();
    } catch (e) {
        console.error(e);
        toast('Microphone permission denied.');
    }
}

async function uploadVoiceAndSend(file) {
    const scope = activeScope();
    const path = scope === 'private'
        ? `voices/private/${state.activeThreadId || 'unknown'}/${Date.now()}_${file.name}`
        : `voices/group/${Date.now()}_${file.name}`;

    const task = uploadBytesResumable(sRef(storage, path), file);
    const url = await new Promise((resolve, reject) => {
        task.on('state_changed', null, reject, async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
        });
    });

    if (scope === 'private') await sendPrivateMessage({ type: 'voice', voiceUrl: url });
    else await sendGroupMessage({ type: 'voice', voiceUrl: url });
}

function wirePrivateBack() {
    if (!els.privateBack) return;
    els.privateBack.addEventListener('click', () => {
        setPrivateThreadOpen(false);
    });
}

function openModal(modal, open) {
    if (!modal) return;
    modal.classList.toggle('active', Boolean(open));
}

function wireProfileModal() {
    if (els.profileBtn) els.profileBtn.addEventListener('click', () => openModal(els.profileModal, true));
    if (els.closeProfile) els.closeProfile.addEventListener('click', () => openModal(els.profileModal, false));
    if (els.cancelProfile) els.cancelProfile.addEventListener('click', () => openModal(els.profileModal, false));
    if (els.modalRefresh) els.modalRefresh.addEventListener('click', () => window.location.reload());

    if (els.saveProfile) {
        els.saveProfile.addEventListener('click', async () => {
            const displayName = String(els.profileDisplay?.value || '').trim().slice(0, 24);
            const bio = String(els.profileBio?.value || '').trim().slice(0, 120);
            const avatar = Number(document.querySelector('.avatar-choice.active')?.dataset?.avatar || '0');
            const color = colorForAvatar(avatar);
            try {
                await update(ref(db, `users/${currentUser}`), {
                    displayName: displayName || null,
                    bio: bio || null,
                    avatar: Number.isFinite(avatar) ? avatar : 0,
                    color
                });
                openModal(els.profileModal, false);
                toast('Profile saved.');
            } catch (e) {
                console.error(e);
                toast('Failed to save profile.');
            }
        });
    }
}

function colorForAvatar(i) {
    const palette = ['#e91e63', '#7c3aed', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7'];
    return palette[Math.abs(Number(i) || 0) % palette.length];
}

function renderAvatarGrid(selected = 0) {
    if (!els.avatarGrid) return;
    els.avatarGrid.innerHTML = '';
    for (let i = 0; i < 12; i += 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `avatar-choice ${i === selected ? 'active' : ''}`;
        btn.dataset.avatar = String(i);
        btn.style.background = colorForAvatar(i);
        btn.textContent = avatarIcon(i);
        btn.addEventListener('click', () => {
            for (const el of document.querySelectorAll('.avatar-choice')) el.classList.remove('active');
            btn.classList.add('active');
        });
        els.avatarGrid.appendChild(btn);
    }
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dtubonge_theme', theme);
}

function wireThemes() {
    const themes = [
        { key: 'rose', label: 'Rose' },
        { key: 'ocean', label: 'Ocean' },
        { key: 'mint', label: 'Mint' },
        { key: 'amber', label: 'Amber' },
        { key: 'violet', label: 'Violet' }
    ];

    const setActiveChip = (themeKey) => {
        if (!els.themeOptions) return;
        for (const el of els.themeOptions.querySelectorAll('.theme-chip')) {
            el.classList.toggle('active', el.dataset.theme === themeKey);
        }
    };

    if (els.themeReset) {
        els.themeReset.addEventListener('click', () => {
            applyTheme('rose');
            setActiveChip('rose');
            toast('Theme reset: Default');
        });
    }
    if (!els.themeOptions) return;
    els.themeOptions.innerHTML = '';
    const savedTheme = localStorage.getItem('dtubonge_theme') || document.documentElement.dataset.theme || 'rose';
    for (const t of themes) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `theme-chip ${t.key === savedTheme ? 'active' : ''}`;
        btn.dataset.theme = t.key;
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
            applyTheme(t.key);
            setActiveChip(t.key);
            toast(`Theme set: ${t.label}`);
        });
        els.themeOptions.appendChild(btn);
    }
}

function openProfileViewer(username) {
    const user = state.usersByName.get(username);
    if (!user || !els.viewProfileModal) return;
    if (els.viewProfileName) els.viewProfileName.textContent = user.displayName || user.username;
    if (els.viewProfileBio) els.viewProfileBio.textContent = user.bio || '';
    if (els.viewProfileStatus) els.viewProfileStatus.textContent = user.online ? 'Online' : 'Offline';
    if (els.viewProfileJoin) els.viewProfileJoin.textContent = user.joinDate ? new Date(user.joinDate).toLocaleDateString() : '';
    if (els.viewProfileAvatar) {
        els.viewProfileAvatar.innerHTML = avatarHtml(user, 72);
    }
    openModal(els.viewProfileModal, true);
}

function wireProfileViewer() {
    if (els.closeViewProfile) els.closeViewProfile.addEventListener('click', () => openModal(els.viewProfileModal, false));
    if (els.viewProfileModal) {
        els.viewProfileModal.addEventListener('click', (e) => {
            if (e.target === els.viewProfileModal) openModal(els.viewProfileModal, false);
        });
    }
}

function wireNotifications() {
    if (els.clearNotificationsBtn) {
        els.clearNotificationsBtn.addEventListener('click', () => {
            state.notifications = [];
            renderNotificationCenter();
            toast('Notifications cleared.');
        });
    }
}

function wireSearch() {
    if (!els.globalSearch || !els.searchResults) return;
    let searchTimer = null;
    els.globalSearch.addEventListener('input', () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            renderSearch(els.globalSearch.value);
        }, 120);
    });
}

function renderSearch(term) {
    if (!els.searchResults) return;
    const q = String(term || '').trim().toLowerCase();
    els.searchResults.innerHTML = '';
    if (!q) return;

    const users = Array.from(state.usersByName.values())
        .filter(u => u.username !== currentUser)
        .filter(u => String(u.username).toLowerCase().includes(q) || String(u.displayName || '').toLowerCase().includes(q))
        .slice(0, 8);

    if (users.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-row empty';
        empty.textContent = 'No matches.';
        els.searchResults.appendChild(empty);
        return;
    }

    for (const u of users) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'search-row';
        row.innerHTML = `
            ${avatarHtml(u, 24)}
            <span>${escapeHtml(u.displayName || u.username)}</span>
        `;
        row.addEventListener('click', () => {
            els.globalSearch.value = '';
            els.searchResults.innerHTML = '';
            openPrivateChat(u.username);
            showPanel('private');
        });
        els.searchResults.appendChild(row);
    }
}

async function boot() {
    wireTabs();
    wireComposerMenu();
    wireHeaderActions();
    wireComposer();
    wirePrivateBack();
    wireProfileModal();
    wireProfileViewer();
    wireThemes();
    wireNotifications();
    wireSearch();
    setMuted(state.muted);

    await ensureUserRecord();
    await setupPresence();

    listenUsers();
    listenGroupMessages();
    listenThreads();

    const meRef = ref(db, `users/${currentUser}`);
    onValue(meRef, (snap) => {
        const me = snap.val() || {};
        if (els.profileDisplay) els.profileDisplay.value = me.displayName || '';
        if (els.profileBio) els.profileBio.value = me.bio || '';
        renderAvatarGrid(Number(me.avatar || 0));
        if (els.headerAvatar) {
            const color = me.color || '#e91e63';
            els.headerAvatar.style.background = `linear-gradient(135deg, ${color}, var(--accent-strong))`;
            els.headerAvatar.textContent = avatarIcon(me.avatar);
        }
    });

    onValue(ref(db, `user_threads/${currentUser}`), () => {
        listenAllUnreadCounts();
    });

    showPanel('group');
    renderNotificationCenter();
}

boot().catch((e) => {
    console.error(e);
    toast('Chat failed to start. Check Firebase rules / config.');
});
