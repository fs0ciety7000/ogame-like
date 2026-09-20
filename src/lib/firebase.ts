import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Sans config valide, on démarre quand même le SDK avec des valeurs factices
// bien formées : ça évite un crash au chargement du module (avant même que
// React ne monte) le temps que le déploiement renseigne son .env.local.
// `firebaseConfigured` reste false, donc aucune vraie requête réseau n'est
// tentée (voir authStore) — seul un essai de connexion explicite échouerait,
// proprement, via le try/catch du formulaire de connexion.
const effectiveConfig = firebaseConfigured
  ? firebaseConfig
  : { ...firebaseConfig, apiKey: "AIzaSyDUMMY0000000000000000000000000", projectId: "demo-unconfigured" };

const app = getApps().length ? getApps()[0]! : initializeApp(effectiveConfig);

export const auth = getAuth(app);

// Cache mémoire (par défaut du SDK), volontairement SANS persistance
// IndexedDB (persistentLocalCache) : cette dernière lève des
// DOMException("The operation failed for an operation-specific reason")
// non rattrapables dans pas mal de contextes réels (navigation privée
// Safari, protections anti-tracking strictes de Firefox/Brave, stockage
// plein ou profil endommagé) — le SDK ne bascule pas toujours proprement
// sur la mémoire dans ces cas-là. Le jeu est de toute façon un jeu
// multijoueur temps réel : la persistance hors-ligne entre rechargements
// de page n'apporte pas grand-chose, alors que le crash, lui, se voit.
export const db = getFirestore(app);

export default app;
