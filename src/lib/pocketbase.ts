import PocketBase from 'pocketbase';

// L'URL de votre futur serveur Coolify, ou localhost en dev
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(pbUrl);

// Recommandé pour les jeux : empêche l'annulation des requêtes rapides
pb.autoCancellation(false);