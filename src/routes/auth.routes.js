const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh, generateSecureToken, cookieOptions } = require('../services/token.service');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email.service');
const { dailyLogin } = require('../services/ki.service');
const authMiddleware = require('../middleware/auth.middleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives, réessaie dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000;

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  username: Joi.string().alphanum().min(3).max(20).required(),
  aura: Joi.string().valid('shonen','isekai','seinen','mystere','dark','mecha','slice','fantasy','gore').default('shonen'),
  language: Joi.string().valid('fr','en').default('fr'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false),
});

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  delete u.refreshTokens;
  delete u.loginAttempts;
  delete u.lockUntil;
  delete u.emailVerifyToken;
  delete u.emailVerifyExpires;
  delete u.passwordResetToken;
  delete u.passwordResetExpires;
  delete u.__v;
  return u;
};

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, username, aura, language } = value;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      if (exists.email === email) return res.status(409).json({ error: 'Email déjà utilisé' });
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const verifyToken = generateSecureToken();
    const isAdmin = email === process.env.ADMIN_EMAIL;

    const user = new User({
      email,
      password: hashed,
      username,
      aura,
      language,
      isAdmin,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await user.save();

    try {
      await sendVerificationEmail(email, username, verifyToken, language);
    } catch {}

    const accessToken = signAccess({ userId: user._id });
    const refreshToken = signRefresh({ userId: user._id });

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    res.cookie('refreshToken', refreshToken, cookieOptions(false));
    res.status(201).json({ user: sanitize(user), accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, rememberMe } = value;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokens');
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Compte verrouillé. Réessaie dans ${remaining} min` });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        update.lockUntil = new Date(Date.now() + LOCK_DURATION);
        update.loginAttempts = 0;
      }
      await User.findByIdAndUpdate(user._id, update);
      const left = MAX_LOGIN_ATTEMPTS - attempts;
      return res.status(401).json({ error: left > 0 ? `Mot de passe incorrect (${left} essai(s) restant(s))` : 'Compte verrouillé 15 min' });
    }

    if (user.isBanned) return res.status(403).json({ error: 'Compte banni' });

    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    const accessToken = signAccess({ userId: user._id });
    const refreshToken = signRefresh({ userId: user._id });

    const refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await User.findByIdAndUpdate(user._id, { refreshTokens });

    res.cookie('refreshToken', refreshToken, cookieOptions(rememberMe));
    res.json({ user: sanitize(user), accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token manquant' });

    let decoded;
    try { decoded = verifyRefresh(token); }
    catch { return res.status(401).json({ error: 'Refresh token invalide' }); }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens?.includes(token)) {
      return res.status(401).json({ error: 'Session invalide' });
    }
    if (user.isBanned) return res.status(403).json({ error: 'Compte banni' });

    const newAccess = signAccess({ userId: user._id });
    const newRefresh = signRefresh({ userId: user._id });

    const refreshTokens = user.refreshTokens.filter(t => t !== token);
    refreshTokens.push(newRefresh);
    await User.findByIdAndUpdate(user._id, { refreshTokens: refreshTokens.slice(-5) });

    res.cookie('refreshToken', newRefresh, cookieOptions(true));
    res.json({ accessToken: newAccess });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Déconnecté' });
  } catch {
    res.status(500).json({ error: 'Erreur logout' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const reward = await dailyLogin(req.user._id);
    res.json({ user: sanitize(req.user), dailyReward: reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token manquant' });

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) return res.status(400).json({ error: 'Lien expiré ou invalide' });

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    try { await sendWelcomeEmail(user.email, user.username, user.language); } catch {}

    res.json({ message: 'Email confirmé !' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'Si ce compte existe, un email a été envoyé' });

    const token = generateSecureToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.username, token, user.language);
    } catch {}

    res.json({ message: 'Si ce compte existe, un email a été envoyé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
    if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (min 8 caractères)' });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

    if (!user) return res.status(400).json({ error: 'Lien expiré ou invalide' });

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['fr','en'].includes(language)) return res.status(400).json({ error: 'Langue invalide' });
    req.user.language = language;
    await req.user.save();
    res.json({ language });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/region-setup', authMiddleware, async (req, res) => {
  try {
    const { region, language } = req.body;
    if (!region || !language) return res.status(400).json({ error: 'region et language requis' });

    req.user.region = region;
    req.user.language = language;
    req.user.hasCompletedRegionSetup = true;
    await req.user.save();

    res.json({ region, language, hasCompletedRegionSetup: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
