// Firebase v9+ (Realtime Database only)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const ADMIN_PASSWORD = "Ksh999*7";

const loginTabBtn = document.querySelector('[data-tab="login"]');
const signupTabBtn = document.querySelector('[data-tab="signup"]');
const loginPanel = document.getElementById('tab-login');
const signupPanel = document.getElementById('tab-signup');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const adminLink = document.getElementById('admin-link');
const adminPanel = document.getElementById('admin-panel');
const adminPassword = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const authStatus = document.getElementById('auth-status');

function setStatus(message, isError = false) {
    authStatus.textContent = message;
    authStatus.className = isError ? 'auth-status error' : 'auth-status';
}

function setActiveTab(tab) {
    if (tab === 'login') {
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        loginPanel.classList.add('active');
        signupPanel.classList.remove('active');
    } else {
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupPanel.classList.add('active');
        loginPanel.classList.remove('active');
    }
    setStatus('');
}

loginTabBtn.addEventListener('click', () => setActiveTab('login'));
signupTabBtn.addEventListener('click', () => setActiveTab('signup'));

adminLink.addEventListener('click', () => {
    adminPanel.classList.toggle('active');
    adminPassword.focus();
});

function saveSession(username) {
    localStorage.setItem('dtubonge_session', JSON.stringify({ username }));
}

function clearSession() {
    localStorage.removeItem('dtubonge_session');
}

function saveAdminSession() {
    localStorage.setItem('dtubonge_admin', 'true');
}

loginBtn.addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username || !password) {
        setStatus('Enter both username and password.', true);
        return;
    }

    try {
        const userRef = ref(db, `auth_users/${username}`);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
            setStatus('User not found.', true);
            return;
        }
        const data = snapshot.val();
        if (data.password !== password) {
            setStatus('Invalid password.', true);
            return;
        }
        saveSession(username);
        localStorage.removeItem('dtubonge_admin');
        window.location.href = 'chat.html';
    } catch (error) {
        console.error(error);
        setStatus('Login failed. Try again.', true);
    }
});

adminLoginBtn.addEventListener('click', () => {
    const password = adminPassword.value;
    if (!password) {
        setStatus('Enter admin password.', true);
        return;
    }
    if (password === ADMIN_PASSWORD) {
        saveAdminSession();
        clearSession();
        window.location.href = 'admin.html';
        return;
    }
    setStatus('Invalid admin password.', true);
});

signupBtn.addEventListener('click', async () => {
    const username = signupUsername.value.trim();
    const password = signupPassword.value;
    if (!username || !password) {
        setStatus('Enter a username and password.', true);
        return;
    }
    if (password.length < 6) {
        setStatus('Password must be at least 6 characters.', true);
        return;
    }

    try {
        const userRef = ref(db, `auth_users/${username}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            setStatus('Username already taken.', true);
            return;
        }

        await set(userRef, {
            username,
            password,
            createdAt: Date.now()
        });

        await update(ref(db, `users/${username}`), {
            username,
            color: '#e91e63',
            joinDate: Date.now(),
            online: false
        });

        saveSession(username);
        localStorage.removeItem('dtubonge_admin');
        window.location.href = 'chat.html';
    } catch (error) {
        console.error(error);
        setStatus('Sign up failed. Try again.', true);
    }
});

const existingSession = localStorage.getItem('dtubonge_session');
if (existingSession) {
    window.location.href = 'chat.html';
}
