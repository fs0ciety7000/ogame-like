const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
 
loginBtn.addEventListener("click", () => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 500);
});
 
registerBtn.addEventListener("click", () => {
    alert("Création de compte bientôt disponible !");
});