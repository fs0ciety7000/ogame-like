// =======================================
// SYNCHRONISATION CLOUD (Firestore)
// =======================================

const auth = window.firebaseAuth;
const db = window.firebaseDb;
const { onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp } = window.firebaseFns;

const SYNC_INTERVAL_MS = 60000; // toutes les 60 secondes

/* =====================================================
   Charger la sauvegarde cloud dans localStorage
===================================================== */
async function loadCloudSaveIntoLocalStorage(uid) {
    const snap = await getDoc(doc(db, "players", uid));

    if (snap.exists()) {
        const data = snap.data();
        if (data.gameData) {
            localStorage.setItem("cosmicSave", JSON.stringify(data.gameData));
        }
    }
}

/* =====================================================
   Envoyer la sauvegarde locale vers Firestore
===================================================== */
async function pushLocalSaveToCloud(uid) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    await setDoc(doc(db, "players", uid), {
        gameData: save,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

/* =====================================================
   Initialisation
===================================================== */
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    // 1. On charge la sauvegarde cloud avant que le jeu ne démarre vraiment
    await loadCloudSaveIntoLocalStorage(user.uid);

    // Signal pour d'éventuels scripts qui voudraient attendre ce moment précis
    window.dispatchEvent(new Event("cloudSaveReady"));

    // 2. Sauvegarde périodique vers le cloud
    setInterval(() => {
        pushLocalSaveToCloud(user.uid);
    }, SYNC_INTERVAL_MS);

    // 3. Dernière tentative de sauvegarde à la fermeture de l'onglet
    window.addEventListener("beforeunload", () => {
        pushLocalSaveToCloud(user.uid);
    });
});