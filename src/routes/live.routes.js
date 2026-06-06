const router = require('express').Router();
const LiveMatch = require('../models/LiveMatch');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { addKI } = require('../services/ki.service');

const GIFTS = {
  sakura:       { ryu: 5,    ki: 2,   globalNotif: false, pause: false },
  eclair:       { ryu: 15,   ki: 0,   globalNotif: false, pause: false },
  flamme:       { ryu: 30,   ki: 5,   globalNotif: false, pause: false },
  ryu:          { ryu: 100,  ki: 15,  globalNotif: true,  pause: false },
  shinken_gift: { ryu: 500,  ki: 50,  globalNotif: true,  pause: false },
  daimyo:       { ryu: 1000, ki: 100, globalNotif: true,  pause: true  },
};

// Get live match
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const live = await LiveMatch.findById(req.params.id)
      .populate('clan1', 'name tag emblem colors')
      .populate('clan2', 'name tag emblem colors')
      .populate('gifts.sender', 'username');
    if (!live) return res.status(404).json({ error: 'Live introuvable' });
    res.json({ live });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send gift
router.post('/:id/gift', authMiddleware, async (req, res) => {
  try {
    const { giftType, recipientId, recipientClanId } = req.body;
    const giftConfig = GIFTS[giftType];
    if (!giftConfig) return res.status(400).json({ error: 'Cadeau invalide' });

    if (req.user.ryu_coins < giftConfig.ryu) {
      return res.status(400).json({ error: 'Ryū Coins insuffisants' });
    }

    const live = await LiveMatch.findById(req.params.id);
    if (!live || live.status !== 'live') {
      return res.status(400).json({ error: 'Match non disponible' });
    }

    // Deduct RC
    req.user.ryu_coins -= giftConfig.ryu;
    req.user.stats.gifts_sent += 1;
    await req.user.save();

    // Add gift to match
    live.gifts.push({
      sender: req.user._id,
      recipient: recipientId || null,
      recipientClan: recipientClanId || null,
      giftType,
      ryuCost: giftConfig.ryu,
      kiGiven: giftConfig.ki,
      sentAt: new Date()
    });

    // 20% prize pool contribution
    live.giftRevenue += giftConfig.ryu;
    const prizeContrib = Math.floor(giftConfig.ryu * 0.2);

    // Give KI to recipient
    if (recipientId && giftConfig.ki > 0) {
      await addKI(recipientId, giftConfig.ki, 'gift_received');
      const recipient = await User.findById(recipientId);
      if (recipient) {
        recipient.stats.gifts_received += 1;
        await recipient.save();
      }
    }

    // Update top donators
    const existing = live.topDonators.find(d => d.user.toString() === req.user._id.toString());
    if (existing) {
      existing.totalRC += giftConfig.ryu;
    } else {
      live.topDonators.push({ user: req.user._id, username: req.user.username, totalRC: giftConfig.ryu });
    }
    live.topDonators.sort((a, b) => b.totalRC - a.totalRC);
    live.topDonators = live.topDonators.slice(0, 10);

    await live.save();

    res.json({
      gift: { type: giftType, ...giftConfig },
      prizeContrib,
      globalNotif: giftConfig.globalNotif,
      pause: giftConfig.pause,
      ryu_coins: req.user.ryu_coins
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place prediction
router.post('/:id/predict', authMiddleware, async (req, res) => {
  try {
    const { predictedWinner, kiStaked } = req.body;
    if (req.user.ki < kiStaked) return res.status(400).json({ error: 'KI insuffisant' });

    const live = await LiveMatch.findById(req.params.id);
    if (!live || live.status !== 'live') return res.status(400).json({ error: 'Match invalide' });

    const alreadyPredicted = live.predictions.find(
      p => p.user.toString() === req.user._id.toString()
    );
    if (alreadyPredicted) return res.status(400).json({ error: 'Déjà prédit' });

    req.user.ki = Math.max(0, req.user.ki - kiStaked);
    await req.user.save();

    live.predictions.push({ user: req.user._id, predictedWinner, kiStaked, correct: null });
    await live.save();

    res.json({ message: 'Prédiction enregistrée', ki: req.user.ki });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote for wildcard category
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { category } = req.body;
    const live = await LiveMatch.findById(req.params.id);
    if (!live) return res.status(404).json({ error: 'Live introuvable' });

    const votes = live.publicVote.votes;
    votes.set(category, (votes.get(category) || 0) + 1);
    live.publicVote.votes = votes;
    await live.save();

    res.json({ votes: Object.fromEntries(votes) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create live match
router.post('/admin/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { tournamentId, clan1Id, clan2Id } = req.body;
    const live = new LiveMatch({
      tournament: tournamentId,
      clan1: clan1Id,
      clan2: clan2Id,
      status: 'waiting'
    });
    await live.save();
    res.status(201).json({ live });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Start/end live
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const live = await LiveMatch.findById(req.params.id);
    if (!live) return res.status(404).json({ error: 'Live introuvable' });

    live.status = status;
    if (status === 'live') live.startedAt = new Date();
    if (status === 'finished') {
      live.finishedAt = new Date();
      // Resolve predictions
      const winnerId = live.scores.clan1 > live.scores.clan2 ? live.clan1 : live.clan2;
      for (const p of live.predictions) {
        if (p.predictedWinner.toString() === winnerId.toString()) {
          p.correct = true;
          await addKI(p.user, p.kiStaked * 2, 'prediction_win');
        } else {
          p.correct = false;
        }
      }
    }
    await live.save();
    res.json({ live });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
