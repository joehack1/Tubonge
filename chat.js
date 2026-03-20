import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onDisconnect, remove, limitToLast, query, update, get, child } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

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

if (!sessionRaw) {
    window.location.href = 'login.html';
}

const session = sessionRaw ? JSON.parse(sessionRaw) : null;
const currentUser = session?.username;

const logoutBtn = document.getElementById('logout-btn');
const sessionUser = document.getElementById('session-user');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const imageBtn = document.getElementById('image-btn');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');
const voiceBtn = document.getElementById('voice-btn');
const stickerBtn = document.getElementById('sticker-btn');
const stickerPanel = document.getElementById('sticker-panel');
const groupMessages = document.getElementById('group-messages');
const privateMessages = document.getElementById('private-messages');
const groupEmpty = document.getElementById('group-empty');
const privateEmpty = document.getElementById('private-empty');
const privateList = document.getElementById('private-list');
const userList = document.getElementById('user-list');
const userListMobile = document.getElementById('user-list-mobile');
const onlineCount = document.getElementById('online-count');
const replyPreview = document.getElementById('reply-preview');
const replyText = document.getElementById('reply-text');
const clearReplyBtn = document.getElementById('clear-reply');
const uploadStatus = document.getElementById('upload-status');
const uploadLabel = document.getElementById('upload-label');
const uploadBarFill = document.getElementById('upload-bar-fill');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingTimer = document.getElementById('recording-timer');
const profileBtn = document.getElementById('profile-btn');
const privateBadge = document.getElementById('private-badge');
const profileModal = document.getElementById('profile-modal');
const profileDisplay = document.getElementById('profile-display');
const profileBio = document.getElementById('profile-bio');
const avatarGrid = document.getElementById('avatar-grid');
const themeOptions = document.getElementById('theme-options');
const themeResetBtn = document.getElementById('theme-reset');
const closeProfileBtn = document.getElementById('close-profile');
const cancelProfileBtn = document.getElementById('cancel-profile');
const saveProfileBtn = document.getElementById('save-profile');
const modalLogoutBtn = document.getElementById('modal-logout-btn');
const modalRefreshBtn = document.getElementById('modal-refresh-btn');
const headerAvatar = document.getElementById('header-avatar');
const viewProfileModal = document.getElementById('view-profile-modal');
const closeViewProfileBtn = document.getElementById('close-view-profile');
const viewProfileAvatar = document.getElementById('view-profile-avatar');
const viewProfileName = document.getElementById('view-profile-name');
const viewProfileBio = document.getElementById('view-profile-bio');
const viewProfileStatus = document.getElementById('view-profile-status');
const viewProfileJoin = document.getElementById('view-profile-join');
const reloadBtn = document.getElementById('reload-btn');
const privateBackBtn = document.getElementById('private-back');
const notificationStack = document.getElementById('notification-stack');
// Market elements
const marketGrid = document.getElementById('market-grid');
const marketEmpty = document.getElementById('market-empty');
const marketSearch = document.getElementById('market-search');
const addProductBtn = document.getElementById('add-product-btn');
const productCategoryInput = document.getElementById('product-category');
const marketCategoryFilter = document.getElementById('market-category-filter');
const openCartBtn = document.getElementById('open-cart-btn');
const cartCount = document.getElementById('cart-count');
const addModal = document.getElementById('market-add-modal');
const closeAddProduct = document.getElementById('close-add-product');
const cancelAddProduct = document.getElementById('cancel-add-product');
const saveProductBtn = document.getElementById('save-product-btn');
const chooseProductImage = document.getElementById('choose-product-image');
const productImageInput = document.getElementById('product-image-input');
const productTitleInput = document.getElementById('product-title');
const productPriceInput = document.getElementById('product-price');
const productDescInput = document.getElementById('product-description');
const viewModal = document.getElementById('market-view-modal');
const closeViewProduct = document.getElementById('close-view-product');
const viewProductTitle = document.getElementById('view-product-title');
const viewProductImage = document.getElementById('view-product-image');
const viewProductPrice = document.getElementById('view-product-price');
const viewProductDesc = document.getElementById('view-product-desc');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const contactSellerBtn = document.getElementById('contact-seller-btn');
const viewProductSeller = document.getElementById('view-product-seller');
const cartModal = document.getElementById('market-cart-modal');
const closeCartBtn = document.getElementById('close-cart');
const cartList = document.getElementById('cart-list');
const cartTotalEl = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const orderHistory = document.getElementById('order-history');
const globalSearch = document.getElementById('global-search');
const searchResults = document.getElementById('search-results');
const groupPinned = document.getElementById('group-pinned');
const privatePinned = document.getElementById('private-pinned');
const groupUnpinBtn = document.getElementById('group-unpin-btn');
const privateUnpinBtn = document.getElementById('private-unpin-btn');
const groupTyping = document.getElementById('group-typing');
const privateTyping = document.getElementById('private-typing');
const groupLoadOlderBtn = document.getElementById('group-load-older');
const privateLoadOlderBtn = document.getElementById('private-load-older');
const channelSelect = document.getElementById('channel-select');
const createChannelBtn = document.getElementById('create-channel-btn');
const muteChatBtn = document.getElementById('mute-chat-btn');
const notificationCenterList = document.getElementById('notification-center-list');
const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
const storySeenList = document.getElementById('story-seen-list');

let allProducts = {};
let filteredProducts = [];
let viewingProduct = null;
let mutedKeys = {};
let groupLimit = 200;
let privateLimit = 200;
let currentChannel = 'general';
let channelCatalog = { general: { name: 'general', createdAt: Date.now(), createdBy: 'system' } };
let typingStopTimer = null;
let groupTypingUnsub = null;
let privateTypingUnsub = null;
let currentGroupMessages = [];
let privateMessagesCache = {};
let queuedMessages = [];
let isFlushingQueue = false;
let pendingReactionMessageId = null;
let storyPaused = false;
let storyProgressInterval = null;
let storyStartTime = 0;
let storyDuration = 0;
let currentStoryProgress = 0;
const privateChatTitle = document.getElementById('private-chat-title');

let currentTab = 'group';
let selectedPrivateId = null;
let selectedPrivateName = null;
let replyContext = null;
let onlineUsers = {};
let userProfiles = {};
let selectedAvatarUrl = null;
let mediaRecorder = null;
let recordingTimeout = null;
let recordingInterval = null;
let currentPrivateMessages = [];
let currentPrivateRead = {};
let privateReadUnsub = null;
const MAX_MEDIA_BYTES = 10_000_000;
const USER_COLORS = ['#e91e63', '#00bcd4', '#3b82f6', '#10b981', '#f97316', '#a855f7', '#facc15'];
const DEFAULT_AVATARS = [
    'https://api.dicebear.com/9.x/avataaars/png?seed=Azuri&size=128',
    'https://api.dicebear.com/9.x/avataaars/png?seed=Kairo&size=128',
    'https://api.dicebear.com/9.x/avataaars/png?seed=Nala&size=128',
    'https://api.dicebear.com/9.x/avataaars/png?seed=Zuri&size=128',
    'https://api.dicebear.com/9.x/adventurer/png?seed=Kimo&size=128',
    'https://api.dicebear.com/9.x/adventurer/png?seed=Lina&size=128',
    'https://api.dicebear.com/9.x/adventurer/png?seed=Ony&size=128',
    'https://api.dicebear.com/9.x/adventurer/png?seed=Vee&size=128',
    'https://api.dicebear.com/9.x/croodles/png?seed=Rex&size=128',
    'https://api.dicebear.com/9.x/croodles/png?seed=Zed&size=128',
    'https://api.dicebear.com/9.x/croodles/png?seed=Tani&size=128',
    'https://api.dicebear.com/9.x/croodles/png?seed=Miko&size=128',
    'https://api.dicebear.com/9.x/lorelei/png?seed=Aria&size=128',
    'https://api.dicebear.com/9.x/lorelei/png?seed=Nova&size=128',
    'https://api.dicebear.com/9.x/lorelei/png?seed=Zane&size=128',
    'https://api.dicebear.com/9.x/lorelei/png?seed=Koda&size=128',
    'https://api.dicebear.com/9.x/micah/png?seed=Jade&size=128',
    'https://api.dicebear.com/9.x/micah/png?seed=Rio&size=128',
    'https://api.dicebear.com/9.x/micah/png?seed=Faye&size=128',
    'https://api.dicebear.com/9.x/micah/png?seed=Omar&size=128',
    'https://api.dicebear.com/9.x/pixel-art/png?seed=Zaza&size=128',
    'https://api.dicebear.com/9.x/pixel-art/png?seed=Mara&size=128',
    'https://api.dicebear.com/9.x/pixel-art/png?seed=Rune&size=128',
    'https://api.dicebear.com/9.x/pixel-art/png?seed=Kiki&size=128',
    'https://api.dicebear.com/9.x/bottts/png?seed=BotA&size=128',
    'https://api.dicebear.com/9.x/bottts/png?seed=BotB&size=128',
    'https://api.dicebear.com/9.x/bottts/png?seed=BotC&size=128',
    'https://api.dicebear.com/9.x/bottts/png?seed=BotD&size=128',
    'https://api.dicebear.com/9.x/fun-emoji/png?seed=Hype&size=128',
    'https://api.dicebear.com/9.x/fun-emoji/png?seed=Smirk&size=128'
];
const DEFAULT_STICKERS = ['😀', '😂', '😍', '🥳', '😎', '🤯', '😭', '🙏', '🔥', '💯', '🎉', '❤️', '👍', '🙌', '🤝', '🤖'];
const THEME_STORAGE_KEY = 'dtubonge_theme';
const THEMES = [
    { key: 'rose', label: 'Rose', swatch: 'linear-gradient(135deg, #e91e63, #ff69b4)' },
    { key: 'teal', label: 'Teal', swatch: 'linear-gradient(135deg, #00bcd4, #3ddbd9)' },
    { key: 'blue', label: 'Blue', swatch: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { key: 'green', label: 'Green', swatch: 'linear-gradient(135deg, #10b981, #34d399)' },
    { key: 'orange', label: 'Orange', swatch: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { key: 'purple', label: 'Purple', swatch: 'linear-gradient(135deg, #a855f7, #c084fc)' },
    { key: 'gold', label: 'Gold', swatch: 'linear-gradient(135deg, #eab308, #facc15)' },
    { key: 'rainbow', label: 'Rainbow', swatch: 'linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)' },
    { key: 'whatsapp', label: 'WhatsApp', swatch: 'linear-gradient(135deg, #075e54, #128c7e, #25d366)' },
    { key: 'instagram', label: 'Instagram', swatch: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)' }
];

const tabs = document.querySelectorAll('.chat-tabs .tab-btn');
const panels = {
    group: document.getElementById('panel-group'),
    private: document.getElementById('panel-private'),
    status: document.getElementById('panel-status'),
    notifications: document.getElementById('panel-notifications'),
    market: document.getElementById('panel-market'),
    users: document.getElementById('panel-users')
};
const privateLayout = document.querySelector('#panel-private .private-layout');
const statusList = document.getElementById('status-list');
const statusEmpty = document.getElementById('status-empty');
const addStoryBtn = document.getElementById('add-story-btn');
const storyInput = document.getElementById('story-input');
const myStatusAvatar = document.getElementById('my-status-avatar');
const storyViewerModal = document.getElementById('story-viewer-modal');
const storyMedia = document.getElementById('story-media');
const storyPrev = document.getElementById('story-prev');
const storyNext = document.getElementById('story-next');
const closeStoryViewerBtn = document.getElementById('close-story-viewer');
const storyViewerName = document.getElementById('story-viewer-name');
const storyDeleteBtn = document.getElementById('story-delete');
const storyProgress = document.getElementById('story-progress');
const storyViewerAvatar = document.getElementById('story-viewer-avatar');
const myStatusEl = document.querySelector('.my-status');
const addTextStatusBtn = document.getElementById('add-text-status-btn');
const textStatusInput = document.getElementById('text-status-input');
const recordVoiceStatusBtn = document.getElementById('record-voice-status-btn');
let statusRecorder = null;
let statusRecordingTimeout = null;

let storiesByUser = {};
let storyUsers = [];
let viewerUser = null;
let viewerStories = [];
let viewerIndex = 0;
let viewerTimer = null;
let soundContext = null;
let groupAlertsPrimed = false;
const groupAlertState = { lastId: null, lastTimestamp: 0 };
const privateAlertState = new Map();
let privateAlertsPrimed = false;
let notificationPermissionRequested = false;
let appNotifications = [];
const PUSH_CHANNEL_ID = 'tubonge_messages';
const PUSH_USER_STORAGE_KEY = 'dtubonge_push_user';
const PUSH_INSTALLATION_STORAGE_KEY = 'dtubonge_push_installation';
const nativePushState = {
    initialized: false,
    installationId: null,
    token: null
};
const QUEUED_MESSAGES_STORAGE_KEY = 'dtubonge_offline_queue';
const MUTED_STORAGE_KEY = 'dtubonge_muted_chats';
const APP_NOTIFICATIONS_STORAGE_KEY = 'dtubonge_notifications';

if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
        window.location.reload();
    });
}

function updateViewportHeight() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
    const keyboardInset = window.visualViewport
        ? Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop)
        : 0;
    document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
    document.body.classList.toggle('keyboard-open', keyboardInset > 0);
    if (document.activeElement === messageInput) {
        requestAnimationFrame(() => {
            messageInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
    }
}

updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportHeight);
    window.visualViewport.addEventListener('scroll', updateViewportHeight);
}

messageInput.addEventListener('focus', () => {
    setTimeout(() => {
        messageInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
});

function getSoundContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!soundContext) {
        soundContext = new Context();
    }
    if (soundContext.state === 'suspended') {
        soundContext.resume().catch(() => {});
    }
    return soundContext;
}

function primeRealtimeFeedback() {
    getSoundContext();
    if (!notificationPermissionRequested && 'Notification' in window && Notification.permission === 'default') {
        notificationPermissionRequested = true;
        Notification.requestPermission().catch(() => {});
    }
}

['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, primeRealtimeFeedback, { once: true });
});

function playToneSequence(sequence) {
    const context = getSoundContext();
    if (!context) return;
    const baseTime = context.currentTime + 0.01;
    sequence.forEach((tone) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startAt = baseTime + tone.offset;

        oscillator.type = tone.type || 'sine';
        oscillator.frequency.setValueAtTime(tone.frequency, startAt);

        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(tone.gain || 0.035, startAt + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.duration);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(startAt);
        oscillator.stop(startAt + tone.duration + 0.02);
    });
}

function playAppSound(kind) {
    const patterns = {
        sent: [
            { frequency: 860, offset: 0, duration: 0.08, gain: 0.025, type: 'triangle' },
            { frequency: 1120, offset: 0.08, duration: 0.06, gain: 0.018, type: 'triangle' }
        ],
        received: [
            { frequency: 560, offset: 0, duration: 0.12, gain: 0.03, type: 'sine' },
            { frequency: 760, offset: 0.13, duration: 0.11, gain: 0.024, type: 'sine' }
        ],
        notification: [
            { frequency: 520, offset: 0, duration: 0.12, gain: 0.035, type: 'triangle' },
            { frequency: 660, offset: 0.15, duration: 0.12, gain: 0.03, type: 'triangle' },
            { frequency: 820, offset: 0.3, duration: 0.1, gain: 0.022, type: 'triangle' }
        ]
    };

    if (!patterns[kind]) return;
    playToneSequence(patterns[kind]);
}

function truncatePreview(text, maxLength = 90) {
    if (!text) return 'New message';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}...`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return entities[character];
    });
}

loadPersistedClientState();
renderNotificationCenter();

function normalizeChannelName(value) {
    const raw = String(value || '').trim().toLowerCase();
    const cleaned = raw.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return cleaned || 'general';
}

function getCurrentScopeKey() {
    if (currentTab === 'private' && selectedPrivateId) {
        return `private:${selectedPrivateId}`;
    }
    return `group:${currentChannel}`;
}

function getGroupMessagesRef(channelId = currentChannel) {
    const normalized = normalizeChannelName(channelId);
    if (normalized === 'general') {
        return ref(db, 'messages');
    }
    return ref(db, `channels/${normalized}/messages`);
}

function loadPersistedClientState() {
    try {
        mutedKeys = JSON.parse(localStorage.getItem(MUTED_STORAGE_KEY) || '{}') || {};
    } catch {
        mutedKeys = {};
    }
    try {
        queuedMessages = JSON.parse(localStorage.getItem(QUEUED_MESSAGES_STORAGE_KEY) || '[]') || [];
    } catch {
        queuedMessages = [];
    }
    try {
        appNotifications = JSON.parse(localStorage.getItem(APP_NOTIFICATIONS_STORAGE_KEY) || '[]') || [];
    } catch {
        appNotifications = [];
    }
}

function persistClientState() {
    localStorage.setItem(MUTED_STORAGE_KEY, JSON.stringify(mutedKeys));
    localStorage.setItem(QUEUED_MESSAGES_STORAGE_KEY, JSON.stringify(queuedMessages.slice(-300)));
    localStorage.setItem(APP_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(appNotifications.slice(-300)));
}

function registerAppNotification(item) {
    if (!item) return;
    appNotifications.unshift({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        ...item
    });
    appNotifications = appNotifications.slice(0, 300);
    persistClientState();
    renderNotificationCenter();
}

function renderNotificationCenter() {
    if (!notificationCenterList) return;
    notificationCenterList.innerHTML = '';
    if (!appNotifications.length) {
        notificationCenterList.innerHTML = '<div class="empty-state">No notifications yet.</div>';
        return;
    }
    appNotifications.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'notification';
        const title = document.createElement('div');
        title.className = 'notification-title';
        title.textContent = item.title || 'Notification';
        const body = document.createElement('div');
        body.className = 'notification-body';
        body.textContent = item.body || '';
        const meta = document.createElement('div');
        meta.className = 'message-time';
        meta.textContent = new Date(item.timestamp).toLocaleString();
        row.appendChild(title);
        row.appendChild(body);
        row.appendChild(meta);
        row.addEventListener('click', () => {
            if (item.scope === 'private' && item.sender) {
                selectPrivateUser(item.sender);
                document.querySelector('[data-tab="private"]')?.click();
            } else if (item.scope === 'group') {
                document.querySelector('[data-tab="group"]')?.click();
            }
        });
        notificationCenterList.appendChild(row);
    });
}

function getMessagePreview(message) {
    if (!message) return 'New message';
    if (message.type === 'text') {
        return message.text || 'New message';
    }
    if (message.type === 'image') {
        return 'sent a photo';
    }
    if (message.type === 'video') {
        return 'sent a video';
    }
    if (message.type === 'voice') {
        return 'sent a voice message';
    }
    if (message.type === 'file') {
        return message.fileName ? `shared ${message.fileName}` : 'shared a file';
    }
    if (message.type === 'sticker') {
        return message.sticker ? `sent a sticker ${message.sticker}` : 'sent a sticker';
    }
    return 'sent a new message';
}

function showInAppNotification(title, body) {
    if (!notificationStack) return;

    const toast = document.createElement('div');
    toast.className = 'notification';
    const titleEl = document.createElement('div');
    titleEl.className = 'notification-title';
    titleEl.textContent = title;

    const bodyEl = document.createElement('div');
    bodyEl.className = 'notification-body';
    bodyEl.textContent = body;

    toast.appendChild(titleEl);
    toast.appendChild(bodyEl);

    toast.addEventListener('click', () => {
        toast.remove();
    });

    notificationStack.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4200);
}

function showSystemNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
        const notification = new Notification(title, {
            body,
            icon: 'logo2.png',
            badge: 'logo2.png'
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        setTimeout(() => notification.close(), 5000);
    } catch (error) {
        console.warn('Notification failed', error);
    }
}

function notifyIncomingMessage(scope, message, usernameOverride = null) {
    if (!message || message.username === currentUser) return;
    const scopeKey = scope === 'private' && usernameOverride
        ? `private:${getChatId(currentUser, usernameOverride)}`
        : `group:${currentChannel}`;
    if (mutedKeys[scopeKey]) return;

    const displayName = getDisplayName(usernameOverride || message.username || 'Someone');
    const title = scope === 'group'
        ? `${displayName} in group chat`
        : `New message from ${displayName}`;
    const body = truncatePreview(getMessagePreview(message));
    registerAppNotification({
        scope,
        sender: usernameOverride || message.username || '',
        title,
        body
    });
    const isVisible = document.visibilityState === 'visible';

    if (isVisible) {
        showInAppNotification(title, body);
        playAppSound('received');
        return;
    }

    showSystemNotification(title, body);
    playAppSound('notification');
}

function updateAlertState(state, message) {
    state.lastId = message?.id || null;
    state.lastTimestamp = Number(message?.timestamp) || 0;
}

function isNewerThanAlertState(state, message) {
    if (!message) return false;
    const messageTimestamp = Number(message.timestamp) || 0;
    if (messageTimestamp > state.lastTimestamp) {
        return true;
    }
    return messageTimestamp === state.lastTimestamp && !!message.id && message.id !== state.lastId;
}

function handleGroupActivity(messages) {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    if (!groupAlertsPrimed) {
        updateAlertState(groupAlertState, latestMessage);
        groupAlertsPrimed = true;
        return;
    }

    if (!isNewerThanAlertState(groupAlertState, latestMessage)) {
        return;
    }

    updateAlertState(groupAlertState, latestMessage);
    if (latestMessage.replyTo?.username === currentUser) {
        registerAppNotification({
            scope: 'group',
            sender: latestMessage.username,
            title: 'New reply',
            body: `${getDisplayName(latestMessage.username)} replied to your message`
        });
    }
    if (String(latestMessage.text || '').includes(`@${currentUser}`)) {
        registerAppNotification({
            scope: 'group',
            sender: latestMessage.username,
            title: 'Mention',
            body: `${getDisplayName(latestMessage.username)} mentioned you`
        });
    }
    notifyIncomingMessage('group', latestMessage);
}

function handlePrivateActivity(chatId, lastMessage, otherUser) {
    if (!chatId || !lastMessage) return;

    const existingState = privateAlertState.get(chatId);
    if (!existingState) {
        privateAlertState.set(chatId, {
            lastId: lastMessage.id || null,
            lastTimestamp: Number(lastMessage.timestamp) || 0
        });
        if (privateAlertsPrimed) {
            notifyIncomingMessage('private', lastMessage, otherUser);
        }
        return;
    }

    if (!isNewerThanAlertState(existingState, lastMessage)) {
        return;
    }

    existingState.lastId = lastMessage.id || null;
    existingState.lastTimestamp = Number(lastMessage.timestamp) || 0;
    notifyIncomingMessage('private', lastMessage, otherUser);
}

function getMessageTarget() {
    if (currentTab === 'private') {
        if (!selectedPrivateId) return null;
        return {
            scope: 'private',
            chatId: selectedPrivateId,
            messagesRef: ref(db, `private_messages/${selectedPrivateId}`)
        };
    }

    const channelId = normalizeChannelName(currentChannel);
    return {
        scope: 'group',
        chatId: channelId,
        messagesRef: getGroupMessagesRef(channelId)
    };
}

async function sendMessageToTarget(target, message) {
    const payload = { ...message };
    if (target.scope === 'group') {
        payload.channelId = normalizeChannelName(target.chatId || currentChannel);
    }
    try {
        const newMessageRef = push(target.messagesRef);
        await set(newMessageRef, payload);
        try {
            await enqueueNotificationEvent(target, payload, newMessageRef.key);
        } catch (error) {
            console.warn('Notification queue write failed', error);
        }
        playAppSound('sent');
        return newMessageRef.key;
    } catch (error) {
        queuedMessages.push({
            target: {
                scope: target.scope,
                chatId: target.chatId || '',
                path: target.messagesRef.toString()
            },
            message: payload,
            queuedAt: Date.now()
        });
        persistClientState();
        registerAppNotification({
            scope: target.scope,
            sender: currentUser,
            title: 'Queued while offline',
            body: truncatePreview(getMessagePreview(payload))
        });
        return null;
    }
}

async function enqueueNotificationEvent(target, message, messageId) {
    if (!messageId || !currentUser) return;

    const eventRef = push(ref(db, 'notification_queue'));
    await set(eventRef, {
        scope: target.scope,
        chatId: target.chatId || '',
        messageId,
        sender: currentUser,
        timestamp: Number(message.timestamp) || Date.now(),
        type: message.type || 'text',
        text: message.type === 'text' ? (message.text || '') : '',
        sticker: message.type === 'sticker' ? (message.sticker || '') : ''
    });
}

function isCordovaPushAvailable() {
    return typeof window !== 'undefined' && !!window.cordova && !!window.FirebasePlugin;
}

function firebaseGetInstallationId() {
    return new Promise((resolve, reject) => {
        window.FirebasePlugin.getInstallationId(resolve, reject);
    });
}

function firebaseGetToken() {
    return new Promise((resolve, reject) => {
        window.FirebasePlugin.getToken(resolve, reject);
    });
}

function firebaseHasPermission() {
    return new Promise((resolve, reject) => {
        window.FirebasePlugin.hasPermission(resolve, reject);
    });
}

function firebaseGrantPermission() {
    return new Promise((resolve, reject) => {
        window.FirebasePlugin.grantPermission(resolve, reject);
    });
}

function firebaseCreateChannel(channel) {
    return new Promise((resolve, reject) => {
        window.FirebasePlugin.createChannel(channel, resolve, reject);
    });
}

function getPushPayloadValue(message, key) {
    if (message && message[key] != null) return String(message[key]);
    if (message && message.data && message.data[key] != null) return String(message.data[key]);
    return '';
}

async function ensurePushPermission() {
    if (!isCordovaPushAvailable()) return false;
    try {
        const hasPermission = await firebaseHasPermission();
        if (hasPermission) return true;
        await firebaseGrantPermission();
        return await firebaseHasPermission();
    } catch (error) {
        console.warn('Push permission check failed', error);
        return false;
    }
}

async function ensurePushChannel() {
    if (!isCordovaPushAvailable()) return;
    try {
        await firebaseCreateChannel({
            id: PUSH_CHANNEL_ID,
            name: 'Messages',
            description: 'Tubonge message alerts',
            sound: 'default',
            importance: 4,
            vibration: true
        });
    } catch (error) {
        console.warn('Notification channel setup failed', error);
    }
}

async function removeStoredPushRegistration(username = currentUser) {
    const installationId = nativePushState.installationId || localStorage.getItem(PUSH_INSTALLATION_STORAGE_KEY);
    if (!username || !installationId) return;
    try {
        await remove(ref(db, `users/${username}/devices/${installationId}`));
    } catch (error) {
        console.warn('Could not remove device token', error);
    }
    if (localStorage.getItem(PUSH_USER_STORAGE_KEY) === username) {
        localStorage.removeItem(PUSH_USER_STORAGE_KEY);
        localStorage.removeItem(PUSH_INSTALLATION_STORAGE_KEY);
    }
}

async function cleanupPreviousPushUser(installationId) {
    const previousUser = localStorage.getItem(PUSH_USER_STORAGE_KEY);
    if (!installationId || !previousUser || previousUser === currentUser) return;
    try {
        await remove(ref(db, `users/${previousUser}/devices/${installationId}`));
    } catch (error) {
        console.warn('Could not clean up previous push user', error);
    }
}

async function persistPushRegistration(token) {
    if (!token || !currentUser) return;
    let installationId = nativePushState.installationId;
    if (!installationId) {
        installationId = await firebaseGetInstallationId().catch(() => '');
        nativePushState.installationId = installationId || null;
    }
    if (!installationId) {
        console.warn('Missing Firebase installation ID; skipping token registration.');
        return;
    }

    await cleanupPreviousPushUser(installationId);

    nativePushState.token = token;
    await set(ref(db, `users/${currentUser}/devices/${installationId}`), {
        token,
        platform: 'android',
        channelId: PUSH_CHANNEL_ID,
        updatedAt: Date.now()
    });

    localStorage.setItem(PUSH_USER_STORAGE_KEY, currentUser);
    localStorage.setItem(PUSH_INSTALLATION_STORAGE_KEY, installationId);
}

async function registerPushToken() {
    if (!isCordovaPushAvailable() || !currentUser) return;
    const permissionGranted = await ensurePushPermission();
    if (!permissionGranted) {
        console.warn('Push permission not granted.');
        return;
    }

    await ensurePushChannel();

    try {
        nativePushState.installationId = await firebaseGetInstallationId();
    } catch (error) {
        console.warn('Could not get Firebase installation ID', error);
    }

    try {
        const token = await firebaseGetToken();
        if (token) {
            await persistPushRegistration(token);
        }
    } catch (error) {
        console.warn('Could not get FCM token', error);
    }
}

function routeFromPushNotification(message) {
    const scope = getPushPayloadValue(message, 'scope');
    const sender = getPushPayloadValue(message, 'sender');

    if (scope === 'private' && sender) {
        selectPrivateUser(sender);
        return;
    }

    if (scope === 'group') {
        document.querySelector('[data-tab="group"]')?.click();
    }
}

function handleNativePushMessage(message) {
    const tapped = message?.tap === true
        || message?.tap === 'background'
        || message?.wasTapped === true
        || getPushPayloadValue(message, 'tap') === 'true';

    if (tapped) {
        routeFromPushNotification(message);
    }
}

function initializeNativePush() {
    if (nativePushState.initialized || !isCordovaPushAvailable() || !currentUser) return;
    nativePushState.initialized = true;

    registerPushToken();

    window.FirebasePlugin.onTokenRefresh(async (token) => {
        try {
            await persistPushRegistration(token);
        } catch (error) {
            console.warn('Token refresh persistence failed', error);
        }
    }, (error) => {
        console.warn('Token refresh listener failed', error);
    });

    window.FirebasePlugin.onMessageReceived((message) => {
        handleNativePushMessage(message);
    }, (error) => {
        console.warn('Push message listener failed', error);
    });
}

async function logoutCurrentSession() {
    setTypingState(false);
    await removeStoredPushRegistration(currentUser);
    localStorage.removeItem('dtubonge_session');
    localStorage.removeItem('dtubonge_admin');
    window.location.href = 'login.html';
}

function getReadKey(chatId) {
    return `dtubonge_read_${chatId}`;
}

function getLastRead(chatId) {
    if (!chatId) return 0;
    return Number(localStorage.getItem(getReadKey(chatId))) || 0;
}

function setLastRead(chatId, timestamp) {
    if (!chatId || !timestamp) return;
    localStorage.setItem(getReadKey(chatId), String(timestamp));
}

function updatePrivateBadge(count) {
    if (!privateBadge) return;
    if (count > 0) {
        privateBadge.textContent = count > 99 ? '99+' : String(count);
        privateBadge.classList.add('active');
    } else {
        privateBadge.textContent = '';
        privateBadge.classList.remove('active');
    }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        Object.keys(panels).forEach(key => {
            const el = panels[key];
            if (el) el.classList.toggle('active', key === currentTab);
        });
        if (currentTab !== 'private' && privateLayout) {
            privateLayout.classList.remove('split');
        }
        renderMuteState();
    });
});

function renderMuteState() {
    if (!muteChatBtn) return;
    const key = getCurrentScopeKey();
    muteChatBtn.textContent = mutedKeys[key] ? 'Unmute' : 'Mute';
}

function renderChannels() {
    if (!channelSelect) return;
    const options = Object.keys(channelCatalog).sort();
    channelSelect.innerHTML = '';
    options.forEach((id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `#${id}`;
        channelSelect.appendChild(option);
    });
    channelSelect.value = normalizeChannelName(currentChannel);
}

function subscribeChannels() {
    onValue(ref(db, 'channels/meta'), (snapshot) => {
        const data = snapshot.val() || {};
        channelCatalog = {
            general: { name: 'general', createdAt: Date.now(), createdBy: 'system' },
            ...data
        };
        if (!channelCatalog[currentChannel]) {
            currentChannel = 'general';
        }
        renderChannels();
        loadGroupMessages();
        subscribeTypingIndicators();
        subscribePinnedMessages();
    });
}

async function migrateGeneralChannelMessages() {
    try {
        const legacyRef = ref(db, 'messages');
        const generalChannelRef = ref(db, 'channels/general/messages');
        const [legacySnap, channelSnap] = await Promise.all([get(legacyRef), get(generalChannelRef)]);
        const legacy = legacySnap.val() || {};
        const channelMessages = channelSnap.val() || {};
        const updates = {};
        Object.entries(channelMessages).forEach(([id, value]) => {
            if (!legacy[id]) {
                updates[id] = value;
            }
        });
        if (Object.keys(updates).length) {
            await update(legacyRef, updates);
        }
    } catch (error) {
        console.warn('General message migration skipped', error);
    }
}

function subscribePinnedMessages() {
    const channelId = normalizeChannelName(currentChannel);
    onValue(ref(db, `pinned/group/${channelId}`), (snapshot) => {
        const pin = snapshot.val();
        if (groupPinned) {
            groupPinned.textContent = pin ? `Pinned: ${pin.username}: ${pin.text}` : '';
        }
    });
    if (!selectedPrivateId) {
        if (privatePinned) privatePinned.textContent = '';
        return;
    }
    onValue(ref(db, `pinned/private/${selectedPrivateId}`), (snapshot) => {
        const pin = snapshot.val();
        if (privatePinned) {
            privatePinned.textContent = pin ? `Pinned: ${pin.username}: ${pin.text}` : '';
        }
    });
}

renderThemeOptions();
applyTheme(getSavedTheme());

if (themeResetBtn) {
    themeResetBtn.addEventListener('click', () => applyTheme('rose'));
}

if (createChannelBtn) {
    createChannelBtn.addEventListener('click', async () => {
        const raw = prompt('New channel name (letters, numbers, -, _)');
        if (!raw) return;
        const id = normalizeChannelName(raw);
        await update(ref(db, `channels/meta/${id}`), {
            name: id,
            createdAt: Date.now(),
            createdBy: currentUser
        });
        const inviteRaw = prompt('Invite usernames (comma separated, optional)', '');
        if (inviteRaw != null && inviteRaw.trim()) {
            const members = inviteRaw.split(',').map((u) => u.trim()).filter(Boolean);
            await set(ref(db, `channels/meta/${id}/members`), members);
        }
        currentChannel = id;
        renderChannels();
        loadGroupMessages();
        subscribeTypingIndicators();
        subscribePinnedMessages();
    });
}

if (channelSelect) {
    channelSelect.addEventListener('change', () => {
        currentChannel = normalizeChannelName(channelSelect.value);
        loadGroupMessages();
        subscribeTypingIndicators();
        subscribePinnedMessages();
        renderMuteState();
    });
}

if (muteChatBtn) {
    muteChatBtn.addEventListener('click', () => {
        const key = getCurrentScopeKey();
        mutedKeys[key] = !mutedKeys[key];
        persistClientState();
        renderMuteState();
    });
}

if (groupUnpinBtn) {
    groupUnpinBtn.addEventListener('click', async () => {
        await remove(ref(db, `pinned/group/${normalizeChannelName(currentChannel)}`));
    });
}

if (privateUnpinBtn) {
    privateUnpinBtn.addEventListener('click', async () => {
        if (!selectedPrivateId) return;
        await remove(ref(db, `pinned/private/${selectedPrivateId}`));
    });
}

if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', () => {
        appNotifications = [];
        persistClientState();
        renderNotificationCenter();
    });
}

sessionUser.textContent = currentUser ? `@${currentUser}` : '';

logoutBtn.addEventListener('click', () => {
    logoutCurrentSession();
});

if (modalLogoutBtn) {
    modalLogoutBtn.addEventListener('click', () => {
        logoutCurrentSession();
    });
}

if (modalRefreshBtn) {
    modalRefreshBtn.addEventListener('click', () => {
        window.location.reload();
    });
}

function getChatId(userA, userB) {
    return [userA, userB].sort().join('_');
}

function getDisplayName(username) {
    return userProfiles[username]?.displayName || username;
}

function getAvatarUrl(username) {
    return userProfiles[username]?.avatarUrl || null;
}

function buildAvatarElement(username, className) {
    const avatar = document.createElement('div');
    avatar.className = className;
    const url = getAvatarUrl(username);
    if (url) {
        avatar.style.backgroundImage = `url("${url}")`;
        avatar.classList.add('has-image');
        avatar.textContent = '';
    } else {
        avatar.textContent = username ? username.charAt(0).toUpperCase() : '?';
    }
    return avatar;
}

function updateHeaderAvatar() {
    const url = getAvatarUrl(currentUser);
    if (url) {
        headerAvatar.style.backgroundImage = `url("${url}")`;
    } else {
        headerAvatar.style.backgroundImage = '';
    }
}

function openUserProfile(username) {
    const profile = userProfiles[username] || {};
    const displayName = profile.displayName || username || 'User';
    const bio = profile.bio || 'No bio provided.';
    const avatarUrl = profile.avatarUrl || null;
    const statusText = profile.online ? 'Online' : 'Offline';
    const joinDate = profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'Unknown';

    viewProfileName.textContent = displayName;
    viewProfileBio.textContent = bio;
    viewProfileStatus.textContent = statusText;
    viewProfileJoin.textContent = joinDate;
    if (avatarUrl) {
        viewProfileAvatar.style.backgroundImage = `url("${avatarUrl}")`;
    } else {
        viewProfileAvatar.style.backgroundImage = '';
    }
    viewProfileModal.style.display = 'flex';
}

function closeUserProfile() {
    viewProfileModal.style.display = 'none';
}

function setReplyContext(message) {
    replyContext = {
        id: message.id,
        username: message.username,
        text: message.text
    };
    replyPreview.classList.add('active');
    replyText.textContent = `Replying to ${replyContext.username}: ${replyContext.text}`;
}

clearReplyBtn.addEventListener('click', () => {
    replyContext = null;
    replyPreview.classList.remove('active');
    replyText.textContent = '';
});

function renderAvatarGrid() {
    avatarGrid.innerHTML = '';
    DEFAULT_AVATARS.forEach(url => {
        const option = document.createElement('div');
        option.className = 'avatar-option';
        option.style.backgroundImage = `url("${url}")`;
        if (selectedAvatarUrl === url) {
            option.classList.add('selected');
        }
        option.addEventListener('click', () => {
            selectedAvatarUrl = url;
            renderAvatarGrid();
        });
        avatarGrid.appendChild(option);
    });
}

function getSavedTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'rose';
}

function applyTheme(themeKey) {
    const theme = THEMES.find(item => item.key === themeKey) ? themeKey : 'rose';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (themeOptions) {
        themeOptions.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
    }
}

function renderThemeOptions() {
    if (!themeOptions) return;
    themeOptions.innerHTML = '';
    const activeTheme = getSavedTheme();
    THEMES.forEach(theme => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'theme-option';
        option.dataset.theme = theme.key;
        option.style.setProperty('--swatch', theme.swatch);
        option.innerHTML = `<span class="theme-swatch"></span><span>${theme.label}</span>`;
        option.classList.toggle('active', theme.key === activeTheme);
        option.addEventListener('click', () => applyTheme(theme.key));
        themeOptions.appendChild(option);
    });
}

function openProfileModal() {
    const profile = userProfiles[currentUser] || {};
    profileDisplay.value = profile.displayName || '';
    profileBio.value = profile.bio || '';
    selectedAvatarUrl = profile.avatarUrl || DEFAULT_AVATARS[0];
    renderAvatarGrid();
    renderThemeOptions();
    profileModal.style.display = 'flex';
}

function closeProfileModal() {
    profileModal.style.display = 'none';
}

async function saveProfile() {
    const displayName = profileDisplay.value.trim();
    const bio = profileBio.value.trim();
    const avatarUrl = selectedAvatarUrl || null;
    await update(ref(db, `users/${currentUser}`), {
        displayName,
        bio,
        avatarUrl
    });
    updateHeaderAvatar();
    closeProfileModal();
}

profileBtn.addEventListener('click', openProfileModal);
closeProfileBtn.addEventListener('click', closeProfileModal);
cancelProfileBtn.addEventListener('click', closeProfileModal);
saveProfileBtn.addEventListener('click', saveProfile);
closeViewProfileBtn.addEventListener('click', closeUserProfile);
viewProfileModal.addEventListener('click', (event) => {
    if (event.target === viewProfileModal) {
        closeUserProfile();
    }
});

function showUploadProgress(label, percent) {
    uploadStatus.classList.add('active');
    uploadLabel.textContent = label;
    uploadBarFill.style.width = `${percent}%`;
    if (percent >= 100) {
        setTimeout(() => {
            uploadStatus.classList.remove('active');
            uploadLabel.textContent = '';
            uploadBarFill.style.width = '0%';
        }, 800);
    }
}

async function uploadToStorage(path, blobOrFile, startLabel) {
    return new Promise((resolve, reject) => {
        try {
            const storageRef = sRef(storage, path);
            const task = uploadBytesResumable(storageRef, blobOrFile);
            showUploadProgress(startLabel || 'Uploading...', 5);
            task.on('state_changed',
                (snapshot) => {
                    const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    showUploadProgress('Uploading...', Math.max(10, Math.min(99, percent)));
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    const url = await getDownloadURL(task.snapshot.ref);
                    showUploadProgress('Uploaded', 100);
                    resolve({ url });
                }
            );
        } catch (err) {
            reject(err);
        }
    });
}

function startRecordingTimer() {
    const startedAt = Date.now();
    recordingIndicator.classList.add('active');
    recordingTimer.textContent = '0:00';
    recordingInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = String(elapsed % 60).padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
    }, 500);
    return startedAt;
}

function stopRecordingTimer() {
    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }
    recordingIndicator.classList.remove('active');
    recordingTimer.textContent = '0:00';
}

// Safe helpers to avoid accidental root deletes
function requireUser() {
    if (!currentUser) {
        alert('Session expired. Please log in again.');
        window.location.href = 'login.html';
        throw new Error('No current user');
    }
}
function cartRootRef() {
    return ref(db, 'market/carts');
}
function userCartRefStrict() {
    requireUser();
    return child(cartRootRef(), currentUser);
}
function ordersRootRef() {
    return ref(db, 'market/orders');
}
function userOrdersRefStrict() {
    requireUser();
    return child(ordersRootRef(), currentUser);
}

// Market: products and cart
function renderMarket(products) {
    if (!marketGrid) return;
    const term = (marketSearch?.value || '').trim().toLowerCase();
    const category = (marketCategoryFilter?.value || '').trim();
    const list = Object.entries(products || {}).map(([id, p]) => ({ id, ...p }))
        .filter(p => !p.status || p.status === 'active')
        .filter(p => category ? (p.category || 'Other') === category : true)
        .filter(p => term ? (p.title?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)) : true)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    marketGrid.innerHTML = '';
    (list.length === 0 ? marketEmpty.style.display = 'block' : marketEmpty.style.display = 'none');
    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'market-card';
        const img = document.createElement('img');
        img.src = p.imageUrl || p.image || '';
        img.alt = p.title || 'Product';
        const meta = document.createElement('div');
        meta.className = 'meta';
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = p.title || 'Untitled';
        const price = document.createElement('div');
        price.className = 'price';
        price.textContent = p.price != null ? `$${Number(p.price).toFixed(2)}` : '';
        const seller = document.createElement('div');
        seller.className = 'message-time';
        seller.textContent = `Seller: ${getDisplayName(p.seller || '')}`;
        meta.appendChild(title);
        meta.appendChild(price);
        meta.appendChild(seller);
        card.appendChild(img);
        card.appendChild(meta);
        card.addEventListener('click', () => openProductView(p));
        marketGrid.appendChild(card);
    });
}

function subscribeMarketProducts() {
    const refProducts = ref(db, 'market/products');
    onValue(refProducts, (snapshot) => {
        allProducts = snapshot.val() || {};
        renderMarket(allProducts);
    });
}

function openAddProduct() {
    if (!addModal) return;
    addModal.style.display = 'flex';
}
function closeAddProductModal() {
    if (!addModal) return;
    addModal.style.display = 'none';
}

function openProductView(p) {
    viewingProduct = p;
    if (viewProductTitle) viewProductTitle.textContent = p.title || 'Product';
    if (viewProductImage) {
        viewProductImage.src = p.imageUrl || p.image || '';
        viewProductImage.alt = p.title || 'Product';
    }
    if (viewProductPrice) viewProductPrice.textContent = p.price != null ? `$${Number(p.price).toFixed(2)}` : '';
    if (viewProductDesc) viewProductDesc.textContent = p.description || '';
    if (viewProductSeller) viewProductSeller.textContent = `Seller: ${getDisplayName(p.seller || '')}`;
    if (viewModal) viewModal.style.display = 'flex';
}
function closeProductView() {
    viewingProduct = null;
    if (viewModal) viewModal.style.display = 'none';
}

function addToCart(product) {
    if (!currentUser) {
        alert('Session expired. Please log in again.');
        return;
    }
    const itemRef = push(userCartRefStrict());
    const payload = {
        productId: product.id,
        title: product.title || '',
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl || '',
        seller: product.seller || product.username || '',
        createdAt: Date.now(),
        qty: 1
    };
    return set(itemRef, payload);
}

function subscribeCart() {
    if (!currentUser || !cartCount) return;
    onValue(userCartRefStrict(), (snapshot) => {
        const cart = snapshot.val() || {};
        const items = Object.values(cart);
        const count = items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0);
        cartCount.textContent = count > 0 ? String(count) : '';
        if (cartList && cartModal && cartModal.style.display === 'flex') {
            renderCartList(cart);
        }
    });
}

function renderCartList(cart) {
    const items = Object.entries(cart || {}).map(([id, it]) => ({ id, ...it }));
    cartList.innerHTML = '';
    let total = 0;
    items.forEach(it => {
        total += (Number(it.price) || 0) * (Number(it.qty) || 1);
        const row = document.createElement('div');
        row.className = 'cart-item';
        const img = document.createElement('img');
        img.src = it.imageUrl || '';
        const meta = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = it.title || 'Item';
        const sub = document.createElement('div');
        sub.className = 'meta-line';
        sub.textContent = `x${it.qty || 1}`;
        meta.appendChild(title);
        meta.appendChild(sub);
        const price = document.createElement('div');
        price.className = 'price';
        price.textContent = `$${(Number(it.price) || 0).toFixed(2)}`;
        const del = document.createElement('button');
        del.className = 'ghost-btn';
        del.textContent = 'Remove';
        del.addEventListener('click', async () => {
            try {
                requireUser();
                await remove(child(userCartRefStrict(), it.id));
            } catch (e) {
                console.error('Remove cart item failed', e);
            }
        });
        const actions = document.createElement('div');
        actions.style.display = 'grid';
        actions.style.gap = '6px';
        actions.appendChild(price);
        actions.appendChild(del);
        row.appendChild(img);
        row.appendChild(meta);
        row.appendChild(actions);
        cartList.appendChild(row);
    });
    if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

async function openCart() {
    if (!cartModal) return;
    requireUser();
    const snap = await get(userCartRefStrict());
    const cart = snap.val() || {};
    renderCartList(cart);
    cartModal.style.display = 'flex';
}
function closeCart() {
    if (cartModal) cartModal.style.display = 'none';
}

async function checkoutCart() {
    requireUser();
    const cRef = userCartRefStrict();
    const snap = await get(cRef);
    const cart = snap.val() || {};
    const items = Object.values(cart);
    if (items.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    if (!confirm('Proceed to place this order?')) {
        return;
    }
    const total = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    const orderRef = push(userOrdersRefStrict());
    await set(orderRef, {
        items,
        total,
        createdAt: Date.now(),
        status: 'placed'
    });
    await remove(cRef);
    registerAppNotification({
        scope: 'market',
        sender: currentUser,
        title: 'Order placed',
        body: `Your order total is $${total.toFixed(2)}`
    });
    alert('Order placed!');
    closeCart();
}

// Market event bindings
if (addProductBtn && addModal) {
    addProductBtn.addEventListener('click', openAddProduct);
}
if (closeAddProduct) closeAddProduct.addEventListener('click', closeAddProductModal);
if (cancelAddProduct) cancelAddProduct.addEventListener('click', closeAddProductModal);
if (chooseProductImage && productImageInput) {
    chooseProductImage.addEventListener('click', () => productImageInput.click());
}
if (marketSearch) {
    marketSearch.addEventListener('input', () => renderMarket(allProducts));
}

function subscribeOrderHistory() {
    if (!orderHistory || !currentUser) return;
    onValue(userOrdersRefStrict(), (snapshot) => {
        const data = snapshot.val() || {};
        const orders = Object.entries(data)
            .map(([id, order]) => ({ id, ...order }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        orderHistory.innerHTML = '';
        if (!orders.length) {
            orderHistory.innerHTML = '<div class="empty-state">No orders yet.</div>';
            return;
        }
        orders.forEach((order) => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            const meta = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = `Order ${order.id.slice(-6)} - ${order.status || 'placed'}`;
            const sub = document.createElement('div');
            sub.className = 'meta-line';
            sub.textContent = `${(order.items || []).length} item(s) - ${new Date(order.createdAt || Date.now()).toLocaleString()}`;
            meta.appendChild(title);
            meta.appendChild(sub);
            const total = document.createElement('div');
            total.className = 'price';
            total.textContent = `$${Number(order.total || 0).toFixed(2)}`;
            row.appendChild(meta);
            row.appendChild(total);
            orderHistory.appendChild(row);
        });
    });
}
if (marketCategoryFilter) {
    marketCategoryFilter.addEventListener('change', () => renderMarket(allProducts));
}
if (openCartBtn) {
    openCartBtn.addEventListener('click', openCart);
}
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (checkoutBtn) checkoutBtn.addEventListener('click', checkoutCart);
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
        if (!confirm('Clear all items from your cart?')) return;
        try {
            await remove(userCartRefStrict());
        } catch (e) {
            console.error('Clear cart failed', e);
        }
        renderCartList({});
        if (cartTotalEl) cartTotalEl.textContent = '$0.00';
    });
}
if (closeViewProduct) closeViewProduct.addEventListener('click', closeProductView);
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async () => {
        if (!viewingProduct) return;
        await addToCart(viewingProduct);
        alert('Added to cart');
        closeProductView();
    });
}
if (saveProductBtn && productImageInput && productTitleInput && productPriceInput) {
    saveProductBtn.addEventListener('click', async () => {
        try {
            const title = productTitleInput.value.trim();
            const price = Number(productPriceInput.value);
            const desc = productDescInput.value.trim();
            const category = (productCategoryInput?.value || 'Other').trim() || 'Other';
            const file = productImageInput.files[0];
            if (!title || isNaN(price) || !file) {
                alert('Please provide title, price and image.');
                return;
            }
            const ts = Date.now();
            const path = `market/products/${currentUser}/${ts}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const { url } = await uploadToStorage(path, file, 'Uploading product...');
            const productsRef = ref(db, 'market/products');
            const newRef = push(productsRef);
            await set(newRef, {
                title,
                price,
                description: desc,
                imageUrl: url,
                seller: currentUser,
                category,
                createdAt: ts,
                status: 'active',
            });
            closeAddProductModal();
            // reset fields
            productTitleInput.value = '';
            productPriceInput.value = '';
            productDescInput.value = '';
            productImageInput.value = '';
        } catch (err) {
            console.error('Add product failed', err);
            alert('Failed to add product.');
        }
    });
}

function renderMessage(container, msg, isOwn, showReply, showReplyButton, showDeleteButton, useUserColors, statusText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'user-message' : 'other-message'} ${msg.type === 'image' ? 'image-message' : ''} ${msg.type === 'voice' ? 'voice-message' : ''} ${msg.type === 'video' ? 'video-message' : ''} ${msg.type === 'sticker' ? 'sticker-message' : ''}`;
    if (useUserColors && msg.username) {
        const colorIndex = Math.abs(msg.username.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % USER_COLORS.length;
        const color = USER_COLORS[colorIndex];
        messageDiv.style.borderLeftColor = color;
        messageDiv.style.backgroundColor = `${color}22`;
    }

    const header = document.createElement('div');
    header.className = 'message-header';
    const senderWrap = document.createElement('div');
    senderWrap.className = 'sender-wrap';
    const avatar = buildAvatarElement(msg.username, 'message-avatar');
    avatar.addEventListener('click', (event) => {
        event.stopPropagation();
        openUserProfile(msg.username);
    });
    const sender = document.createElement('span');
    sender.className = 'message-sender';
    sender.textContent = getDisplayName(msg.username);
    senderWrap.appendChild(avatar);
    senderWrap.appendChild(sender);

    const actionWrap = document.createElement('div');
    actionWrap.className = 'message-actions';

    if (showReplyButton) {
        const replyBtn = document.createElement('button');
        replyBtn.className = 'reply-btn';
        replyBtn.textContent = 'Reply';
        replyBtn.addEventListener('click', () => setReplyContext(msg));
        actionWrap.appendChild(replyBtn);
    }

    if (showDeleteButton) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            if (msg._scope === 'private') {
                deletePrivateMessage(msg.id);
            } else {
                deleteGroupMessage(msg.id);
            }
        });
        actionWrap.appendChild(deleteBtn);
    }

    const pinBtn = document.createElement('button');
    pinBtn.className = 'ghost-btn';
    pinBtn.textContent = 'Pin';
    pinBtn.addEventListener('click', () => pinMessage(msg));
    actionWrap.appendChild(pinBtn);

    if (msg.username === currentUser) {
        const editBtn = document.createElement('button');
        editBtn.className = 'ghost-btn';
        editBtn.textContent = 'Edit';
        editBtn.disabled = !canEditOrUnsend(msg);
        editBtn.addEventListener('click', () => editMessage(msg));
        actionWrap.appendChild(editBtn);

        const unsendBtn = document.createElement('button');
        unsendBtn.className = 'ghost-btn';
        unsendBtn.textContent = 'Unsend';
        unsendBtn.disabled = !canEditOrUnsend(msg);
        unsendBtn.addEventListener('click', () => unsendMessage(msg));
        actionWrap.appendChild(unsendBtn);
    }

    if (showReply && msg.replyTo) {
        const replyBlock = document.createElement('div');
        replyBlock.className = 'reply-block';
        replyBlock.innerHTML = `<strong>${msg.replyTo.username}</strong>: ${msg.replyTo.text}`;
        messageDiv.appendChild(replyBlock);
    }

    if (msg.type === 'image' && msg.imageData) {
        const image = document.createElement('img');
        image.src = msg.imageData;
        image.alt = msg.caption || 'Shared photo';
        image.className = 'shared-image';
        image.loading = 'lazy';
        messageDiv.appendChild(image);
        if (msg.caption) {
            const caption = document.createElement('div');
            caption.className = 'message-text';
            caption.textContent = msg.caption;
            messageDiv.appendChild(caption);
        }
    } else if (msg.type === 'video' && msg.videoData) {
        const video = document.createElement('video');
        video.controls = true;
        video.src = msg.videoData;
        video.className = 'shared-video';
        video.playsInline = true;
        video.preload = 'metadata';
        messageDiv.appendChild(video);
    } else if (msg.type === 'sticker' && msg.sticker) {
        const sticker = document.createElement('div');
        sticker.className = 'sticker-display';
        sticker.textContent = msg.sticker;
        messageDiv.appendChild(sticker);
    } else if (msg.type === 'voice' && msg.audioData) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = msg.audioData;
        audio.className = 'voice-audio';
        messageDiv.appendChild(audio);
        if (msg.duration) {
            const duration = document.createElement('div');
            duration.className = 'message-time';
            duration.textContent = `Voice - ${Math.round(msg.duration)}s`;
            messageDiv.appendChild(duration);
        }
    } else if (msg.type === 'file' && msg.fileUrl) {
        const fileLink = document.createElement('a');
        fileLink.href = msg.fileUrl;
        fileLink.target = '_blank';
        fileLink.rel = 'noopener noreferrer';
        fileLink.className = 'message-text';
        const sizeKb = Math.max(1, Math.round((Number(msg.fileSize) || 0) / 1024));
        fileLink.textContent = `${msg.fileName || 'File'} (${sizeKb} KB)`;
        messageDiv.appendChild(fileLink);
    } else {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = msg.text;
        messageDiv.appendChild(textDiv);
    }

    header.appendChild(senderWrap);
    header.appendChild(actionWrap);
    messageDiv.appendChild(header);
    const metaRow = document.createElement('div');
    metaRow.className = 'message-meta';
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (msg.editedAt) {
        timeDiv.textContent += ' (edited)';
    }
    metaRow.appendChild(timeDiv);
    if (statusText) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'message-status';
        statusDiv.textContent = statusText;
        metaRow.appendChild(statusDiv);
    }
    messageDiv.appendChild(metaRow);
    renderReactionRow(msg, messageDiv);

    container.appendChild(messageDiv);
}

async function flushQueuedMessages() {
    if (isFlushingQueue || !queuedMessages.length) return;
    isFlushingQueue = true;
    try {
        const pending = [...queuedMessages];
        queuedMessages = [];
        for (const item of pending) {
            const scope = item.target?.scope || 'group';
            let messagesRef = getGroupMessagesRef(normalizeChannelName(currentChannel));
            let chatId = normalizeChannelName(currentChannel);
            if (scope === 'private' && item.target?.chatId) {
                chatId = item.target.chatId;
                messagesRef = ref(db, `private_messages/${chatId}`);
            } else if (scope === 'group' && item.message?.channelId) {
                chatId = normalizeChannelName(item.message.channelId);
                messagesRef = getGroupMessagesRef(chatId);
            }
            await sendMessageToTarget({
                scope,
                chatId,
                messagesRef
            }, item.message);
        }
    } finally {
        persistClientState();
        isFlushingQueue = false;
    }
}

function deleteGroupMessage(messageId) {
    remove(child(getGroupMessagesRef(currentChannel), messageId));
}

function deletePrivateMessage(messageId) {
    if (!selectedPrivateId) return;
    const messageRef = ref(db, `private_messages/${selectedPrivateId}/${messageId}`);
    remove(messageRef);
}

function loadGroupMessages() {
    const channelId = normalizeChannelName(currentChannel);
    const messagesRef = getGroupMessagesRef(channelId);
    const recentMessages = query(messagesRef, limitToLast(groupLimit));

    onValue(recentMessages, snapshot => {
        groupMessages.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            groupEmpty.style.display = 'block';
            currentGroupMessages = [];
            groupAlertsPrimed = true;
            return;
        }
        groupEmpty.style.display = 'none';
        const messages = Object.entries(data).map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp);
        currentGroupMessages = messages;
        handleGroupActivity(messages);
        messages.forEach(msg => {
            renderMessage(groupMessages, { ...msg, _scope: 'group' }, msg.username === currentUser, true, true, msg.username === currentUser, true, null);
        });
        // Default to bottom on group chat
        setTimeout(() => {
            groupMessages.scrollTop = groupMessages.scrollHeight;
        }, 0);
    });
}

function renderPrivateMessages() {
    privateMessages.innerHTML = '';
    if (!currentPrivateMessages.length) {
        privateEmpty.style.display = 'block';
        return;
    }
    privateEmpty.style.display = 'none';
    const otherRead = selectedPrivateName ? (currentPrivateRead?.[selectedPrivateName] || 0) : 0;
    currentPrivateMessages.forEach(msg => {
        const isOwn = msg.username === currentUser;
        const statusText = isOwn ? (otherRead >= msg.timestamp ? 'Read' : 'Sent') : null;
        renderMessage(privateMessages, { ...msg, _scope: 'private' }, isOwn, false, false, isOwn, false, statusText);
    });
    const latest = currentPrivateMessages[currentPrivateMessages.length - 1];
    if (latest?.timestamp) {
        setLastRead(selectedPrivateId, latest.timestamp);
    }
    setTimeout(() => {
        privateMessages.scrollTop = privateMessages.scrollHeight;
    }, 0);
}

function watchPrivateRead(chatId) {
    if (privateReadUnsub) {
        privateReadUnsub();
        privateReadUnsub = null;
    }
    if (!chatId) return;
    const readRef = ref(db, `private_reads/${chatId}`);
    privateReadUnsub = onValue(readRef, snapshot => {
        currentPrivateRead = snapshot.val() || {};
        renderPrivateMessages();
    });
}

function markPrivateRead(chatId) {
    if (!chatId) return;
    const readRef = ref(db, `private_reads/${chatId}`);
    update(readRef, {
        [currentUser]: Date.now()
    });
}

function loadPrivateMessages(chatId) {
    if (!chatId) {
        privateMessages.innerHTML = '';
        privateEmpty.style.display = 'block';
        return;
    }

    const messagesRef = ref(db, `private_messages/${chatId}`);
    const recentMessages = query(messagesRef, limitToLast(privateLimit));

    onValue(recentMessages, snapshot => {
        const data = snapshot.val();
        if (!data) {
            currentPrivateMessages = [];
            privateEmpty.style.display = 'block';
            return;
        }
        currentPrivateMessages = Object.entries(data).map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp);
        privateMessagesCache[chatId] = currentPrivateMessages;
        renderPrivateMessages();
        markPrivateRead(chatId);
    });
}
if (contactSellerBtn) {
    contactSellerBtn.addEventListener('click', () => {
        if (!viewingProduct?.seller || viewingProduct.seller === currentUser) return;
        selectPrivateUser(viewingProduct.seller);
        document.querySelector('[data-tab="private"]')?.click();
        closeProductView();
    });
}

function getMessageNodeRef(msg) {
    if (!msg || !msg.id) return null;
    if (msg._scope === 'private') {
        return ref(db, `private_messages/${selectedPrivateId}/${msg.id}`);
    }
    const channelId = normalizeChannelName(msg.channelId || currentChannel);
    return child(getGroupMessagesRef(channelId), msg.id);
}

function canEditOrUnsend(msg) {
    if (!msg || msg.username !== currentUser) return false;
    return Date.now() - Number(msg.timestamp || 0) <= 2 * 60 * 1000;
}

async function editMessage(msg) {
    if (!canEditOrUnsend(msg)) {
        alert('Edit window expired (2 minutes).');
        return;
    }
    const updatedText = prompt('Edit your message', msg.text || '');
    if (updatedText == null) return;
    const safeText = updatedText.trim();
    if (!safeText) return;
    const nodeRef = getMessageNodeRef(msg);
    if (!nodeRef) return;
    await update(nodeRef, {
        text: safeText,
        editedAt: Date.now()
    });
}

async function unsendMessage(msg) {
    if (!canEditOrUnsend(msg)) {
        alert('Unsend window expired (2 minutes).');
        return;
    }
    const nodeRef = getMessageNodeRef(msg);
    if (!nodeRef) return;
    await remove(nodeRef);
}

async function toggleReaction(msg, emoji) {
    if (!emoji) return;
    const nodeRef = getMessageNodeRef(msg);
    if (!nodeRef) return;
    const reactionRef = child(nodeRef, `reactions/${currentUser}`);
    const currentReaction = msg.reactions?.[currentUser] || '';
    if (currentReaction === emoji) {
        await remove(reactionRef);
    } else {
        await set(reactionRef, emoji);
    }
}

async function pinMessage(msg) {
    if (!msg) return;
    const scope = msg._scope === 'private' ? 'private' : 'group';
    const key = scope === 'private' ? selectedPrivateId : normalizeChannelName(currentChannel);
    if (!key) return;
    const pinRef = ref(db, `pinned/${scope}/${key}`);
    await set(pinRef, {
        messageId: msg.id,
        text: msg.text || getMessagePreview(msg),
        username: msg.username || '',
        timestamp: Number(msg.timestamp) || Date.now(),
        scope,
        key
    });
}

function setTypingState(active) {
    const target = getMessageTarget();
    if (!target) return;
    const typingKey = target.scope === 'private'
        ? `typing/private/${target.chatId}/${currentUser}`
        : `typing/group/${target.chatId}/${currentUser}`;
    const typingRef = ref(db, typingKey);
    if (!active) {
        remove(typingRef);
        return;
    }
    set(typingRef, {
        username: currentUser,
        active: true,
        updatedAt: Date.now()
    });
}

function subscribeTypingIndicators() {
    if (groupTypingUnsub) {
        groupTypingUnsub();
        groupTypingUnsub = null;
    }
    if (privateTypingUnsub) {
        privateTypingUnsub();
        privateTypingUnsub = null;
    }
    const channelId = normalizeChannelName(currentChannel);
    groupTypingUnsub = onValue(ref(db, `typing/group/${channelId}`), (snapshot) => {
        const data = snapshot.val() || {};
        const names = Object.values(data)
            .filter((entry) => entry?.username && entry.username !== currentUser)
            .map((entry) => getDisplayName(entry.username));
        if (groupTyping) {
            groupTyping.textContent = names.length ? `${names.join(', ')} typing...` : '';
        }
    });
    if (!selectedPrivateId) {
        if (privateTyping) privateTyping.textContent = '';
        return;
    }
    privateTypingUnsub = onValue(ref(db, `typing/private/${selectedPrivateId}`), (snapshot) => {
        const data = snapshot.val() || {};
        const names = Object.values(data)
            .filter((entry) => entry?.username && entry.username !== currentUser)
            .map((entry) => getDisplayName(entry.username));
        if (privateTyping) {
            privateTyping.textContent = names.length ? `${names.join(', ')} typing...` : '';
        }
    });
}

function renderReactionRow(msg, container) {
    const row = document.createElement('div');
    row.className = 'message-reactions';
    const reactions = msg.reactions || {};
    const reactionCounts = {};
    Object.values(reactions).forEach((emoji) => {
        reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });
    Object.entries(reactionCounts).forEach(([emoji, count]) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ghost-btn';
        chip.textContent = `${emoji} ${count}`;
        chip.addEventListener('click', () => toggleReaction(msg, emoji));
        row.appendChild(chip);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ghost-btn';
    add.textContent = '+';
    add.addEventListener('click', async () => {
        const emoji = prompt('React with emoji (example: 👍)', '👍');
        if (!emoji) return;
        await toggleReaction(msg, emoji.trim());
    });
    row.appendChild(add);
    container.appendChild(row);
}

function updatePresence() {
    const userRef = ref(db, `users/${currentUser}`);
    update(userRef, {
        username: currentUser,
        online: true,
        lastActive: Date.now()
    });

    onDisconnect(userRef).update({
        online: false,
        lastActive: Date.now()
    });

    onValue(ref(db, 'users'), snapshot => {
        const data = snapshot.val() || {};
        onlineUsers = {};
        userProfiles = data || {};
        Object.keys(data).forEach(key => {
            if (data[key].online) {
                onlineUsers[key] = data[key];
            }
        });
        const count = Object.keys(onlineUsers).length;
        onlineCount.textContent = `${count} online`;
        sessionUser.textContent = currentUser ? `@${getDisplayName(currentUser)}` : '';
        updateHeaderAvatar();
        if (myStatusAvatar) {
            const url = getAvatarUrl(currentUser);
            if (url) {
                myStatusAvatar.style.backgroundImage = `url("${url}")`;
                myStatusAvatar.classList.add('has-image');
                myStatusAvatar.textContent = '';
            } else {
                myStatusAvatar.style.backgroundImage = '';
                myStatusAvatar.classList.remove('has-image');
                myStatusAvatar.textContent = currentUser ? currentUser.charAt(0).toUpperCase() : '';
            }
        }
        renderUserList();
    });
}

function renderUserList() {
    userList.innerHTML = '';
    userListMobile.innerHTML = '';

    const users = Object.keys(userProfiles || {}).sort((a, b) => {
        const aOnline = userProfiles[a]?.online ? 0 : 1;
        const bOnline = userProfiles[b]?.online ? 0 : 1;
        return aOnline - bOnline || a.localeCompare(b);
    });

    users.forEach(username => {
        if (!username) return;
        const isSelf = username === currentUser;
        const displayName = isSelf ? `${getDisplayName(username)} (You)` : getDisplayName(username);
        const isOnline = !!userProfiles[username]?.online;
        const statusText = isOnline ? 'Online' : 'Offline';
        const statusClass = isOnline ? 'status-online' : 'status-offline';

        const item = document.createElement('div');
        item.className = 'user-item';
        const avatar = buildAvatarElement(username, 'user-avatar');
        avatar.addEventListener('click', (event) => {
            event.stopPropagation();
            openUserProfile(username);
        });

        const info = document.createElement('div');
        info.className = 'user-info';
        info.innerHTML = `
            <div class="user-name">${displayName}</div>
            <div class="user-status ${statusClass}">${statusText}</div>
        `;

        item.appendChild(avatar);
        item.appendChild(info);
        if (!isSelf) {
            item.addEventListener('click', () => selectPrivateUser(username));
        }

        const mobileItem = item.cloneNode(true);
        const mobileAvatar = mobileItem.querySelector('.user-avatar');
        if (mobileAvatar) {
            mobileAvatar.addEventListener('click', (event) => {
                event.stopPropagation();
                openUserProfile(username);
            });
        }
        if (!isSelf) {
            mobileItem.addEventListener('click', () => selectPrivateUser(username));
        }
        userList.appendChild(item);
        userListMobile.appendChild(mobileItem);
    });
}

function renderPrivateList(chats) {
    privateList.innerHTML = '';
    if (chats.length === 0) {
        privateList.innerHTML = '<div class="empty-state">No private chats yet.</div>';
        return;
    }

    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `private-item ${chat.user === selectedPrivateName ? 'active' : ''} ${chat.unread ? 'unread' : ''}`;
        const avatar = buildAvatarElement(chat.user, 'user-avatar');
        avatar.addEventListener('click', (event) => {
            event.stopPropagation();
            openUserProfile(chat.user);
        });
        const timeLabel = chat.lastTimestamp ? new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const unreadDot = chat.unread ? '<span class="unread-dot" aria-label="Unread"></span>' : '';
        const safeDisplayName = escapeHtml(getDisplayName(chat.user));
        const safePreview = escapeHtml(chat.lastMessage || 'No messages yet');
        item.innerHTML = `
            <div class="user-info">
                <div class="user-name">
                    <span>${safeDisplayName}</span>
                    <span class="chat-time">${timeLabel}</span>
                </div>
                <div class="user-status">${safePreview}</div>
            </div>
        `;
        item.prepend(avatar);
        if (chat.unread) {
            const nameRow = item.querySelector('.user-name');
            if (nameRow) {
                nameRow.insertAdjacentHTML('beforeend', unreadDot);
            }
        }
        item.addEventListener('click', () => selectPrivateUser(chat.user));
        privateList.appendChild(item);
    });
}

function selectPrivateUser(username) {
    selectedPrivateName = username;
    selectedPrivateId = getChatId(currentUser, username);
    setLastRead(selectedPrivateId, Date.now());
    markPrivateRead(selectedPrivateId);
    watchPrivateRead(selectedPrivateId);
    loadPrivateMessages(selectedPrivateId);
    if (privateChatTitle) {
        privateChatTitle.textContent = getDisplayName(username);
    }
    if (privateLayout) {
        privateLayout.classList.add('split');
    }
    if (currentTab !== 'private') {
        document.querySelector('[data-tab="private"]').click();
    }
    subscribeTypingIndicators();
    subscribePinnedMessages();
    renderMuteState();
    refreshPrivateList();
}

function refreshPrivateList() {
    const privateRef = ref(db, 'private_messages');
    onValue(privateRef, snapshot => {
        const data = snapshot.val() || {};
        const chats = [];
        let unreadTotal = 0;
        Object.keys(data).forEach(chatId => {
            if (!chatId.includes(currentUser)) return;
            const messages = Object.entries(data[chatId]).map(([id, msg]) => ({ id, ...msg }));
            privateMessagesCache[chatId] = messages;
            const lastMessage = messages.sort((a, b) => b.timestamp - a.timestamp)[0];
            const otherUser = chatId.split('_').find(name => name !== currentUser);
            if (otherUser) {
                handlePrivateActivity(chatId, lastMessage, otherUser);
                const lastRead = getLastRead(chatId);
                const isUnread = !!lastMessage
                    && lastMessage.username !== currentUser
                    && lastMessage.timestamp > lastRead;
                if (selectedPrivateId === chatId && currentTab === 'private' && lastMessage?.timestamp) {
                    setLastRead(chatId, lastMessage.timestamp);
                }
                if (isUnread) {
                    unreadTotal += 1;
                }
                chats.push({
                    id: chatId,
                    user: otherUser,
                    lastMessage: getMessagePreview(lastMessage),
                    lastTimestamp: lastMessage?.timestamp || null,
                    unread: isUnread
                });
            }
        });
        renderPrivateList(chats);
        updatePrivateBadge(unreadTotal);
        privateAlertsPrimed = true;
    });
}

if (sendBtn && messageInput) sendBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text) return;

    const target = getMessageTarget();
    if (!target) {
        privateEmpty.style.display = 'block';
        return;
    }

    const message = {
        username: currentUser,
        text,
        timestamp: Date.now(),
        type: 'text'
    };
    if (target.scope === 'group' && replyContext) {
        message.replyTo = replyContext;
    }

    await sendMessageToTarget(target, message);
    setTypingState(false);
    if (target.scope === 'group') {
        replyContext = null;
        replyPreview.classList.remove('active');
        replyText.textContent = '';
    }

    messageInput.value = '';
    messageInput.focus();
});

if (messageInput && sendBtn) messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

if (globalSearch) {
    globalSearch.addEventListener('input', () => {
        renderGlobalSearchResults(globalSearch.value);
    });
}

if (messageInput) {
    messageInput.addEventListener('input', () => {
        if (!messageInput.value.trim()) {
            setTypingState(false);
            return;
        }
        setTypingState(true);
        if (typingStopTimer) clearTimeout(typingStopTimer);
        typingStopTimer = setTimeout(() => setTypingState(false), 1800);
    });
    messageInput.addEventListener('blur', () => setTypingState(false));
}

if (imageBtn && imageInput) {
    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });
}

if (imageInput) imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const target = getMessageTarget();
    if (!target) {
        alert('Select a private chat first.');
        imageInput.value = '';
        return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
        alert('Media too large. Please use a smaller image/video (about 10MB max).');
        imageInput.value = '';
        return;
    }

    const reader = new FileReader();
    const isVideo = file.type && file.type.startsWith('video/');
    showUploadProgress(isVideo ? 'Preparing video...' : 'Preparing photo...', 20);
    reader.onload = async () => {
        const mediaData = reader.result;
        const message = isVideo
            ? {
                username: currentUser,
                timestamp: Date.now(),
                type: 'video',
                videoData: mediaData
            }
            : {
                username: currentUser,
                timestamp: Date.now(),
                type: 'image',
                imageData: mediaData
            };

        await sendMessageToTarget(target, message);
        showUploadProgress(isVideo ? 'Uploaded video' : 'Uploaded photo', 100);
        imageInput.value = '';
    };
    reader.readAsDataURL(file);
});

if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', () => fileInput.click());
}

if (fileInput) fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const target = getMessageTarget();
    if (!target) {
        alert('Select a private chat first.');
        fileInput.value = '';
        return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
        alert('File too large (about 10MB max).');
        fileInput.value = '';
        return;
    }
    try {
        const ts = Date.now();
        const path = `files/${currentUser}/${ts}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { url } = await uploadToStorage(path, file, 'Uploading file...');
        const message = {
            username: currentUser,
            timestamp: ts,
            type: 'file',
            fileUrl: url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream'
        };
        await sendMessageToTarget(target, message);
    } catch (error) {
        console.error('File upload failed', error);
        alert('Could not send file.');
    } finally {
        fileInput.value = '';
    }
});

function renderStickers() {
    if (!stickerPanel) return;
    stickerPanel.innerHTML = '';
    DEFAULT_STICKERS.forEach(sticker => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sticker-btn';
        btn.textContent = sticker;
        btn.addEventListener('click', async () => {
            const target = getMessageTarget();
            if (!target) {
                alert('Select a private chat first.');
                return;
            }
            const message = {
                username: currentUser,
                timestamp: Date.now(),
                type: 'sticker',
                sticker
            };
            await sendMessageToTarget(target, message);
        });
        stickerPanel.appendChild(btn);
    });
}

if (stickerBtn) {
    renderStickers();
    stickerBtn.addEventListener('click', () => {
        stickerPanel.classList.toggle('active');
    });
}

if (groupLoadOlderBtn) {
    groupLoadOlderBtn.addEventListener('click', () => {
        groupLimit += 200;
        loadGroupMessages();
    });
}

function renderGlobalSearchResults(queryText) {
    if (!searchResults) return;
    const term = String(queryText || '').trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!term) return;

    const userMatches = Object.keys(userProfiles || {})
        .filter((username) => username.toLowerCase().includes(term) || getDisplayName(username).toLowerCase().includes(term))
        .slice(0, 8);
    const groupMatches = (currentGroupMessages || [])
        .filter((msg) => (msg.text || '').toLowerCase().includes(term))
        .slice(-8)
        .reverse();
    const privateMatches = Object.entries(privateMessagesCache)
        .flatMap(([chatId, list]) => list.map((msg) => ({ chatId, ...msg })))
        .filter((msg) => (msg.text || '').toLowerCase().includes(term))
        .slice(-8)
        .reverse();

    if (!userMatches.length && !groupMatches.length && !privateMatches.length) {
        searchResults.innerHTML = '<div class="empty-state">No matches found.</div>';
        return;
    }

    userMatches.forEach((username) => {
        const row = document.createElement('div');
        row.className = 'user-item';
        row.textContent = `User: ${getDisplayName(username)}`;
        row.addEventListener('click', () => {
            if (username !== currentUser) {
                selectPrivateUser(username);
                document.querySelector('[data-tab="private"]')?.click();
            }
            searchResults.innerHTML = '';
        });
        searchResults.appendChild(row);
    });

    groupMatches.forEach((msg) => {
        const row = document.createElement('div');
        row.className = 'private-item';
        row.textContent = `Group: ${getDisplayName(msg.username)} - ${truncatePreview(msg.text || '')}`;
        row.addEventListener('click', () => {
            document.querySelector('[data-tab="group"]')?.click();
            searchResults.innerHTML = '';
        });
        searchResults.appendChild(row);
    });

    privateMatches.forEach((msg) => {
        const other = msg.chatId.split('_').find((u) => u !== currentUser);
        const row = document.createElement('div');
        row.className = 'private-item';
        row.textContent = `Private (${other || 'chat'}): ${truncatePreview(msg.text || '')}`;
        row.addEventListener('click', () => {
            if (other) selectPrivateUser(other);
            document.querySelector('[data-tab="private"]')?.click();
            searchResults.innerHTML = '';
        });
        searchResults.appendChild(row);
    });
}

if (privateLoadOlderBtn) {
    privateLoadOlderBtn.addEventListener('click', () => {
        privateLimit += 200;
        if (selectedPrivateId) {
            loadPrivateMessages(selectedPrivateId);
        }
    });
}

if (voiceBtn) voiceBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }
    const target = getMessageTarget();
    if (!target) {
        alert('Select a private chat first.');
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported on this device.');
        return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    const startedAt = startRecordingTimer();

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    mediaRecorder.onstop = async () => {
        clearTimeout(recordingTimeout);
        stopRecordingTimer();
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        const duration = Math.min(15, (Date.now() - startedAt) / 1000);

        if (blob.size > MAX_MEDIA_BYTES) {
            alert('Voice message too large. Try a shorter clip (15s max).');
            return;
        }

        const reader = new FileReader();
        showUploadProgress('Preparing voice...', 20);
        reader.onload = async () => {
            const audioData = reader.result;
            const message = {
                username: currentUser,
                timestamp: Date.now(),
                type: 'voice',
                audioData,
                duration
            };

            await sendMessageToTarget(target, message);
            showUploadProgress('Uploaded voice', 100);
        };
        reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    voiceBtn.textContent = 'Stop';

    recordingTimeout = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }, 15000);

    mediaRecorder.addEventListener('stop', () => {
        if (voiceBtn) voiceBtn.textContent = 'Voice';
    }, { once: true });
});

function getStoryReadKey(username) {
    return `dtubonge_story_read_${username}`;
}

function getStoryRead(username) {
    return Number(localStorage.getItem(getStoryReadKey(username))) || 0;
}

function setStoryRead(username, ts) {
    if (!username || !ts) return;
    localStorage.setItem(getStoryReadKey(username), String(ts));
}

function renderStoriesList() {
    if (!statusList) return;
    statusList.innerHTML = '';
    const now = Date.now();
    const usersWithStories = storyUsers.filter(u => {
        const items = storiesByUser[u] || [];
        return items.some(s => now - s.timestamp < 24 * 60 * 60 * 1000);
    });
    if (usersWithStories.length === 0) {
        statusEmpty.style.display = 'block';
        return;
    }
    statusEmpty.style.display = 'none';
    usersWithStories.forEach(username => {
        const items = (storiesByUser[username] || [])
            .filter(s => now - s.timestamp < 24 * 60 * 60 * 1000)
            .sort((a, b) => a.timestamp - b.timestamp);
        if (items.length === 0) return;
        const lastTs = items[items.length - 1].timestamp;
        const readTs = getStoryRead(username);
        const unread = lastTs > readTs;
        const item = document.createElement('div');
        item.className = `status-item ${unread ? 'unread' : ''}`;
        const avatar = buildAvatarElement(username, 'status-avatar-ring');
        const name = document.createElement('div');
        name.className = 'status-name';
        name.textContent = getDisplayName(username);
        item.appendChild(avatar);
        item.appendChild(name);
        item.addEventListener('click', () => openStoryViewer(username, items));
        statusList.appendChild(item);
    });
}

async function recordStoryView(story) {
    if (!story || !viewerUser || !currentUser || viewerUser === currentUser) return;
    try {
        await set(ref(db, `story_views/${viewerUser}/${story.id}/${currentUser}`), Date.now());
    } catch (error) {
        console.warn('Could not record story view', error);
    }
}

function renderStorySeenList(story) {
    if (!storySeenList) return;
    storySeenList.innerHTML = '';
    if (!story || viewerUser !== currentUser) return;
    get(ref(db, `story_views/${currentUser}/${story.id}`)).then((snapshot) => {
        const data = snapshot.val() || {};
        const viewers = Object.keys(data);
        storySeenList.textContent = viewers.length
            ? `Seen by: ${viewers.map((u) => getDisplayName(u)).join(', ')}`
            : 'Seen by: nobody yet';
    }).catch(() => {
        storySeenList.textContent = '';
    });
}

function openStoryViewer(username, items) {
    viewerUser = username;
    viewerStories = items || storiesByUser[username] || [];
    viewerIndex = 0;
    const displayName = getDisplayName(username);
    storyViewerName.textContent = displayName;
    const url = getAvatarUrl(username);
    if (url) {
        storyViewerAvatar.style.backgroundImage = `url("${url}")`;
        storyViewerAvatar.classList.add('has-image');
    } else {
        storyViewerAvatar.style.backgroundImage = '';
        storyViewerAvatar.classList.remove('has-image');
        storyViewerAvatar.textContent = username ? username.charAt(0).toUpperCase() : '';
    }
    storyDeleteBtn.style.display = username === currentUser ? 'inline-block' : 'none';
    storyPaused = false;
    storyViewerModal.style.display = 'flex';
    showCurrentStory();
}

function closeStoryViewer() {
    if (viewerTimer) {
        clearTimeout(viewerTimer);
        viewerTimer = null;
    }
    storyMedia.innerHTML = '';
    storyViewerModal.style.display = 'none';
    storyPaused = false;
    viewerUser = null;
    viewerStories = [];
    viewerIndex = 0;
}

function showCurrentStory() {
    if (!viewerStories || viewerStories.length === 0) {
        closeStoryViewer();
        return;
    }
    if (viewerIndex < 0) viewerIndex = 0;
    if (viewerIndex >= viewerStories.length) {
        closeStoryViewer();
        return;
    }
    if (viewerTimer) {
        clearTimeout(viewerTimer);
        viewerTimer = null;
    }
    const data = viewerStories[viewerIndex];
    recordStoryView(data);
    renderStorySeenList(data);
    storyMedia.innerHTML = '';
    storyProgress.style.width = '0%';
    if (data.type === 'image' && data.imageData) {
        const img = document.createElement('img');
        img.className = 'story-image';
        img.src = data.imageData;
        storyMedia.appendChild(img);
        const duration = 6000;
        const started = Date.now();
        function tick() {
            if (storyPaused) {
                viewerTimer = setTimeout(tick, 120);
                return;
            }
            const p = Math.min(100, ((Date.now() - started) / duration) * 100);
            storyProgress.style.width = `${p}%`;
            if (p < 100) {
                viewerTimer = setTimeout(tick, 50);
            } else {
                viewerIndex += 1;
                setStoryRead(viewerUser, data.timestamp);
                renderStoriesList();
                showCurrentStory();
            }
        }
        tick();
    } else if (data.type === 'image' && data.imageUrl) {
        const img = document.createElement('img');
        img.className = 'story-image';
        img.src = data.imageUrl;
        storyMedia.appendChild(img);
        const duration = 6000;
        const started = Date.now();
        function tickImg() {
            if (storyPaused) {
                viewerTimer = setTimeout(tickImg, 120);
                return;
            }
            const p = Math.min(100, ((Date.now() - started) / duration) * 100);
            storyProgress.style.width = `${p}%`;
            if (p < 100) {
                viewerTimer = setTimeout(tickImg, 50);
            } else {
                viewerIndex += 1;
                setStoryRead(viewerUser, data.timestamp);
                renderStoriesList();
                showCurrentStory();
            }
        }
        tickImg();
    } else if (data.type === 'video' && (data.videoData || data.videoUrl)) {
        const video = document.createElement('video');
        video.className = 'story-video';
        video.src = data.videoData || data.videoUrl;
        video.autoplay = true;
        video.controls = true;
        storyMedia.appendChild(video);
        function syncProgress() {
            if (storyPaused) {
                if (!video.paused) video.pause();
                viewerTimer = setTimeout(syncProgress, 120);
                return;
            }
            if (!video.duration || isNaN(video.duration)) {
                storyProgress.style.width = '0%';
            } else {
                const p = Math.min(100, (video.currentTime / video.duration) * 100);
                storyProgress.style.width = `${p}%`;
            }
            if (video.paused && !video.ended) {
                video.play().catch(() => {});
            }
            if (!video.paused && !video.ended) {
                viewerTimer = setTimeout(syncProgress, 50);
            }
        }
        syncProgress();
        video.addEventListener('ended', () => {
            setStoryRead(viewerUser, data.timestamp);
            renderStoriesList();
            viewerIndex += 1;
            showCurrentStory();
        });
    } else if ((data.type === 'audio' || data.type === 'voice') && (data.audioData || data.audioUrl)) {
        const audio = document.createElement('audio');
        audio.className = 'story-audio';
        audio.controls = true;
        audio.src = data.audioData || data.audioUrl;
        storyMedia.appendChild(audio);
        function syncAudioProgress() {
            if (storyPaused) {
                if (!audio.paused) audio.pause();
                viewerTimer = setTimeout(syncAudioProgress, 120);
                return;
            }
            if (!audio.duration || isNaN(audio.duration)) {
                storyProgress.style.width = '0%';
            } else {
                const p = Math.min(100, (audio.currentTime / audio.duration) * 100);
                storyProgress.style.width = `${p}%`;
            }
            if (audio.paused && !audio.ended) {
                audio.play().catch(() => {});
            }
            if (!audio.paused && !audio.ended) {
                viewerTimer = setTimeout(syncAudioProgress, 50);
            }
        }
        syncAudioProgress();
        audio.addEventListener('ended', () => {
            setStoryRead(viewerUser, data.timestamp);
            renderStoriesList();
            viewerIndex += 1;
            showCurrentStory();
        });
    } else if (data.type === 'text' && data.text) {
        const div = document.createElement('div');
        div.className = 'story-text';
        div.textContent = data.text;
        storyMedia.appendChild(div);
        const duration = Math.max(3000, Math.min(10000, data.text.length * 150));
        const started = Date.now();
        function tickText() {
            if (storyPaused) {
                viewerTimer = setTimeout(tickText, 120);
                return;
            }
            const p = Math.min(100, ((Date.now() - started) / duration) * 100);
            storyProgress.style.width = `${p}%`;
            if (p < 100) {
                viewerTimer = setTimeout(tickText, 50);
            } else {
                viewerIndex += 1;
                setStoryRead(viewerUser, data.timestamp);
                renderStoriesList();
                showCurrentStory();
            }
        }
        tickText();
    } else {
        const div = document.createElement('div');
        div.className = 'story-unsupported';
        div.textContent = 'Unsupported story';
        storyMedia.appendChild(div);
        viewerTimer = setTimeout(() => {
            viewerIndex += 1;
            showCurrentStory();
        }, 2000);
    }
}

if (closeStoryViewerBtn) {
    closeStoryViewerBtn.addEventListener('click', closeStoryViewer);
}
if (storyMedia) {
    let touchStartX = 0;
    storyMedia.addEventListener('mousedown', () => {
        storyPaused = true;
    });
    storyMedia.addEventListener('mouseup', () => {
        storyPaused = false;
    });
    storyMedia.addEventListener('mouseleave', () => {
        storyPaused = false;
    });
    storyMedia.addEventListener('touchstart', (event) => {
        touchStartX = event.touches?.[0]?.clientX || 0;
        storyPaused = true;
    }, { passive: true });
    storyMedia.addEventListener('touchend', (event) => {
        const endX = event.changedTouches?.[0]?.clientX || 0;
        const delta = endX - touchStartX;
        storyPaused = false;
        if (Math.abs(delta) > 40) {
            if (delta > 0) {
                viewerIndex = Math.max(0, viewerIndex - 1);
            } else {
                viewerIndex += 1;
            }
            showCurrentStory();
        }
    }, { passive: true });
}
if (storyPrev) {
    storyPrev.addEventListener('click', () => {
        viewerIndex = Math.max(0, viewerIndex - 1);
        showCurrentStory();
    });
}
if (storyNext) {
    storyNext.addEventListener('click', () => {
        viewerIndex += 1;
        showCurrentStory();
    });
}
if (storyDeleteBtn) {
    storyDeleteBtn.addEventListener('click', async () => {
        if (!viewerStories[viewerIndex]) return;
        const current = viewerStories[viewerIndex];
        if (viewerUser !== currentUser) return;
        const nodeRef = ref(db, `stories/${currentUser}/${current.id}`);
        await remove(nodeRef);
        viewerStories.splice(viewerIndex, 1);
        if (viewerIndex >= viewerStories.length) viewerIndex = viewerStories.length - 1;
        if (viewerStories.length === 0) {
            closeStoryViewer();
        } else {
            showCurrentStory();
        }
    });
}

function subscribeStories() {
    const storiesRef = ref(db, 'stories');
    onValue(storiesRef, snapshot => {
        const raw = snapshot.val() || {};
        const now = Date.now();
        const mapped = {};
        Object.entries(raw).forEach(([username, items]) => {
            if (!items) return;
            const list = Object.entries(items).map(([id, v]) => ({ id, ...v }))
                .filter(s => s && s.timestamp && now - s.timestamp < 24 * 60 * 60 * 1000)
                .sort((a, b) => a.timestamp - b.timestamp);
            if (list.length > 0) {
                mapped[username] = list;
            }
        });
        storiesByUser = mapped;
        const users = Object.keys(mapped);
        users.sort((a, b) => {
            const aTs = mapped[a][mapped[a].length - 1].timestamp;
            const bTs = mapped[b][mapped[b].length - 1].timestamp;
            if (a === currentUser) return -1;
            if (b === currentUser) return 1;
            return bTs - aTs;
        });
        storyUsers = users;
        renderStoriesList();
        // If viewer is open and the current user's stories changed, refresh viewer list
        if (viewerUser && storiesByUser[viewerUser]) {
            viewerStories = storiesByUser[viewerUser];
        }
    });
}

if (addStoryBtn && storyInput) {
    addStoryBtn.addEventListener('click', () => {
        storyInput.click();
    });
    if (myStatusEl) {
        myStatusEl.addEventListener('click', () => {
            storyInput.click();
        });
    }
    storyInput.addEventListener('change', async (e) => {
        try {
            if (!currentUser) {
                alert('Session expired. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > MAX_MEDIA_BYTES) {
                alert('Media too large. Use a smaller file.');
                storyInput.value = '';
                return;
            }
            const isVideo = file.type && file.type.startsWith('video/');
            const isAudio = file.type && file.type.startsWith('audio/');
            const ts = Date.now();
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            const path = `stories/${currentUser}/${ts}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const label = isVideo ? 'Uploading status video...' : isAudio ? 'Uploading status audio...' : 'Uploading status photo...';
            const { url } = await uploadToStorage(path, file, label);
            let payload;
            if (isVideo) {
                payload = { username: currentUser, timestamp: ts, type: 'video', videoUrl: url };
            } else if (isAudio) {
                payload = { username: currentUser, timestamp: ts, type: 'audio', audioUrl: url };
            } else {
                payload = { username: currentUser, timestamp: ts, type: 'image', imageUrl: url };
            }
            const userStoriesRef = ref(db, `stories/${currentUser}`);
            const newRef = push(userStoriesRef);
            await set(newRef, payload);
            showUploadProgress(isVideo ? 'Added status video' : isAudio ? 'Added status audio' : 'Added status photo', 100);
            storyInput.value = '';
        } catch (err) {
            console.error('Status upload error', err);
            alert('Could not start status upload. Please try again.');
        }
    });
}

if (addTextStatusBtn && textStatusInput) {
    addTextStatusBtn.addEventListener('click', async () => {
        try {
            if (!currentUser) {
                alert('Session expired. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            const text = (textStatusInput.value || '').trim();
            if (!text) return;
            const userStoriesRef = ref(db, `stories/${currentUser}`);
            const newRef = push(userStoriesRef);
            await set(newRef, { username: currentUser, timestamp: Date.now(), type: 'text', text });
            textStatusInput.value = '';
        } catch (err) {
            console.error('Text status error', err);
            alert('Failed to post text status.');
        }
    });
}

if (recordVoiceStatusBtn) {
    recordVoiceStatusBtn.addEventListener('click', async () => {
        if (statusRecorder && statusRecorder.state === 'recording') {
            statusRecorder.stop();
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Voice recording is not supported on this device.');
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        statusRecorder = new MediaRecorder(stream);
        const startedAt = startRecordingTimer();
        statusRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        statusRecorder.onstop = async () => {
            try {
                clearTimeout(statusRecordingTimeout);
                stopRecordingTimer();
                const blob = new Blob(chunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                if (blob.size > MAX_MEDIA_BYTES) {
                    alert('Voice status too large. Try a shorter clip.');
                    return;
                }
                const ts = Date.now();
                const path = `stories/${currentUser}/${ts}_voice.webm`;
                const { url } = await uploadToStorage(path, blob, 'Uploading voice status...');
                const userStoriesRef = ref(db, `stories/${currentUser}`);
                const newRef = push(userStoriesRef);
                await set(newRef, { username: currentUser, timestamp: ts, type: 'voice', audioUrl: url });
                showUploadProgress('Added voice status', 100);
            } catch (err) {
                console.error('Voice status error', err);
                alert('Failed to process voice status.');
            }
        };
        statusRecorder.start();
        recordVoiceStatusBtn.textContent = 'Stop Voice';
        statusRecordingTimeout = setTimeout(() => {
            if (statusRecorder && statusRecorder.state === 'recording') {
                statusRecorder.stop();
            }
        }, 15000);
        statusRecorder.addEventListener('stop', () => {
            recordVoiceStatusBtn.textContent = 'Voice Status';
        }, { once: true });
    });
}

async function loadUserColor() {
    const userRef = ref(db, `users/${currentUser}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        await update(userRef, {
            username: currentUser,
            color: '#e91e63',
            joinDate: Date.now(),
            online: true
        });
    }
}

if (window.cordova) {
    document.addEventListener('deviceready', initializeNativePush, false);
}

window.addEventListener('online', () => {
    flushQueuedMessages();
    registerAppNotification({
        scope: 'group',
        sender: currentUser,
        title: 'Back online',
        body: 'Queued messages are being sent.'
    });
});

window.addEventListener('offline', () => {
    registerAppNotification({
        scope: 'group',
        sender: currentUser,
        title: 'You are offline',
        body: 'New messages will be queued automatically.'
    });
});

await loadUserColor();
await migrateGeneralChannelMessages();
updatePresence();
subscribeChannels();
loadGroupMessages();
refreshPrivateList();
subscribeStories();
subscribeMarketProducts();
subscribeCart();
subscribeOrderHistory();
subscribeTypingIndicators();
subscribePinnedMessages();
renderMuteState();
flushQueuedMessages();
if (channelSelect) renderChannels();
if (privateBackBtn) {
    privateBackBtn.addEventListener('click', () => {
        if (privateLayout) {
            privateLayout.classList.remove('split');
        }
    });
}
