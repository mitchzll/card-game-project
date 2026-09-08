const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
// Adapte le chemin vers ton modèle User
const User = require('../models/User'); 

async function resetAllPlayerCards() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ Variable MONGO_URI introuvable");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connecté à MongoDB...');

    // Met à jour TOUS les documents de la collection User en vidant leur tableau 'collection'
    const result = await User.updateMany(
      {}, 
      { $set: { collection: [] } }
    );

    console.log(`✅ Collections vidées avec succès pour ${result.modifiedCount} joueur(s) !`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation :', error);
    process.exit(1);
  }
}

resetAllPlayerCards();