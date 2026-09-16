// =======================================
// SYNCHRONISATION CLOUD (Firestore)
// =======================================

const auth = window.firebaseAuth;
const db = window.firebaseDb;
const { onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp } = window.firebaseFns;

const SYNC_INTERVAL_MS = 60000; // toutes les 60 secondes

/* =====================================================
   Attend de connaître l'utilisateur connecté (une seule fois)
===================================================== */
function waitForUser() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

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
   Exécution au chargement
   Le "await" ici met en pause tous les scripts <script defer>
   suivants jusqu'à ce que la sauvegarde cloud soit chargée.
===================================================== */
const currentUser = await waitForUser();

if (currentUser) {
    await loadCloudSaveIntoLocalStorage(currentUser.uid);

    setInterval(() => {
        pushLocalSaveToCloud(currentUser.uid);
    }, SYNC_INTERVAL_MS);

    window.addEventListener("beforeunload", () => {
        pushLocalSaveToCloud(currentUser.uid);
    });
}

window.dispatchEvent(new Event("cloudSaveReady"));