const { verifyAccess } = require('../services/token.service');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Token manquant' });

    let decoded;
    try {
      decoded = verifyAccess(token);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    if (user.isBanned) return res.status(403).json({ error: 'Compte banni' });

    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: 'Erreur auth' });
  }
};

module.exports = authMiddleware;
