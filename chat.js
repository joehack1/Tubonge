import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onDisconnect, remove, limitToLast, query, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
const voiceBtn = document.getElementById('voice-btn');
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
const profileModal = document.getElementById('profile-modal');
const profileDisplay = document.getElementById('profile-display');
const profileBio = document.getElementById('profile-bio');
const avatarGrid = document.getElementById('avatar-grid');
const closeProfileBtn = document.getElementById('close-profile');
const cancelProfileBtn = document.getElementById('cancel-profile');
const saveProfileBtn = document.getElementById('save-profile');
const headerAvatar = document.getElementById('header-avatar');
const viewProfileModal = document.getElementById('view-profile-modal');
const closeViewProfileBtn = document.getElementById('close-view-profile');
const viewProfileAvatar = document.getElementById('view-profile-avatar');
const viewProfileName = document.getElementById('view-profile-name');
const viewProfileBio = document.getElementById('view-profile-bio');
const viewProfileStatus = document.getElementById('view-profile-status');
const viewProfileJoin = document.getElementById('view-profile-join');

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
const MAX_MEDIA_BYTES = 10_000_000;
const USER_COLORS = ['#e91e63', '#00bcd4', '#8bc34a', '#ff9800', '#9c27b0', '#3f51b5', '#795548'];
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

const tabs = document.querySelectorAll('.chat-tabs .tab-btn');
const panels = {
    group: document.getElementById('panel-group'),
    private: document.getElementById('panel-private'),
    users: document.getElementById('panel-users')
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        Object.keys(panels).forEach(key => {
            panels[key].classList.toggle('active', key === currentTab);
        });
    });
});

sessionUser.textContent = currentUser ? `@${currentUser}` : '';

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('dtubonge_session');
    localStorage.removeItem('dtubonge_admin');
    window.location.href = 'login.html';
});

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

function openProfileModal() {
    const profile = userProfiles[currentUser] || {};
    profileDisplay.value = profile.displayName || '';
    profileBio.value = profile.bio || '';
    selectedAvatarUrl = profile.avatarUrl || DEFAULT_AVATARS[0];
    renderAvatarGrid();
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

function renderMessage(container, msg, isOwn, showReply, showReplyButton, showDeleteButton, useUserColors) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'user-message' : 'other-message'} ${msg.type === 'image' ? 'image-message' : ''} ${msg.type === 'voice' ? 'voice-message' : ''}`;
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
        deleteBtn.addEventListener('click', () => deleteGroupMessage(msg.id));
        actionWrap.appendChild(deleteBtn);
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
        messageDiv.appendChild(image);
        if (msg.caption) {
            const caption = document.createElement('div');
            caption.className = 'message-text';
            caption.textContent = msg.caption;
            messageDiv.appendChild(caption);
        }
    } else if (msg.type === 'voice' && msg.audioData) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = msg.audioData;
        audio.className = 'voice-audio';
        messageDiv.appendChild(audio);
        if (msg.duration) {
            const duration = document.createElement('div');
            duration.className = 'message-time';
            duration.textContent = `Voice · ${Math.round(msg.duration)}s`;
            messageDiv.appendChild(duration);
        }
    } else {
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = msg.text;
        messageDiv.appendChild(textDiv);
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    header.appendChild(senderWrap);
    header.appendChild(actionWrap);
    messageDiv.appendChild(header);
    messageDiv.appendChild(timeDiv);

    container.appendChild(messageDiv);
}

function deleteGroupMessage(messageId) {
    const messageRef = ref(db, `messages/${messageId}`);
    remove(messageRef);
}

function loadGroupMessages() {
    const messagesRef = ref(db, 'messages');
    const recentMessages = query(messagesRef, limitToLast(200));

    onValue(recentMessages, snapshot => {
        groupMessages.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            groupEmpty.style.display = 'block';
            return;
        }
        groupEmpty.style.display = 'none';
        const messages = Object.entries(data).map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            renderMessage(groupMessages, msg, msg.username === currentUser, true, true, false, true);
        });
    });
}

function loadPrivateMessages(chatId) {
    if (!chatId) {
        privateMessages.innerHTML = '';
        privateEmpty.style.display = 'block';
        return;
    }

    const messagesRef = ref(db, `private_messages/${chatId}`);
    const recentMessages = query(messagesRef, limitToLast(200));

    onValue(recentMessages, snapshot => {
        privateMessages.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            privateEmpty.style.display = 'block';
            return;
        }
        privateEmpty.style.display = 'none';
        const messages = Object.entries(data).map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            renderMessage(privateMessages, msg, msg.username === currentUser, false, false, false, false);
        });
    });
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
        renderUserList();
    });
}

function renderUserList() {
    userList.innerHTML = '';
    userListMobile.innerHTML = '';

    Object.keys(onlineUsers).forEach(username => {
        if (username === currentUser) return;
        const item = document.createElement('div');
        item.className = 'user-item';
        const avatar = buildAvatarElement(username, 'user-avatar');
        avatar.addEventListener('click', (event) => {
            event.stopPropagation();
            openUserProfile(username);
        });
        item.innerHTML = `
            <div class="user-info">
                <div class="user-name">${getDisplayName(username)}</div>
                <div class="user-status">Online</div>
            </div>
        `;
        item.prepend(avatar);
        item.addEventListener('click', () => selectPrivateUser(username));

        const mobileItem = item.cloneNode(true);
        mobileItem.addEventListener('click', () => selectPrivateUser(username));
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
        item.className = `private-item ${chat.user === selectedPrivateName ? 'active' : ''}`;
        const avatar = buildAvatarElement(chat.user, 'user-avatar');
        avatar.addEventListener('click', (event) => {
            event.stopPropagation();
            openUserProfile(chat.user);
        });
        item.innerHTML = `
            <div class="user-info">
                <div class="user-name">${getDisplayName(chat.user)}</div>
                <div class="user-status">${chat.lastMessage || 'No messages yet'}</div>
            </div>
        `;
        item.prepend(avatar);
        item.addEventListener('click', () => selectPrivateUser(chat.user));
        privateList.appendChild(item);
    });
}

function selectPrivateUser(username) {
    selectedPrivateName = username;
    selectedPrivateId = getChatId(currentUser, username);
    loadPrivateMessages(selectedPrivateId);
    if (currentTab !== 'private') {
        document.querySelector('[data-tab="private"]').click();
    }
    refreshPrivateList();
}

function refreshPrivateList() {
    const privateRef = ref(db, 'private_messages');
    onValue(privateRef, snapshot => {
        const data = snapshot.val() || {};
        const chats = [];
        Object.keys(data).forEach(chatId => {
            if (!chatId.includes(currentUser)) return;
            const messages = Object.values(data[chatId]);
            const lastMessage = messages.sort((a, b) => b.timestamp - a.timestamp)[0];
            const otherUser = chatId.split('_').find(name => name !== currentUser);
            if (otherUser) {
                chats.push({
                    id: chatId,
                    user: otherUser,
                    lastMessage: lastMessage?.text || ''
                });
            }
        });
        renderPrivateList(chats);
    });
}

sendBtn.addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text) return;

    if (currentTab === 'private') {
        if (!selectedPrivateId) {
            privateEmpty.style.display = 'block';
            return;
        }
        const message = {
            username: currentUser,
            text,
            timestamp: Date.now(),
            type: 'text'
        };
        const messagesRef = ref(db, `private_messages/${selectedPrivateId}`);
        const newMessageRef = push(messagesRef);
        await set(newMessageRef, message);
    } else {
        const message = {
            username: currentUser,
            text,
            timestamp: Date.now(),
            type: 'text'
        };
        if (replyContext) {
            message.replyTo = replyContext;
        }
        const messagesRef = ref(db, 'messages');
        const newMessageRef = push(messagesRef);
        await set(newMessageRef, message);
        replyContext = null;
        replyPreview.classList.remove('active');
        replyText.textContent = '';
    }

    messageInput.value = '';
    messageInput.focus();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (currentTab === 'private' && !selectedPrivateId) {
        alert('Select a private chat first.');
        imageInput.value = '';
        return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
        alert('Image too large. Please use a smaller image (about 1.5MB max).');
        imageInput.value = '';
        return;
    }

    const reader = new FileReader();
    showUploadProgress('Preparing photo...', 20);
    reader.onload = async () => {
        const imageData = reader.result;
        const message = {
            username: currentUser,
            timestamp: Date.now(),
            type: 'image',
            imageData
        };

        const messagesRef = currentTab === 'private'
            ? ref(db, `private_messages/${selectedPrivateId}`)
            : ref(db, 'messages');
        const newMessageRef = push(messagesRef);
        await set(newMessageRef, message);
        showUploadProgress('Uploaded photo', 100);
        imageInput.value = '';
    };
    reader.readAsDataURL(file);
});

voiceBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }
    if (currentTab === 'private' && !selectedPrivateId) {
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

            const messagesRef = currentTab === 'private'
                ? ref(db, `private_messages/${selectedPrivateId}`)
                : ref(db, 'messages');
            const newMessageRef = push(messagesRef);
            await set(newMessageRef, message);
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
        voiceBtn.textContent = 'Voice';
    }, { once: true });
});

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

await loadUserColor();
updatePresence();
loadGroupMessages();
refreshPrivateList();
