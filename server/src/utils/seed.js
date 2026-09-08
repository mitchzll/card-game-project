const path = require('path');
// Charge le .env situé dans /server/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
// Remonte d'un niveau (sort de utils/) pour entrer dans models/
const Card = require('../models/Card');
// Remonte d'un niveau pour entrer dans data/
const cardsData = require('../data/cards-data.json');

async function syncCards() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ Variable MONGO_URI introuvable dans le .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connecté à MongoDB pour la synchronisation...');

    for (const card of cardsData) {
      await Card.updateOne(
        { name: card.name },
        { $set: card },
        { upsert: true }
      );
    }

    console.log(`✅ ${cardsData.length} cartes synchronisées avec succès !`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la synchronisation :', error);
    process.exit(1);
  }
}

syncCards();