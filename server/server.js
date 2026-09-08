const path = require('path');
// On force dotenv à chercher le fichier .env EXACTEMENT dans le dossier de server.js
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

// Initialisation d'Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware pour parser le JSON
app.use(express.json());

app.use('/api/game', require('./src/routes/gameRoutes'));

// Servir les fichiers statiques du front-end
app.use(express.static(path.join(__dirname, '../client')));

// Import et utilisation des routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/user', userRoutes);

// Connexion à MongoDB et démarrage du serveur
const PORT = process.env.PORT || 3000;

console.log("Vérification : l'URL MongoDB est-elle trouvée ? ->", process.env.MONGO_URI ? "Oui !" : "Non, toujours undefined");

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connecté à MongoDB avec succès');
        
        server.listen(PORT, () => {
            console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erreur fatale de connexion à MongoDB:', error.message);
        process.exit(1);
    });

// Gestion basique des WebSockets
io.on('connection', (socket) => {
    console.log(`🔌 Nouveau client connecté (ID: ${socket.id})`);

    socket.on('disconnect', () => {
        console.log(`❌ Client déconnecté (ID: ${socket.id})`);
    });
});