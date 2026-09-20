import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Charger les données du joueur depuis Firestore
export async function loadCloudData() {
    const user = auth.currentUser;
    if (!user) return null; // Non connecté

    const docRef = doc(db, "players", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data(); // Retourne l'objet de sauvegarde
    } else {
        // Le joueur n'a pas encore de sauvegarde, on initialise
        return await initNewPlayer(user.uid);
    }
}

// Sauvegarder les données du joueur vers Firestore
export async function saveCloudData(gameData) {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "players", user.uid);
    
    // { merge: true } permet de mettre à jour uniquement les champs modifiés
    await setDoc(docRef, gameData, { merge: true }); 
}

// Fonction d'initialisation pour un nouveau compte
async function initNewPlayer(uid) {
    const newSave = {
        resources: { scrap: 100, energy: 50, nano: 0, data: 0, tools: 0, drones: 0, parts: 0, intel: 0 },
        buildings: { extracteur_ferraille: 1, reacteur_instable: 1 },
        techLevels: {},
        units: {}
    };

    await setDoc(doc(db, "players", uid), newSave);
    return newSave;
}