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
const btnOpenAnother = document.getElementById('btn-open-another'); // Remplaçant de l'ancien bouton
const collectionGrid = document.getElementById('collection-grid');
const leaderboardBody = document.getElementById('leaderboard-body');
const sortSelect = document.getElementById('sort-collection'); 

let playerCollection = []; 

// 1. Fonction utilitaire : Normaliser la rareté
const normalizeRarity = (rarity) => {
    return rarity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// 2. Générer le HTML d'une carte
const createCardElement = (cardData, isFlipped = false, count = 1) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = `card-wrapper ${isFlipped ? 'flipped' : ''}`;
    
    const cssClass = normalizeRarity(cardData.rarity);
    const colorVar = `var(--color-${cssClass})`;
    const badgeHtml = count > 1 ? `<span class="card-count-badge">x${count}</span>` : '';

    cardWrapper.innerHTML = `
        <div class="card-inner">
            <div class="card-front ${cssClass}">
                <img src="${cardData.imageUrl}" alt="${cardData.name}">
                <div class="card-details">
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

const handleAuthError = (status) => {
    if (status === 401) {
        localStorage.removeItem('jwt_token');
        window.location.reload(); 
        return true;
    }
    return false;
};

// 3. Rendu de la collection
const renderCollection = () => {
    if (!playerCollection || playerCollection.length === 0) return;

    const groupedCards = {};
    playerCollection.forEach(card => {
        if (!groupedCards[card._id]) {
            groupedCards[card._id] = { ...card, count: 1 };
        } else {
            groupedCards[card._id].count += 1;
        }
    });

    let cardsArray = Object.values(groupedCards);
    const sortMethod = sortSelect.value;
    const rarityScores = { 'Commune': 1, 'Rare': 2, 'Épique': 3, 'Légendaire': 4 };

    cardsArray.sort((a, b) => {
        if (sortMethod === 'rarity-desc') {
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

    collectionGrid.innerHTML = '';
    cardsArray.forEach(cardData => {
        const cardEl = createCardElement(cardData, true, cardData.count);
        collectionGrid.appendChild(cardEl);
    });
};

sortSelect.addEventListener('change', renderCollection);

// 4. Charger le profil et Leaderboard
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
        if (!response.ok) throw new Error(data.error);

        boosterCountDisplay.textContent = data.boosters_disponibles;
        navUsername.textContent = data.username; 
        playerCollection = data.collection;
        renderCollection();
    } catch (error) {
        console.error("Erreur profile :", error.message);
    }
};

const loadLeaderboard = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch('/api/game/leaderboard', { headers: { 'user-id': token } });
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

// --- LOGIQUE DE FERMETURE COMMUNE ---
const closeBoosterScreen = () => {
    boosterOpeningZone.classList.add('hidden');
    loadPlayerProfile();
    loadLeaderboard();
    pulledCardsContainer.innerHTML = '';
    btnOpenBooster.disabled = false;
    btnOpenAnother.style.display = 'none'; // Recacher le bouton
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
    btnOpenAnother.style.display = 'none'; 

    try {
        const response = await fetch('/api/game/open-booster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'user-id': token }
        });
        if (handleAuthError(response.status)) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        boosterCountDisplay.textContent = data.boosters_restants;

        const domCards = data.cards.map(cardData => {
            const cardEl = createCardElement(cardData, false);
            pulledCardsContainer.appendChild(cardEl);
            return cardEl;
        });

        let currentCardIndex = 0;

        domCards.forEach((cardEl, index) => {
            cardEl.style.zIndex = domCards.length - index;
            cardEl.style.transform = `translate(${index * 4}px, ${index * 4}px)`;

            cardEl.addEventListener('click', function() {
                if (index !== currentCardIndex) return;

                this.classList.add('flipped', 'slide-away');
                this.style.zIndex = currentCardIndex;
                this.style.transform = `translate(calc(-280px + ${currentCardIndex * 25}px), ${currentCardIndex * 5}px) rotate(-5deg)`;
                currentCardIndex++;
                
                if (currentCardIndex === domCards.length) {
                    setTimeout(() => {
                        btnOpenAnother.style.display = 'block';
                    }, 800);
                }
            });
        });
    } catch (error) {
        showPopup('Oups !', error.message, 'error');
        closeBoosterScreen();
    }
});

// --- GESTION UX (Échap, Clic extérieur, Bouton) ---

// 1️⃣ Clic à l'extérieur
boosterOpeningZone.addEventListener('click', (event) => {
    if (event.target === boosterOpeningZone || event.target.tagName === 'H3') {
        closeBoosterScreen();
    }
});

// 2️⃣ Touche "Échap"
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !boosterOpeningZone.classList.contains('hidden')) {
        closeBoosterScreen();
    }
});

// 3️⃣ Bouton "Ouvrir un autre"
btnOpenAnother.addEventListener('click', () => {
    const currentBoosters = parseInt(boosterCountDisplay.textContent, 10) || 0;
    if (currentBoosters > 0) {
        closeBoosterScreen();
        btnOpenBooster.click(); // Relance automatiquement
    } else {
        showPopup("Action impossible", "Tu n'as plus de boosters en réserve !", "info");
        closeBoosterScreen();
    }
});

// 6. Récompense Quotidienne
btnDailyReward.addEventListener('click', async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

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
        showPopup('Erreur Serveur', 'Impossible de joindre le serveur.', 'error');
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
        if (!response.ok) throw new Error(data.error);

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
};

// ==========================================
// --- INITIALISATION AU CHARGEMENT DE LA PAGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    if (token && token !== 'undefined' && token !== 'null') {
        loadPlayerProfile();
        loadLeaderboard();
    }
});