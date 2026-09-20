// =======================================
// DÉCONNEXION
// =======================================

const auth = window.firebaseAuth;
const { signOut } = window.firebaseFns;

window.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Erreur lors de la déconnexion :", error);
        }
    });
});