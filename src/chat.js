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

const logoutBtn = document.getElementById('logout-btn');
const sessionUser = document.getElementById('session-user');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
// ... additional initialization code from original chat.js
