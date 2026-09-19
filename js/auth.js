// =======================================
// AUTHENTIFICATION PAR PSEUDO (via Firebase Auth email/mot de passe)
// =======================================

const auth = window.firebaseAuth;
const db = window.firebaseDb;
const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    doc,
    setDoc,
    serverTimestamp
} = window.firebaseFns;

// Empêche la redirection automatique de couper une inscription/connexion en cours
let authFlowInProgress = false;

/* =====================================================
   Transforme un pseudo en "faux email" pour Firebase Auth
===================================================== */
function sanitizePseudo(pseudo) {
    return pseudo
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, ""); // garde seulement lettres, chiffres, - et _
}

function pseudoToEmail(sanitized) {
    return `${sanitized}@cosmicgame.local`;
}

/* =====================================================
   Affichage des erreurs
===================================================== */
function showAuthError(message) {
    const el = document.getElementById("auth-error");
    if (el) el.textContent = message;
}

function translateFirebaseError(code) {
    const map = {
        "auth/email-already-in-use": "Ce pseudo est déjà pris.",
        "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
        "auth/invalid-credential": "Pseudo ou mot de passe incorrect.",
        "auth/user-not-found": "Pseudo ou mot de passe incorrect.",
        "auth/wrong-password": "Pseudo ou mot de passe incorrect.",
        "auth/invalid-email": "Pseudo invalide (utilise uniquement lettres, chiffres, - et _)."
    };
    return map[code] || "Une erreur est survenue. Réessaie.";
}

/* =====================================================
   Inscription
===================================================== */
async function registerPlayer(rawPseudo, password) {
    showAuthError("");
    authFlowInProgress = true;

    const sanitized = sanitizePseudo(rawPseudo);

    if (sanitized.length < 3) {
        showAuthError("Le pseudo doit contenir au moins 3 caractères valides.");
        authFlowInProgress = false;
        return;
    }
    if (password.length < 6) {
        showAuthError("Le mot de passe doit contenir au moins 6 caractères.");
        authFlowInProgress = false;
        return;
    }

    const email = pseudoToEmail(sanitized);

    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const uid = result.user.uid;

        // Création du profil joueur dans Firestore
        await setDoc(doc(db, "players", uid), {
            pseudo: rawPseudo.trim(),
            createdAt: serverTimestamp()
        });

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);
        showAuthError(translateFirebaseError(error.code));
        authFlowInProgress = false;
    }
}

/* =====================================================
   Connexion
===================================================== */
async function loginPlayer(rawPseudo, password) {
    showAuthError("");
    authFlowInProgress = true;

    const sanitized = sanitizePseudo(rawPseudo);
    const email = pseudoToEmail(sanitized);

    try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Auto-réparation : si le document Firestore n'a pas encore de pseudo
        // (comptes créés avant cette fonctionnalité), on le renseigne maintenant.
        await setDoc(doc(db, "players", result.user.uid), {
            pseudo: rawPseudo.trim()
        }, { merge: true });

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error(error);
        showAuthError(translateFirebaseError(error.code));
        authFlowInProgress = false;
    }
}

/* =====================================================
   Redirection automatique si déjà connecté
   (seulement si ce n'est PAS une inscription/connexion en cours,
   pour ne pas couper l'écriture du pseudo dans Firestore)
===================================================== */
onAuthStateChanged(auth, (user) => {
    if (user && !authFlowInProgress) {
        window.location.href = "dashboard.html";
    }
});

/* =====================================================
   Branchement des boutons
===================================================== */
window.addEventListener("DOMContentLoaded", () => {
    const pseudoInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    document.getElementById("login-btn").addEventListener("click", () => {
        loginPlayer(pseudoInput.value, passwordInput.value);
    });

    document.getElementById("register-btn").addEventListener("click", () => {
        registerPlayer(pseudoInput.value, passwordInput.value);
    });
});