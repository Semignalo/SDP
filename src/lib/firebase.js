import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDD7WVN_43033EiQNMT5EbCUUfDQttpLMs",
    authDomain: "star-digital-program.firebaseapp.com",
    projectId: "star-digital-program",
    storageBucket: "star-digital-program.firebasestorage.app",
    messagingSenderId: "356152164424",
    appId: "1:356152164424:web:92e8c2350f1eb1f9ac987d",
    measurementId: "G-3Q0NGLGFQM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
