// Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuration (à récupérer dans les paramètres de ton projet Firebase)
const firebaseConfig = {
apiKey: "AIzaSyBIdTM9b4OEQWa72jQsC4neUlIVag_orlo",
  authDomain: "cosmic-ecd6f.firebaseapp.com",
  databaseURL: "https://cosmic-ecd6f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cosmic-ecd6f",
  storageBucket: "cosmic-ecd6f.firebasestorage.app",
  messagingSenderId: "555935269730",
  appId: "1:555935269730:web:27134deafc363adfd1a23b",
  measurementId: "G-88S1PMM65Y"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);