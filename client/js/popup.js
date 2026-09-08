// Récupération des éléments du DOM
const popupOverlay = document.getElementById('custom-popup');
const popupContent = document.querySelector('.popup-content');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const popupIcon = document.getElementById('popup-icon');
const btnCloseCross = document.getElementById('popup-close-cross');
const btnCloseFooter = document.getElementById('popup-btn-close');

// Configuration des icônes selon le type
const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
};

/**
 * Affiche une modale personnalisée
 * @param {string} title - Le titre de la modale
 * @param {string} message - Le texte explicatif
 * @param {string} type - 'success', 'error', ou 'info'
 */
window.showPopup = function(title, message, type = 'info') {
    // Mise à jour du contenu
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupIcon.textContent = icons[type] || icons.info;

    // Gestion de la couleur de bordure via les classes CSS
    popupContent.className = 'popup-content ' + type;

    // Affichage avec animation
    popupOverlay.classList.remove('hidden');
};

// --- Logique de fermeture ---
function closePopup() {
    popupOverlay.classList.add('hidden');
}

// 1. Clic sur la croix
btnCloseCross.addEventListener('click', closePopup);

// 2. Clic sur le bouton Fermer
btnCloseFooter.addEventListener('click', closePopup);

// 3. Clic à l'extérieur de la modale (sur l'overlay sombre)
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        closePopup();
    }
});

// 4. Touche Échap (Escape) du clavier
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popupOverlay.classList.contains('hidden')) {
        closePopup();
    }
});