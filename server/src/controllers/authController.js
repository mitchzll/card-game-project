const bcrypt = require('bcrypt');
const User = require('../models/User');

// --- Inscription ---
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Vérifier si le joueur existe déjà
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Ce pseudo est déjà pris." });
        }

        // 2. Sécuriser le mot de passe
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Créer le nouveau joueur
        const newUser = new User({
            username,
            passwordHash
        });

        await newUser.save();
        res.status(201).json({ message: "Compte créé avec succès !", userId: newUser._id });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création du compte." });
    }
};

// --- Connexion ---
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Trouver l'utilisateur
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Identifiants incorrects." });
        }

        // 2. Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Identifiants incorrects." });
        }

        res.status(200).json({ 
            message: "Connexion réussie !", 
            userId: user._id, // <-- C'est cette ligne qui manquait !
            user: { 
                username: user.username, 
                boosters: user.boosters_disponibles 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la connexion." });
    }
};