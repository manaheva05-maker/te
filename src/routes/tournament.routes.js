const router = require('express').Router();
const Tournament = require('../models/Tournament');
const Clan = require('../models/Clan');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { generateBracket } = require('../services/bracket.service');

// List tournaments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .sort({ startDate: -1 })
      .populate('registeredClans.clan', 'name tag emblem')
      .populate('winner', 'name tag');
    res.json({ tournaments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tournament details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id)
      .populate('registeredClans.clan', 'name tag emblem elo')
      .populate('winner', 'name tag emblem');
    if (!t) return res.status(404).json({ error: 'Tournoi introuvable' });
    res.json({ tournament: t });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register clan to tournament
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.clanRole !== 'shogun') {
      return res.status(403).json({ error: 'Seul le Shogun peut inscrire le clan' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournoi introuvable' });
    if (tournament.status !== 'registration') {
      return res.status(400).json({ error: 'Les inscriptions sont fermées' });
    }
    if (tournament.registeredClans.length >= tournament.maxClans) {
      return res.status(400).json({ error: 'Tournoi complet' });
    }

    const clan = await Clan.findById(req.user.clan);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });

    // Check clan age (30 days)
    const ageDays = (Date.now() - clan.createdAt) / (1000 * 60 * 60 * 24);
    if (ageDays < 30) {
      return res.status(400).json({ error: 'Le clan doit avoir au moins 30 jours' });
    }

    // Check active members (10 min)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allMemberIds = [clan.shogun, ...clan.samurai, ...clan.members];
    const User = require('../models/User');
    const activeCount = await User.countDocuments({
      _id: { $in: allMemberIds },
      'stats.last_active': { $gte: sevenDaysAgo }
    });

    if (activeCount < 10) {
      return res.status(400).json({ error: '10 membres actifs minimum requis' });
    }

    // Pay entry fee
    if (clan.treasury < tournament.entryFee) {
      return res.status(400).json({ error: `Treasury insuffisante (${tournament.entryFee} RC requis)` });
    }
    clan.treasury -= tournament.entryFee;
    tournament.prizePool += Math.floor(tournament.entryFee * 0.8);
    await clan.save();

    // Check not already registered
    const alreadyIn = tournament.registeredClans.find(
      r => r.clan.toString() === clan._id.toString()
    );
    if (alreadyIn) return res.status(400).json({ error: 'Clan déjà inscrit' });

    tournament.registeredClans.push({
      clan: clan._id,
      confirmed: true,
      entryFeePaid: true
    });

    await tournament.save();
    res.json({ tournament, message: 'Clan inscrit avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create tournament
router.post('/admin/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name_fr, name_en, type, season, entryFee, maxClans, registrationStart, registrationEnd, startDate, endDate } = req.body;

    const tournament = new Tournament({
      name: { fr: name_fr, en: name_en },
      type, season,
      entryFee: entryFee || 500,
      maxClans: maxClans || 64,
      registrationStart: new Date(registrationStart),
      registrationEnd: new Date(registrationEnd),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'upcoming'
    });
    await tournament.save();
    res.status(201).json({ tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Generate bracket
router.post('/:id/bracket', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournoi introuvable' });

    const clanIds = tournament.registeredClans.map(r => r.clan);
    tournament.bracket = generateBracket(clanIds);
    tournament.status = 'ongoing';
    await tournament.save();

    res.json({ tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
