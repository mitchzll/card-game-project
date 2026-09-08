const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Définition de nos deux routes (POST car on envoie des données sensibles)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;