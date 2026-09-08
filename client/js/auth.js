// DOM Elements pour l'authentification
const authScreen = document.getElementById('auth-screen');
const gameScreen = document.getElementById('game-screen');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const toggleText = document.getElementById('toggle-text');
const linkToggleAuth = document.getElementById('link-toggle-auth');
const authError = document.getElementById('auth-error');
const btnLogout = document.getElementById('btn-logout');

// État actuel du formulaire (login ou register)
let isLoginMode = true;

// Basculer entre Connexion et Inscription
linkToggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authError.classList.add('hidden');
    
    if (isLoginMode) {
        authTitle.textContent = 'Connexion';
        btnAuthSubmit.textContent = 'Se connecter';
        toggleText.textContent = 'Pas encore de compte ?';
        linkToggleAuth.textContent = "S'inscrire";
    } else {
        authTitle.textContent = 'Création de compte';
        btnAuthSubmit.textContent = "S'inscrire";
        toggleText.textContent = 'Déjà un compte ?';
        linkToggleAuth.textContent = 'Se connecter';
    }
});

// Soumission du formulaire
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Règle stricte respectée
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    btnAuthSubmit.disabled = true;
    authError.classList.add('hidden');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erreur d'authentification");
        }

        // Si l'inscription réussit, on bascule sur la connexion
        if (!isLoginMode) {
            linkToggleAuth.click(); // Simule un clic pour revenir au mode login
            authError.textContent = "Compte créé ! Tu peux te connecter.";
            authError.style.color = "#10b981";
            authError.classList.remove('hidden');
        } else {
            // Sauvegarde du token (ou de l'user ID en attendant un vrai JWT backend)
            const tokenToSave = data.token || data.user._id || data.user.id || data.userId; 
            localStorage.setItem('jwt_token', tokenToSave);
            
            // Afficher le jeu
            showGameScreen();
        }
    } catch (error) {
        authError.textContent = error.message;
        authError.style.color = "#ef4444";
        authError.classList.remove('hidden');
    } finally {
        btnAuthSubmit.disabled = false;
    }
});

// Déconnexion
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('jwt_token');
    gameScreen.style.display = 'none';
    authScreen.style.display = 'flex';
});

// Afficher le jeu et charger les données
function showGameScreen() {
    authScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // Déclenchement de la fonction dans main.js pour charger les données
    if (typeof loadPlayerProfile === 'function') {
        loadPlayerProfile();
    }
}

// Vérification au chargement
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        showGameScreen();
    }
});