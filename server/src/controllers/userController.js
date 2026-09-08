const User = require('../models/User');
const Card = require('../models/Card');

exports.getUserProfile = async (req, res) => {
    try {
        // 1. Récupérer le joueur et peupler sa collection
        const user = await User.findById(req.user.id).populate('collection');
        if (!user) {
            return res.status(404).json({ error: "Joueur introuvable." });
        }

        // 2. Récupérer TOUTES les cartes existantes dans le catalogue
        const allCards = await Card.find({});

        // 3. Initialiser les statistiques de rareté
        const rarityStats = {
            'Commune': { owned: 0, total: 0 },
            'Rare': { owned: 0, total: 0 },
            'Épique': { owned: 0, total: 0 },
            'Légendaire': { owned: 0, total: 0 }
        };

        // 4. Compter le total de cartes existantes dans le jeu
        allCards.forEach(card => {
            if (rarityStats[card.rarity]) {
                rarityStats[card.rarity].total += 1;
            }
        });

        // 5. Compter les cartes UNIQUES possédées par le joueur
        const uniqueOwnedCards = new Set();
        user.collection.forEach(card => {
            if (!uniqueOwnedCards.has(card._id.toString())) {
                uniqueOwnedCards.add(card._id.toString());
                
                // Incrémenter le compteur 'owned' pour cette rareté
                if (rarityStats[card.rarity]) {
                    rarityStats[card.rarity].owned += 1;
                }
            }
        });

        // 6. Structure factice pour les futurs types élémentaires
        const typesStats = {
            'Feu': { owned: 0, total: 15 },
            'Eau': { owned: 0, total: 12 },
            'Plante': { owned: 0, total: 14 }
        };

        // 7. Renvoyer les données formatées
        res.status(200).json({
            username: user.username,
            totalCardsInInventory: user.collection.length, // Inclut les doublons
            uniqueCardsOwned: uniqueOwnedCards.size, // Exclut les doublons
            rarityStats,
            typesStats
        });

    } catch (error) {
        console.error("Erreur getUserProfile :", error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération du profil." });
    }
};