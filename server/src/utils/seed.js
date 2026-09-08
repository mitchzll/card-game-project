const path = require('path');
// On remonte de deux dossiers (depuis src/utils vers server) pour trouver le .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const Card = require('../models/Card'); 

// On utilise maintenant l'URI de ton fichier .env en toute sécurité
const MONGO_URI = process.env.MONGO_URI; 

const seedDatabase = async () => {
    if (!MONGO_URI) {
        console.error("❌ Erreur : MONGO_URI est introuvable. Vérifie ton fichier .env !");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Connecté à MongoDB.');

        // 1. On vide la table actuelle pour éviter les doublons
        console.log('🗑️ Nettoyage de l\'ancienne collection de cartes...');
        await Card.deleteMany({});

        // 2. On lit le fichier JSON
        console.log('📖 Lecture du fichier cards-data.json...');
        const dataPath = path.join(__dirname, '../data/cards-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const cards = JSON.parse(rawData);

        // 3. On insère toutes les cartes d'un coup
        console.log(`⏳ Insertion de ${cards.length} cartes...`);
        await Card.insertMany(cards);

        console.log('✅ Succès ! Le catalogue est à jour.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'importation :', error);
        process.exit(1);
    }
};

seedDatabase();