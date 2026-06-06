const adminMiddleware = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  next();
};

module.exports = adminMiddleware;
