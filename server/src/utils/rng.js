// Exporte une fonction qui retourne une rareté basée sur nos probabilités
exports.getRandomRarity = () => {
    const rand = Math.random(); // Génère un nombre entre 0 (inclus) et 1 (exclu)
    
    if (rand < 0.70) return 'Commune';       // 70%
    if (rand < 0.90) return 'Rare';          // 20% (0.70 à 0.89)
    if (rand < 0.99) return 'Épique';        // 9%  (0.90 à 0.98)
    return 'Légendaire';                     // 1%  (0.99)
};

exports.getRandomRarityLast = () => {
    const rand = Math.random(); // Génère un nombre entre 0 (inclus) et 1 (exclu)
    
    if (rand < 0.00) return 'Commune';       // 0%
    if (rand < 0.75) return 'Rare';          // 75% (0 à 0.74)
    if (rand < 0.95) return 'Épique';        // 20%  (0.76 à 0.95)
    return 'Légendaire';                     // 5%  (0.96 à 1)
};