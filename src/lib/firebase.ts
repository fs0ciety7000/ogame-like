import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
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

// Cache local persistant + synchro multi-onglets : permet un fonctionnement
// hors-ligne fluide et une UI qui reste réactive pendant les allers-retours réseau.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export default app;
