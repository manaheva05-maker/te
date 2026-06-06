const router = require('express').Router();
const User = require('../models/User');
const Clan = require('../models/Clan');
const Question = require('../models/Question');
const Tournament = require('../models/Tournament');
const LiveMatch = require('../models/LiveMatch');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, clans, questions, tournaments, lives] = await Promise.all([
      User.countDocuments(),
      Clan.countDocuments(),
      Question.countDocuments(),
      Tournament.countDocuments(),
      LiveMatch.countDocuments({ status: 'live' })
    ]);

    const flagged = await User.countDocuments({ 'anticheat.flagged': true });
    const banned = await User.countDocuments({ isBanned: true });
    const topUsers = await User.find().sort({ ki: -1 }).limit(10).select('username ki rank aura');

    res.json({ stats: { users, clans, questions, tournaments, livesActive: lives, flagged, banned }, topUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, flagged } = req.query;
    const filter = {};
    if (search) filter.username = new RegExp(search, 'i');
    if (flagged === 'true') filter['anticheat.flagged'] = true;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await User.countDocuments(filter);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban/unban user
router.patch('/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ban } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: ban }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear anticheat flag
router.patch('/users/:id/clearflag', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      'anticheat.flagged': false,
      'anticheat.flagReason': null,
      'anticheat.reviewRequired': false
    }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Give RC to user
router.post('/users/:id/coins', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { ryu_coins: amount } },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List pending AI questions
router.get('/questions/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const questions = await Question.find({ isValidated: false }).sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
