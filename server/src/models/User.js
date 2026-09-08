const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    boosters_disponibles: { type: Number, default: 3 },
    // Nouveau champ pour la récompense quotidienne
    lastDailyReward: { type: Date, default: null },
    collection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);