// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3iPABSvpTN5KHAFFYNlAIwEPR8XEddRY",
  authDomain: "dtubonge.firebaseapp.com",
  projectId: "dtubonge",
  storageBucket: "dtubonge.firebasestorage.app",
  messagingSenderId: "194637518723",
  appId: "1:194637518723:web:891227e82ea2817e6888b6",
  measurementId: "G-5NPT1KM5DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);