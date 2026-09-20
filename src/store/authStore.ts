import { onAuthStateChanged, type User } from "firebase/auth";
import { create } from "zustand";
import { auth, firebaseConfigured } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  initializing: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  initializing: true,
}));

let started = false;
export function startAuthListener() {
  if (started) return;
  started = true;

  // Sans configuration Firebase valide, le SDK peut lever une erreur
  // synchrone (clé API invalide) : on l'isole pour ne jamais faire planter
  // l'appli, et on affiche simplement l'écran de connexion (avec son
  // bandeau d'avertissement) comme si personne n'était connecté.
  if (!firebaseConfigured) {
    useAuthStore.setState({ user: null, initializing: false });
    return;
  }

  try {
    onAuthStateChanged(
      auth,
      (user) => useAuthStore.setState({ user, initializing: false }),
      () => useAuthStore.setState({ user: null, initializing: false }),
    );
  } catch {
    useAuthStore.setState({ user: null, initializing: false });
  }
}
