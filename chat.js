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

let currentTab = 'group';
let selectedPrivateId = null;
let selectedPrivateName = null;
let replyContext = null;
let onlineUsers = {};
let mediaRecorder = null;
let recordingTimeout = null;
let recordingInterval = null;
const MAX_MEDIA_BYTES = 10_000_000;

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

function renderMessage(container, msg, isOwn, showReply, showReplyButton, showDeleteButton) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'user-message' : 'other-message'} ${msg.type === 'image' ? 'image-message' : ''} ${msg.type === 'voice' ? 'voice-message' : ''}`;

    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerHTML = `<span class="message-sender">${msg.username}</span>`;

    if (showReplyButton) {
        const replyBtn = document.createElement('button');
        replyBtn.className = 'reply-btn';
        replyBtn.textContent = 'Reply';
        replyBtn.addEventListener('click', () => setReplyContext(msg));
        header.appendChild(replyBtn);
    }

    if (showDeleteButton) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteGroupMessage(msg.id));
        header.appendChild(deleteBtn);
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
            renderMessage(groupMessages, msg, msg.username === currentUser, true, true, false);
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
            renderMessage(privateMessages, msg, msg.username === currentUser, false, false, false);
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
        Object.keys(data).forEach(key => {
            if (data[key].online) {
                onlineUsers[key] = data[key];
            }
        });
        const count = Object.keys(onlineUsers).length;
        onlineCount.textContent = `${count} online`;
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
        item.innerHTML = `
            <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${username}</div>
                <div class="user-status">Online</div>
            </div>
        `;
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
        item.innerHTML = `
            <div class="user-avatar">${chat.user.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${chat.user}</div>
                <div class="user-status">${chat.lastMessage || 'No messages yet'}</div>
            </div>
        `;
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
