module.exports = (req, res, next) => {
    // Pour l'instant, on lit l'ID depuis les headers (nous passerons au JWT plus tard)
    const userId = req.header('user-id');
    
    if (!userId) {
        return res.status(401).json({ error: "Accès refusé. Header 'user-id' manquant." });
    }

    // On attache l'ID à l'objet de requête pour que le contrôleur puisse l'utiliser
    req.user = { id: userId };
    next();
};