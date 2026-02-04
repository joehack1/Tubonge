// Import Firebase v9+ (modern version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onDisconnect, remove, limitToLast, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Firebase Configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM elements
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username');
const clearChatBtn = document.getElementById('clear-chat-btn');
const chatBody = document.getElementById('chat-body');
const emptyChat = document.getElementById('empty-chat');
const onlineUsersDiv = document.getElementById('online-users');
const onlineCount = document.getElementById('online-count');

// User state
let currentUser = null;
let userId = null;
let username = null;
let userColor = null;
let currentChatMode = 'group'; // 'group' or 'private'
let selectedUserId = null;
let selectedUsername = null;
let onlineUsers = {};

// Generate a random color for user messages
function generateUserColor() {
    const colors = [
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688',
        '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107',
        '#FF9800', '#FF5722', '#795548', '#607D8B'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        userId = user.uid;
        setupUserPresence();
        loadMessages();
        enableChat();
    } else {
        // User is signed out
        disableChat();
    }
});

// Join chat button
saveUsernameBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name) {
        username = name;
        userColor = generateUserColor();

        // Sign in anonymously to Firebase
        signInAnonymously(auth)
            .then(() => {
                console.log("Signed in anonymously");
                // Save username to Firebase
                const userRef = ref(database, 'users/' + userId);
                set(userRef, {
                    username: username,
                    color: userColor,
                    lastActive: Date.now(),
                    online: true
                });
            })
            .catch((error) => {
                console.error("Auth error:", error);
                alert("Error joining chat. Please try again.");
            });
    } else {
        alert("Please enter a username");
    }
});

// Setup user presence tracking
function setupUserPresence() {
    // User is online
    const userStatusRef = ref(database, 'users/' + userId);

    // Set user as online
    set(userStatusRef, {
        username: username,
        color: userColor,
        online: true,
        lastActive: Date.now()
    });

    // When user disconnects, set to offline
    onDisconnect(userStatusRef).update({
        online: false,
        lastActive: Date.now()
    });

    // Listen for online users
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        let onlineCountNum = 0;
        let userList = [];

        if (users) {
            Object.keys(users).forEach((key) => {
                if (users[key].online) {
                    onlineCountNum++;
                    if (users[key].username !== username) {
                        userList.push(users[key].username);
                    }
                }
            });
        }

        onlineCount.textContent = `${onlineCountNum} user${onlineCountNum !== 1 ? 's' : ''} online`;

        // Show online users
        if (userList.length > 0) {
            onlineUsersDiv.innerHTML = `<span class="online-dot"></span> Online: ${userList.join(', ')}`;
        } else {
            onlineUsersDiv.innerHTML = `<span class="online-dot"></span> You're the only one online`;
        }
    });
}

// Load messages from Firebase
function loadMessages() {
    const messagesRef = ref(database, 'messages');
    const recentMessagesQuery = query(messagesRef, limitToLast(100));

    onValue(recentMessagesQuery, (snapshot) => {
        messageContainer.innerHTML = '';
        const messages = snapshot.val();

        if (!messages || Object.keys(messages).length === 0) {
            emptyChat.style.display = 'block';
            return;
        }

        emptyChat.style.display = 'none';

        // Convert object to array and sort by timestamp
        const messagesArray = Object.entries(messages).map(([id, msg]) => ({
            id,
            ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);

        messagesArray.forEach(msg => {
            const messageDiv = document.createElement('div');
            const isCurrentUser = msg.userId === userId;

            messageDiv.className = `message ${isCurrentUser ? 'user-message' : 'other-message'}`;

            // Set custom color for user's own messages
            if (isCurrentUser) {
                messageDiv.style.backgroundColor = userColor;
            }

            const senderSpan = document.createElement('div');
            senderSpan.className = 'message-sender';
            senderSpan.textContent = msg.username;

            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = msg.text;

            const timeSpan = document.createElement('div');
            timeSpan.className = 'message-time';
            timeSpan.textContent = formatTime(msg.timestamp);

            messageDiv.appendChild(senderSpan);
            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(timeSpan);

            messageContainer.appendChild(messageDiv);
        });

        // Scroll to bottom
        setTimeout(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 100);
    });
}

// Send message function
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;

    // Create message object
    const message = {
        userId: userId,
        username: username,
        text: text,
        timestamp: Date.now(),
        color: userColor
    };

    // Save to Firebase
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef);

    set(newMessageRef, message)
        .then(() => {
            // Clear input
            messageInput.value = '';
            messageInput.focus();
        })
        .catch((error) => {
            console.error("Error sending message:", error);
            alert("Error sending message. Please try again.");
        });
}

// Send message on button click
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter key press
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Enable chat interface
function enableChat() {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    usernameInput.disabled = true;
    saveUsernameBtn.disabled = true;
    saveUsernameBtn.textContent = "Joined";
    messageInput.placeholder = `Message as ${username}...`;
    messageInput.focus();
    clearChatBtn.disabled = false;
}

// Disable chat interface
function disableChat() {
    messageInput.disabled = true;
    sendBtn.disabled = true;
    usernameInput.disabled = false;
    saveUsernameBtn.disabled = false;
    saveUsernameBtn.textContent = "Join Chat";
    clearChatBtn.disabled = true;
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Clear chat function (admin only - for demo purposes)
clearChatBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear ALL messages for everyone? This cannot be undone.')) {
        const messagesRef = ref(database, 'messages');
        remove(messagesRef)
            .then(() => {
                alert('All messages cleared.');
            })
            .catch((error) => {
                console.error("Error clearing messages:", error);
                alert("Error clearing messages. You might need to set proper database rules.");
            });
    }
});

// Initialize
disableChat();

// Auto-focus on username input
usernameInput.focus();

// Allow Enter key in username input
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveUsernameBtn.click();
    }
});

// Make Firebase functions available globally for debugging
window.firebaseApp = app;
window.firebaseDatabase = database;
window.firebaseAuth = auth;

// Private chat functionality
function switchToGroupChat() {
    currentChatMode = 'group';
    selectedUserId = null;
    selectedUsername = null;
    document.getElementById('group-tab').classList.add('active');
    document.getElementById('private-tab').classList.remove('active');
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    messageInput.placeholder = `Message as ${username}...`;
    loadMessages();
}

function switchToPrivateChat(userId, userName) {
    currentChatMode = 'private';
    selectedUserId = userId;
    selectedUsername = userName;
    document.getElementById('private-tab').classList.add('active');
    document.getElementById('group-tab').classList.remove('active');
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-user-id="${userId}"]`).classList.add('active');
    messageInput.placeholder = `Private message to ${userName}...`;
    loadPrivateMessages();
}

function loadPrivateMessages() {
    if (!selectedUserId) return;

    const chatId = [userId, selectedUserId].sort().join('_');
    const privateMessagesRef = ref(database, `private_messages/${chatId}`);
    const recentMessagesQuery = query(privateMessagesRef, limitToLast(100));

    onValue(recentMessagesQuery, (snapshot) => {
        messageContainer.innerHTML = '';
        const messages = snapshot.val();

        if (!messages || Object.keys(messages).length === 0) {
            emptyChat.style.display = 'block';
            emptyChat.innerHTML = `
                <i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 15px; color: #666;"></i>
                <p>Private conversation with ${selectedUsername}</p>
                <p style="font-size: 0.9rem; color: #888;">Messages are only visible to you and ${selectedUsername}</p>
            `;
            return;
        }

        emptyChat.style.display = 'none';

        const messagesArray = Object.entries(messages).map(([id, msg]) => ({
            id,
            ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);

        messagesArray.forEach(msg => {
            const messageDiv = document.createElement('div');
            const isCurrentUser = msg.userId === userId;

            messageDiv.className = `message ${isCurrentUser ? 'user-message' : 'other-message'}`;

            if (isCurrentUser) {
                messageDiv.style.backgroundColor = userColor;
            }

            const senderSpan = document.createElement('div');
            senderSpan.className = 'message-sender';
            senderSpan.textContent = msg.username;

            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = msg.text;

            const timeSpan = document.createElement('div');
            timeSpan.className = 'message-time';
            timeSpan.textContent = formatTime(msg.timestamp);

            messageDiv.appendChild(senderSpan);
            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(timeSpan);

            messageContainer.appendChild(messageDiv);
        });

        setTimeout(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 100);
    });
}

function sendPrivateMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser || !selectedUserId) return;

    const chatId = [userId, selectedUserId].sort().join('_');
    const message = {
        userId: userId,
        username: username,
        text: text,
        timestamp: Date.now(),
        color: userColor
    };

    const privateMessagesRef = ref(database, `private_messages/${chatId}`);
    const newMessageRef = push(privateMessagesRef);

    set(newMessageRef, message)
        .then(() => {
            messageInput.value = '';
            messageInput.focus();
        })
        .catch((error) => {
            console.error("Error sending private message:", error);
            alert("Error sending private message. Please try again.");
        });
}

function updateUserList() {
    const userListDiv = document.getElementById('user-list');
    userListDiv.innerHTML = '';

    Object.keys(onlineUsers).forEach(userId => {
        if (userId !== currentUser.uid) {
            const user = onlineUsers[userId];
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.setAttribute('data-user-id', userId);

            userItem.innerHTML = `
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-status"></div>
                </div>
            `;

            userItem.addEventListener('click', () => {
                switchToPrivateChat(userId, user.username);
            });

            userListDiv.appendChild(userItem);
        }
    });
}

// Tab event listeners
document.getElementById('group-tab').addEventListener('click', switchToGroupChat);
document.getElementById('private-tab').addEventListener('click', () => {
    if (!selectedUserId) {
        alert('Please select a user to start a private chat.');
    }
});

// Override send message function
const originalSendMessage = sendMessage;
sendMessage = function() {
    if (currentChatMode === 'private') {
        sendPrivateMessage();
    } else {
        originalSendMessage();
    }
};

// Update setupUserPresence to populate onlineUsers
const originalSetupUserPresence = setupUserPresence;
setupUserPresence = function() {
    originalSetupUserPresence();

    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        onlineUsers = {};

        if (users) {
            Object.keys(users).forEach((key) => {
                if (users[key].online) {
                    onlineUsers[key] = users[key];
                }
            });
        }

        updateUserList();
    });
};

// Profile Management
function openProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    const profileUsername = document.getElementById('profile-username');
    const profileBio = document.getElementById('profile-bio');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const profileAvatarImg = document.getElementById('profile-avatar-img');

    // Load current user data
    profileUsername.value = username || '';
    profileBio.value = '';

    // Load avatar
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            profileBio.value = userData.bio || '';
            if (userData.avatar) {
                profileAvatarImg.src = userData.avatar;
                profileAvatarImg.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            } else {
                profileAvatarImg.style.display = 'none';
                avatarPlaceholder.style.display = 'flex';
                avatarPlaceholder.textContent = username.charAt(0).toUpperCase();
            }

            // Load stats
            document.getElementById('messages-sent').textContent = userData.messagesSent || 0;
            document.getElementById('online-time').textContent = userData.onlineTime ? Math.floor(userData.onlineTime / 3600000) + 'h' : '0h';
            document.getElementById('join-date').textContent = userData.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'Today';
        }
    });

    profileModal.style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function saveProfile() {
    const newUsername = document.getElementById('profile-username').value.trim();
    const newBio = document.getElementById('profile-bio').value.trim();

    if (newUsername) {
        const userRef = ref(database, 'users/' + userId);
        set(userRef, {
            username: newUsername,
            bio: newBio,
            color: userColor,
            online: true,
            lastActive: Date.now(),
            messagesSent: 0,
            onlineTime: 0,
            joinDate: Date.now()
        }, { merge: true }).then(() => {
            username = newUsername;
            messageInput.placeholder = `Message as ${username}...`;
            showNotification('Profile updated successfully!');
            closeProfileModal();
        }).catch((error) => {
            console.error("Error updating profile:", error);
            alert("Error updating profile. Please try again.");
        });
    } else {
        alert("Username cannot be empty.");
    }
}

// Avatar Upload
function uploadAvatar(file) {
    if (!file) return;

    const storage = getStorage();
    const avatarRef = storageRef(storage, `avatars/${userId}_${Date.now()}.jpg`);

    uploadBytes(avatarRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            const userRef = ref(database, 'users/' + userId);
            set(userRef, { avatar: downloadURL }, { merge: true }).then(() => {
                showNotification('Profile picture updated!');
                openProfileModal(); // Refresh modal
            });
        });
    }).catch((error) => {
        console.error("Error uploading avatar:", error);
        alert("Error uploading profile picture. Please try again.");
    });
}

// Image Sharing
function openImageModal() {
    document.getElementById('image-modal').style.display = 'flex';
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
    document.getElementById('image-preview').innerHTML = `
        <div class="image-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to select an image</p>
        </div>
    `;
    document.getElementById('image-caption').value = '';
}

function shareImage() {
    const fileInput = document.getElementById('image-upload');
    const caption = document.getElementById('image-caption').value.trim();

    if (!fileInput.files[0]) {
        alert("Please select an image to share.");
        return;
    }

    const file = fileInput.files[0];
    const storage = getStorage();
    const imageRef = storageRef(storage, `images/${userId}_${Date.now()}_${file.name}`);

    uploadBytes(imageRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            const message = {
                userId: userId,
                username: username,
                imageUrl: downloadURL,
                caption: caption,
                type: 'image',
                timestamp: Date.now(),
                color: userColor
            };

            const messagesRef = currentChatMode === 'private' ?
                ref(database, `private_messages/${[userId, selectedUserId].sort().join('_')}`) :
                ref(database, 'messages');

            const newMessageRef = push(messagesRef);
            set(newMessageRef, message).then(() => {
                showNotification('Image shared successfully!');
                closeImageModal();
            });
        });
    }).catch((error) => {
        console.error("Error sharing image:", error);
        alert("Error sharing image. Please try again.");
    });
}

// Event Listeners
document.getElementById('open-profile-btn').addEventListener('click', openProfileModal);
document.getElementById('close-profile-modal').addEventListener('click', closeProfileModal);
document.getElementById('cancel-profile').addEventListener('click', closeProfileModal);
document.getElementById('save-profile').addEventListener('click', saveProfile);

document.getElementById('upload-avatar-btn').addEventListener('click', () => {
    document.getElementById('avatar-upload').click();
});

document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadAvatar(file);
    }
});

document.getElementById('close-image-modal').addEventListener('click', closeImageModal);
document.getElementById('cancel-image').addEventListener('click', closeImageModal);
document.getElementById('share-image').addEventListener('click', shareImage);

document.getElementById('image-preview').addEventListener('click', () => {
    document.getElementById('image-upload').click();
});

document.getElementById('image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 10px;">
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Add image share button to chat footer
const chatFooter = document.querySelector('.chat-footer');
const imageBtn = document.createElement('button');
imageBtn.id = 'image-btn';
imageBtn.innerHTML = '<i class="fas fa-image"></i>';
imageBtn.className = 'image-btn';
imageBtn.addEventListener('click', openImageModal);
chatFooter.insertBefore(imageBtn, messageInput);

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span style="margin-left: 10px;">${message}</span>
    `;
    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Welcome message in console
console.log('%cDTubonge Chat App', 'color: #e91e63; font-size: 16px; font-weight: bold;');
console.log('%cWelcome to the chat!', 'color: #ff69b4;');
