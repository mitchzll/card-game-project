const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    baseItemName: {
        type: String,
        required: true
    },
    rarity: {
        type: String,
        required: true,
        enum: ['Commune', 'Rare', 'Épique', 'Légendaire']
    },
    points: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true,
        default: 'https://via.placeholder.com/200x300.png?text=Carte+Mystere'
    }
});

module.exports = mongoose.model('Card', cardSchema);