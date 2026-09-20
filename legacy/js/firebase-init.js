// =======================================
// INITIALISATION FIREBASE (SDK modulaire v12.19.0)
// =======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxsZUIEKfmSSU19nzg0njsPiiSir_dxoc",
    authDomain: "cosmic-empires.firebaseapp.com",
    projectId: "cosmic-empires",
    storageBucket: "cosmic-empires.firebasestorage.app",
    messagingSenderId: "822688310804",
    appId: "1:822688310804:web:43c691bc1bd4a72b9e2901"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// On expose tout sur window pour que les fichiers JS "classiques"
// (non-module) du jeu puissent les utiliser sans réécrire tout en modules.
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFns = {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
};

// Signal que Firebase est prêt (utile si un autre script veut attendre)
window.dispatchEvent(new Event("firebaseReady"));