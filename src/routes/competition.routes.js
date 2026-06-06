const router = require('express').Router();
const Competition = require('../models/Competition');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { addKI } = require('../services/ki.service');

// ── CREATE ────────────────────────────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      name, type, soul, isPrivate, maxParticipants,
      entryFeeKI, scheduledAt, description, rules
    } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'Nom et type requis' });

    // Deduct entry fee from creator if set
    if (entryFeeKI > 0 && req.user.ki < entryFeeKI) {
      return res.status(400).json({ error: 'KI insuffisant pour créer cette compétition' });
    }

    const comp = new Competition({
      name, type, soul: soul || 'mixed',
      createdBy: req.user._id,
      creatorUsername: req.user.username,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 8,
      entryFeeKI: entryFeeKI || 0,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      description: description || '',
      rules: rules || '',
    });

    // Creator auto-joins
    comp.participants.push({
      user: req.user._id,
      username: req.user.username,
      rank: req.user.rank,
    });

    if (entryFeeKI > 0) {
      comp.prizePoolKI += entryFeeKI;
      await addKI(req.user._id, -entryFeeKI, 'comp_entry');
    }

    await comp.save();
    res.status(201).json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LIST ──────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = { isPrivate: false };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const comps = await Competition.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'username rank');

    const total = await Competition.countDocuments(filter);
    res.json({ competitions: comps, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MY COMPETITIONS ───────────────────────────────────────────
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const comps = await Competition.find({
      $or: [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id }
      ]
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ competitions: comps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET BY INVITE CODE ────────────────────────────────────────
router.get('/invite/:code', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findOne({ inviteCode: req.params.code.toUpperCase() })
      .populate('createdBy', 'username rank')
      .populate('participants.user', 'username rank ki');
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET BY ID ─────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id)
      .populate('createdBy', 'username rank avatar')
      .populate('participants.user', 'username rank ki aura avatar')
      .populate('clanParticipants.clan', 'name tag elo');
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── JOIN ──────────────────────────────────────────────────────
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    if (comp.status !== 'open') return res.status(400).json({ error: 'Compétition fermée' });
    if (comp.participants.length >= comp.maxParticipants) {
      return res.status(400).json({ error: 'Compétition complète' });
    }

    const alreadyIn = comp.participants.some(p =>
      p.user.toString() === req.user._id.toString()
    );
    if (alreadyIn) return res.status(409).json({ error: 'Déjà inscrit' });

    if (comp.entryFeeKI > 0) {
      if (req.user.ki < comp.entryFeeKI) {
        return res.status(400).json({ error: `${comp.entryFeeKI} KI requis pour rejoindre` });
      }
      comp.prizePoolKI += comp.entryFeeKI;
      await addKI(req.user._id, -comp.entryFeeKI, 'comp_entry');
    }

    comp.participants.push({
      user: req.user._id,
      username: req.user.username,
      rank: req.user.rank,
    });

    // Auto-start if full
    if (comp.participants.length >= comp.maxParticipants) {
      comp.status = 'ongoing';
      comp.startedAt = new Date();
    }

    await comp.save();
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── JOIN VIA CODE ─────────────────────────────────────────────
router.post('/invite/:code/join', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!comp) return res.status(404).json({ error: 'Code invalide' });
    if (comp.status !== 'open') return res.status(400).json({ error: 'Compétition fermée' });
    if (comp.participants.length >= comp.maxParticipants) {
      return res.status(400).json({ error: 'Compétition complète' });
    }

    const alreadyIn = comp.participants.some(p => p.user.toString() === req.user._id.toString());
    if (alreadyIn) return res.status(409).json({ error: 'Déjà inscrit' });

    if (comp.entryFeeKI > 0) {
      if (req.user.ki < comp.entryFeeKI) {
        return res.status(400).json({ error: `${comp.entryFeeKI} KI requis` });
      }
      comp.prizePoolKI += comp.entryFeeKI;
      await addKI(req.user._id, -comp.entryFeeKI, 'comp_entry');
    }

    comp.participants.push({
      user: req.user._id,
      username: req.user.username,
      rank: req.user.rank,
    });

    if (comp.participants.length >= comp.maxParticipants) {
      comp.status = 'ongoing';
      comp.startedAt = new Date();
    }

    await comp.save();
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START (creator only) ──────────────────────────────────────
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    if (comp.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Créateur uniquement' });
    }
    if (comp.participants.length < 2) {
      return res.status(400).json({ error: 'Minimum 2 participants requis' });
    }

    comp.status = 'ongoing';
    comp.startedAt = new Date();
    await comp.save();
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CANCEL (creator only) ─────────────────────────────────────
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    if (comp.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Créateur uniquement' });
    }

    // Refund entry fees if cancelled
    if (comp.entryFeeKI > 0) {
      for (const p of comp.participants) {
        await addKI(p.user, comp.entryFeeKI, 'comp_refund');
      }
    }

    comp.status = 'cancelled';
    await comp.save();
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SUBMIT SCORE ──────────────────────────────────────────────
router.patch('/:id/score', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    if (comp.status !== 'ongoing') return res.status(400).json({ error: 'Compétition non active' });

    const participant = comp.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );
    if (!participant) return res.status(403).json({ error: 'Non inscrit' });

    participant.score = (participant.score || 0) + (score || 0);
    await comp.save();
    res.json({ competition: comp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FINISH + DISTRIBUTE PRIZE ────────────────────────────────
router.post('/:id/finish', authMiddleware, async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Compétition introuvable' });
    if (comp.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Créateur uniquement' });
    }

    // Sort by score → find winner
    comp.participants.sort((a, b) => (b.score || 0) - (a.score || 0));
    const winnerP = comp.participants[0];
    if (winnerP) {
      comp.winner = winnerP.user;
      winnerP.status = 'winner';

      // Distribute prize pool to winner
      if (comp.prizePoolKI > 0) {
        await addKI(winnerP.user, comp.prizePoolKI, 'comp_prize');
      }
    }

    comp.status = 'finished';
    comp.finishedAt = new Date();
    await comp.save();

    res.json({
      competition: comp,
      winner: winnerP,
      prizeDistributed: comp.prizePoolKI
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
