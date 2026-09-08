const User = require('../models/User');
const Card = require('../models/Card');
const { getRandomRarity, getRandomRarityLast } = require('../utils/rng');
exports.openBooster = async (req, res) => {
    try {
        // 1. Récupérer l'utilisateur via l'ID fourni par le middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "Joueur introuvable." });
        }
        
        // 2. Vérifier les boosters disponibles
        if (user.boosters_disponibles < 1) {
            return res.status(403).json({ error: "Aucun booster disponible." });
        }

        // 3. Générer les 5 raretés
        const rarities = [];
        const cartesParBooster = 5;

        // 1. Les 4 premières cartes (Tirage normal)
        for (let i = 0; i < cartesParBooster - 1; i++) {
            // Remplace par ta propre fonction de rareté normale si elle s'appelle autrement
            rarities.push(getRandomRarity()); 
        }

        // 2. La dernière carte : La "Rare Garantie" (Le fameux Hit !)
            rarities.push(getRandomRarityLast()); 
        // 4. Piocher les cartes en parallèle
        const pulledCards = await Promise.all(
            rarities.map(async (rarity) => {
                const cards = await Card.aggregate([
                    { $match: { rarity: rarity } },
                    { $sample: { size: 1 } }
                ]);
                // SÉCURITÉ : Si aucune carte de cette rareté n'existe, on donne une Commune en lot de consolation (Fallback)
                if (!cards || cards.length === 0) {
                    console.warn(`Attention : Aucune carte de rareté ${rarity} trouvée en BDD. Fallback sur Commune.`);
                    cards = await Card.aggregate([
                        { $match: { rarity: 'Commune' } },
                        { $sample: { size: 1 } }
                    ]);
                }

                return cards[0];
            })
        );

        // 5. Mettre à jour l'utilisateur (retrait d'un booster et ajout des ObjectIds)
        user.boosters_disponibles -= 1;
        pulledCards.forEach(card => user.collection.push(card._id));
        
        await user.save();

        // 6. Renvoyer le résultat
        res.status(200).json({
            message: "Booster ouvert avec succès !",
            boosters_restants: user.boosters_disponibles,
            cards: pulledCards
        });

    } catch (error) {
        console.error('Erreur openBooster :', error);
        res.status(500).json({ error: "Erreur serveur lors de l'ouverture du booster." });
    }
};
// Récupérer la collection complète et le statut du joueur
exports.getCollection = async (req, res) => {
    try {
        // Le .populate('collection') est la clé : il va chercher les données dans la collection Card
        const user = await User.findById(req.user.id).populate('collection');

        if (!user) {
            return res.status(404).json({ error: "Joueur introuvable." });
        }

        res.status(200).json({
            username: user.username,
            boosters_disponibles: user.boosters_disponibles,
            collection: user.collection
        });

    } catch (error) {
        console.error('Erreur getCollection :', error);
        res.status(500).json({ error: "Erreur serveur lors de la récupération de l'inventaire." });
    }
};
// --- 1. Récompense Quotidienne ---
exports.claimDailyReward = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "Joueur introuvable." });

        const now = new Date();
        const lastReward = user.lastDailyReward;

        // Vérification du délai de 24h
        if (lastReward) {
            const diffHours = (now - new Date(lastReward)) / (1000 * 60 * 60);
            if (diffHours < 24) {
                const hoursLeft = Math.ceil(24 - diffHours);
                return res.status(400).json({ 
                    error: `Veuillez patienter encore ${hoursLeft}h pour le prochain booster.` 
                });
            }
        }

        // Ajout du booster et sauvegarde
        user.boosters_disponibles += 1;
        user.lastDailyReward = now;
        await user.save();

        res.status(200).json({
            message: "Booster gratuit récupéré !",
            boosters_disponibles: user.boosters_disponibles
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur lors de la récompense." });
    }
};

// --- 2. Classement (Leaderboard) ---
exports.getLeaderboard = async (req, res) => {
    try {
        const rarityScores = {
            'Commune': 1,
            'Rare': 5,
            'Épique': 20,
            'Légendaire': 100
        };

        // Récupérer tous les joueurs avec les données de leurs cartes
        const users = await User.find({}).populate('collection');

        // Calculer les scores
        const leaderboardData = users.map(user => {
            let totalScore = 0;
            user.collection.forEach(card => {
                totalScore += rarityScores[card.rarity] || 0;
            });

            return {
                username: user.username,
                score: totalScore,
                totalCards: user.collection.length
            };
        });

        // Trier du plus grand au plus petit et garder le Top 10
        leaderboardData.sort((a, b) => b.score - a.score);
        const top10 = leaderboardData.slice(0, 10);

        res.status(200).json(top10);

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la génération du classement." });
    }
};