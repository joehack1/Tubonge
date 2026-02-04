import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const adminStatus = document.getElementById('admin-status');
const adminLogout = document.getElementById('admin-logout');
const adminMessages = document.getElementById('admin-messages');
const adminEmpty = document.getElementById('admin-empty');

const adminSession = localStorage.getItem('dtubonge_admin');
if (adminSession !== 'true') {
    window.location.href = 'login.html';
}

adminStatus.textContent = 'Admin mode active';

adminLogout.addEventListener('click', () => {
    localStorage.removeItem('dtubonge_admin');
    window.location.href = 'login.html';
});

function deleteMessage(messageId) {
    const messageRef = ref(db, `messages/${messageId}`);
    remove(messageRef);
}

const messagesRef = ref(db, 'messages');

onValue(messagesRef, snapshot => {
    adminMessages.innerHTML = '';
    const data = snapshot.val();
    if (!data) {
        adminEmpty.style.display = 'block';
        return;
    }
    adminEmpty.style.display = 'none';

    const messages = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => b.timestamp - a.timestamp);

    messages.forEach(msg => {
        const row = document.createElement('div');
        row.className = 'admin-message';
        row.innerHTML = `
            <div>
                <div class="admin-message-header">${msg.username} · ${new Date(msg.timestamp).toLocaleString()}</div>
                <div class="admin-message-text">${msg.text}</div>
            </div>
            <button class="delete-btn">Delete</button>
        `;
        row.querySelector('button').addEventListener('click', () => deleteMessage(msg.id));
        adminMessages.appendChild(row);
    });
});
