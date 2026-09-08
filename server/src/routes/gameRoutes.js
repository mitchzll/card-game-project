const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');

// L'appel passera par 'authMiddleware' PUIS par 'openBooster'
router.post('/open-booster', authMiddleware, gameController.openBooster);

// Route pour récupérer l'inventaire complet au chargement de la page
router.get('/collection', authMiddleware, gameController.getCollection);

// Nouvelles routes pour la Phase 4
router.post('/daily-reward', authMiddleware, gameController.claimDailyReward);
router.get('/leaderboard', authMiddleware, gameController.getLeaderboard);

module.exports = router;