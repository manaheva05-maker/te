const router = require('express').Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// ─── SEARCH USERS ─────────────────────────────────────────────
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 20, soul, rank } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Minimum 2 caractères' });

    const filter = {
      username: new RegExp(q, 'i'),
      isBanned: false,
    };
    if (soul) filter.aura = soul;
    if (rank) filter.rank = rank;

    const users = await User.find(filter)
      .select('username rank ki aura avatarUrl clan clanRole stats.duels_played stats.duels_won')
      .sort({ ki: -1 })
      .limit(parseInt(limit));

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET USER PUBLIC PROFILE ──────────────────────────────────
router.get('/:id/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username rank ki aura avatarUrl bannerUrl clan clanRole stats cosmetics createdAt')
      .populate('clan', 'name tag elo clanRank');

    if (!user) return res.status(404).json({ error: 'Joueur introuvable' });
    if (user.isBanned) return res.status(404).json({ error: 'Joueur introuvable' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE OWN PROFILE ───────────────────────────────────────
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const allowed = ['avatarUrl', 'bannerUrl', 'bio', 'language'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TOP USERS LEADERBOARD ────────────────────────────────────
router.get('/leaderboard/top', authMiddleware, async (req, res) => {
  try {
    const { soul, limit = 50 } = req.query;
    const filter = { isBanned: false };
    if (soul) filter.aura = soul;

    const users = await User.find(filter)
      .select('username rank ki aura avatarUrl stats.duels_played stats.duels_won')
      .sort({ ki: -1 })
      .limit(parseInt(limit));

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
