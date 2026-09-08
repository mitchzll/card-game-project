// --- SÉCURITÉ : Nettoyage automatique des faux tokens ---
if (localStorage.getItem('jwt_token') === 'undefined' || localStorage.getItem('jwt_token') === 'null') {
    localStorage.removeItem('jwt_token');
}

// Éléments du DOM 
const btnOpenBooster = document.getElementById('btn-open-booster');
const btnDailyReward = document.getElementById('btn-daily-reward');
const boosterCountDisplay = document.getElementById('booster-count');
const boosterOpeningZone = document.getElementById('booster-opening-zone');
const pulledCardsContainer = document.getElementById('pulled-cards-container');
const btnCloseOpening = document.getElementById('btn-close-opening');
const collectionGrid = document.getElementById('collection-grid');
const leaderboardBody = document.getElementById('leaderboard-body');
const sortSelect = document.getElementById('sort-collection'); // NOUVEAU

// Variable globale pour stocker la collection en mémoire
let playerCollection = []; 

// 1. Fonction utilitaire : Normaliser la rareté pour CSS
const normalizeRarity = (rarity) => {
    return rarity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// 2. Générer le HTML d'une carte (Prend maintenant un argument "count")
const createCardElement = (cardData, isFlipped = false, count = 1) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = `card-wrapper ${isFlipped ? 'flipped' : ''}`;
    // Plus besoin du position relative ici !
    
    const cssClass = normalizeRarity(cardData.rarity);
    const colorVar = `var(--color-${cssClass})`;

    // Le badge devient un simple "span" discret
    const badgeHtml = count > 1 ? `<span class="card-count-badge">x${count}</span>` : '';

    cardWrapper.innerHTML = `
        <div class="card-inner">
            <div class="card-front ${cssClass}">
                <img src="${cardData.imageUrl}" alt="${cardData.name}">
                <div class="card-details">
                    <!-- NOUVEAU : Un conteneur flex pour aligner le nom et le badge -->
                    <div class="card-title-container">
                        <span class="card-name">${cardData.name}</span>
                        ${badgeHtml}
                    </div>
                    <span class="card-rarity" style="color: ${colorVar}">${cardData.rarity}</span>
                </div>
            </div>
            <div class="card-back"></div>
        </div>
    `;
    return cardWrapper;
};

// --- Fonction de sécurité commune ---
const handleAuthError = (status) => {
    if (status === 401) {
        localStorage.removeItem('jwt_token');
        window.location.reload(); 
        return true;
    }
    return false;
};

// ==========================================
// --- LOGIQUE DE TRI ET DE REGROUPEMENT
// ==========================================
const renderCollection = () => {
    if (!playerCollection || playerCollection.length === 0) return;

    // 1. Regrouper les doublons via un dictionnaire (clé = ID de la carte)
    const groupedCards = {};
    playerCollection.forEach(card => {
        if (!groupedCards[card._id]) {
            groupedCards[card._id] = { ...card, count: 1 };
        } else {
            groupedCards[card._id].count += 1;
        }
    });

    // On re-transforme le dictionnaire en tableau pour pouvoir le trier
    let cardsArray = Object.values(groupedCards);

    // 2. Trier le tableau
    const sortMethod = sortSelect.value;
    const rarityScores = { 'Commune': 1, 'Rare': 2, 'Épique': 3, 'Légendaire': 4 };

    cardsArray.sort((a, b) => {
        if (sortMethod === 'rarity-desc') {
            // Si même rareté, on trie par ordre alphabétique
            if (rarityScores[b.rarity] === rarityScores[a.rarity]) return a.name.localeCompare(b.name);
            return rarityScores[b.rarity] - rarityScores[a.rarity];
        } 
        else if (sortMethod === 'rarity-asc') {
            if (rarityScores[a.rarity] === rarityScores[b.rarity]) return a.name.localeCompare(b.name);
            return rarityScores[a.rarity] - rarityScores[b.rarity];
        } 
        else if (sortMethod === 'name-asc') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });

    // 3. Dessiner la grille
    collectionGrid.innerHTML = '';
    cardsArray.forEach(cardData => {
        const cardEl = createCardElement(cardData, true, cardData.count);
        collectionGrid.appendChild(cardEl);
    });
};

// Écouteur sur le menu déroulant : refait le rendu à chaque changement !
sortSelect.addEventListener('change', renderCollection);


// 3. Charger le profil et la collection
const loadPlayerProfile = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch('/api/game/collection', {
            method: 'GET',
            headers: { 'user-id': token }
        });

        if (handleAuthError(response.status)) return;

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur de chargement");

        boosterCountDisplay.textContent = data.boosters_disponibles;
        navUsername.textContent = data.username; 

        // On sauvegarde la collection globale en mémoire
        playerCollection = data.collection;
        
        // On déclenche l'affichage trié et groupé
        renderCollection();

    } catch (error) {
        console.error("Erreur profile :", error.message);
    }
};

// 4. Charger le Leaderboard
const loadLeaderboard = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch('/api/game/leaderboard', {
            headers: { 'user-id': token }
        });
        
        if (handleAuthError(response.status)) return;
        
        const data = await response.json();

        if (response.ok) {
            leaderboardBody.innerHTML = '';
            data.forEach((player, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.score} pts</td>
                    <td>${player.totalCards}</td>
                `;
                leaderboardBody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Erreur Leaderboard :", error);
    }
};

// 5. Ouvrir un booster
btnOpenBooster.addEventListener('click', async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        showPopup('Action impossible', 'Tu dois être connecté pour ouvrir un booster.', 'info');
        return;
    }

    btnOpenBooster.disabled = true;
    pulledCardsContainer.innerHTML = '';
    boosterOpeningZone.classList.remove('hidden');
    btnCloseOpening.classList.add('hidden');

    try {
        const response = await fetch('/api/game/open-booster', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': token
            }
        });

        if (handleAuthError(response.status)) return;

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur inconnue");

        boosterCountDisplay.textContent = data.boosters_restants;

        // Générer le HTML des cartes (face cachée)
        const domCards = data.cards.map(cardData => {
            const cardEl = createCardElement(cardData, false);
            pulledCardsContainer.appendChild(cardEl);
            return cardEl;
        });

        // --- NOUVEAU : Logique de la Pile (Stack) ---
        let currentCardIndex = 0; // Index de la carte au sommet de la pile

        domCards.forEach((cardEl, index) => {
            // 1. On donne l'illusion de l'épaisseur du paquet
            cardEl.style.zIndex = domCards.length - index; // La 1ère carte est tout au-dessus
            cardEl.style.transform = `translate(${index * 4}px, ${index * 4}px)`; // Décalage visuel

            // 2. On écoute le clic
            cardEl.addEventListener('click', function() {
                // SÉCURITÉ : On ne peut cliquer que sur la carte tout au-dessus !
                if (index !== currentCardIndex) return;

                // On la retourne (animation 3D de la face)
                this.classList.add('flipped');
                this.classList.add('slide-away');
                
                // CORRECTION 1 : On donne à la carte le z-index actuel pour qu'elle passe au-dessus de l'ancienne !
                this.style.zIndex = currentCardIndex;
                
                // CORRECTION 2 : On calcule un décalage dynamique pour créer un bel éventail visible
                // On décale l'éventail beaucoup plus à gauche (-280px) et on resserre l'écartement (25px)
this.style.transform = `translate(calc(-280px + ${currentCardIndex * 25}px), ${currentCardIndex * 5}px) rotate(-5deg)`;
                currentCardIndex++;
                
                // Si c'était la dernière carte...
                if (currentCardIndex === domCards.length) {
                    setTimeout(() => {
                        btnCloseOpening.classList.remove('hidden');
                    }, 800);
                }
            });
        });

    } catch (error) {
        showPopup('Oups !', error.message, 'error');
        boosterOpeningZone.classList.add('hidden');
        btnOpenBooster.disabled = false;
    }
});

// Ranger les cartes
btnCloseOpening.addEventListener('click', () => {
    boosterOpeningZone.classList.add('hidden');
    loadPlayerProfile();
    loadLeaderboard(); // Mise à jour des points après l'ouverture !
    pulledCardsContainer.innerHTML = '';
    btnOpenBooster.disabled = false;
});

// 6. Récompense Quotidienne
btnDailyReward.addEventListener('click', async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        showPopup('Action impossible', 'Tu dois être connecté pour récupérer une récompense.', 'info');
        return;
    }

    btnDailyReward.disabled = true;

    try {
        const response = await fetch('/api/game/daily-reward', {
            method: 'POST',
            headers: { 'user-id': token }
        });

        if (handleAuthError(response.status)) return;

        const data = await response.json();

        if (response.ok) {
            showPopup('Félicitations', data.message, 'success');
            boosterCountDisplay.textContent = data.boosters_disponibles;
            btnDailyReward.textContent = "Récompense obtenue ✔️";
            btnDailyReward.style.backgroundColor = "#4b5563";
        } else {
            showPopup('Patience', data.error, 'info');
            btnDailyReward.disabled = false;
        }
    } catch (error) {
        showPopup('Erreur Serveur', 'Impossible de joindre le serveur pour le moment.', 'error');
        btnDailyReward.disabled = false;
    }
});

// ==========================================
// --- GESTION DE L'ÉCRAN PROFIL & NAVIGATION
// ==========================================

const viewGame = document.getElementById('view-game');
const viewProfile = document.getElementById('view-profile');
const navLogo = document.getElementById('nav-logo');
const navUsername = document.getElementById('nav-username');

const profileDisplayName = document.getElementById('profile-display-name');
const statTotalCards = document.getElementById('stat-total-cards');
const statUniqueCards = document.getElementById('stat-unique-cards');
const rarityBarsContainer = document.getElementById('rarity-bars-container');
const typeBarsContainer = document.getElementById('type-bars-container');

navLogo.addEventListener('click', () => {
    viewProfile.classList.add('hidden');
    viewGame.classList.remove('hidden');
});

navUsername.addEventListener('click', () => {
    viewGame.classList.add('hidden');
    viewProfile.classList.remove('hidden');
    loadProfileDashboard(); 
});

const loadProfileDashboard = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: { 'user-id': token }
        });

        if (handleAuthError(response.status)) return;

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erreur de chargement du profil");

        profileDisplayName.textContent = data.username;
        statTotalCards.textContent = data.totalCardsInInventory;
        statUniqueCards.textContent = data.uniqueCardsOwned;

        rarityBarsContainer.innerHTML = '';
        for (const [rarity, stats] of Object.entries(data.rarityStats)) {
            const percentage = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
            const cssClass = normalizeRarity(rarity); 
            const colorVar = `var(--color-${cssClass})`;

            rarityBarsContainer.innerHTML += `
                <div class="progress-item">
                    <div class="progress-item-header">
                        <span style="color: ${colorVar}">${rarity}</span>
                        <span>${stats.owned} / ${stats.total} (${percentage}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: 0%; background-color: ${colorVar};"></div>
                    </div>
                </div>
            `;
        }

        typeBarsContainer.innerHTML = '';
        for (const [type, stats] of Object.entries(data.typesStats)) {
            const percentage = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
            
            typeBarsContainer.innerHTML += `
                <div class="progress-item">
                    <div class="progress-item-header">
                        <span>${type}</span>
                        <span>${stats.owned} / ${stats.total} (${percentage}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: 0%; background-color: #6b7280;"></div>
                    </div>
                </div>
            `;
        }

        setTimeout(() => {
            const rarityFills = rarityBarsContainer.querySelectorAll('.progress-fill');
            Object.values(data.rarityStats).forEach((stats, index) => {
                const percentage = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
                if (rarityFills[index]) rarityFills[index].style.width = `${percentage}%`;
            });

            const typeFills = typeBarsContainer.querySelectorAll('.progress-fill');
            Object.values(data.typesStats).forEach((stats, index) => {
                const percentage = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
                if (typeFills[index]) typeFills[index].style.width = `${percentage}%`;
            });
        }, 50);

    } catch (error) {
        showPopup('Erreur Profil', error.message, 'error');
    }

    const boosterScreen = document.getElementById('booster-screen'); // Remplace par l'ID du div contenant tes cartes

    // 1️⃣ Fermer avec la touche "Échap"
    document.addEventListener('keydown', (event) => {
        // Si l'écran des boosters est affiché (non caché) et qu'on appuie sur Échap
        if (event.key === 'Escape' && boosterScreen.style.display !== 'none') {
            closeBoosterScreen(); // Ta fonction existante pour retourner au menu
        }
    });

    // 2️⃣ Fermer en cliquant n'importe où en dehors des cartes
    boosterScreen.addEventListener('click', (event) => {
        // Si on clique spécifiquement sur le fond de l'écran, et pas sur une carte
        if (event.target === boosterScreen) {
            closeBoosterScreen();
        }
    });

    // 3️⃣ Gérer le bouton "Ouvrir un autre"
    document.getElementById('btn-open-another').addEventListener('click', () => {
        // Vérifier si le joueur a encore des boosters côté front (ex: variable locale)
        if (playerBoostersCount > 0) {
            closeBoosterScreen(); // On nettoie l'écran actuel
            openBooster();        // On relance ton animation d'ouverture
        } else {
            alert("Tu n'as plus de boosters en réserve !");
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    
    // Si un token est présent (le joueur est connecté), on charge ses données et le classement
    if (token && token !== 'undefined' && token !== 'null') {
        loadPlayerProfile();
        loadLeaderboard();
    }
});
};