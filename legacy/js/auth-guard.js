// =======================================
// PROTECTION DU DASHBOARD
// Redirige vers la page de connexion si personne n'est authentifié
// =======================================

const auth = window.firebaseAuth;
const { onAuthStateChanged } = window.firebaseFns;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    }
});