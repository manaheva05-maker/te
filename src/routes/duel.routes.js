const router = require('express').Router();
const Duel = require('../models/Duel');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth.middleware');
const { addKI, calculateDuelKI } = require('../services/ki.service');
const anticheat = require('../middleware/anticheat.middleware');

// Create duel
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { player2Id, type } = req.body;
    const duel = new Duel({
      player1: req.user._id,
      player2: player2Id,
      type: type || 'ranked',
      status: 'ban_phase'
    });
    await duel.save();
    res.status(201).json({ duel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit ban
router.post('/:id/ban', authMiddleware, async (req, res) => {
  try {
    const { category } = req.body;
    const duel = await Duel.findById(req.params.id);
    if (!duel) return res.status(404).json({ error: 'Duel introuvable' });

    const isPlayer1 = duel.player1.toString() === req.user._id.toString();
    if (isPlayer1) duel.bans.player1 = category;
    else duel.bans.player2 = category;

    // Both bans set → load questions
    if (duel.bans.player1 && duel.bans.player2) {
      const bannedCategories = [duel.bans.player1, duel.bans.player2];
      const questions = await Question.aggregate([
        { $match: { soul: { $nin: bannedCategories }, isValidated: true } },
        { $sample: { size: 10 } }
      ]);
      duel.questions = questions.map(q => q._id);
      duel.status = 'in_progress';
      duel.startedAt = new Date();
    }

    await duel.save();
    res.json({ duel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit answers
router.post('/:id/answers', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    const duel = await Duel.findById(req.params.id).populate('questions');
    if (!duel || duel.status !== 'in_progress') {
      return res.status(400).json({ error: 'Duel invalide' });
    }

    const isPlayer1 = duel.player1.toString() === req.user._id.toString();
    const playerKey = isPlayer1 ? 'player1' : 'player2';

    let score = 0;
    const processedAnswers = answers.map((a, i) => {
      const question = duel.questions[i];
      const correct = question && a.answer === question.correct_index;
      if (correct) score++;
      return { ...a, correct, ki_earned: 0 };
    });

    duel.answers[playerKey] = processedAnswers;
    duel.scores[playerKey] = score;

    // Check anticheat
    await anticheat(processedAnswers, req.user._id);

    // If both answered → finalize
    const otherKey = isPlayer1 ? 'player2' : 'player1';
    if (duel.answers[otherKey].length > 0) {
      const p1Score = duel.scores.player1;
      const p2Score = duel.scores.player2;
      duel.winner = p1Score >= p2Score ? duel.player1 : duel.player2;
      duel.status = 'finished';
      duel.finishedAt = new Date();

      // Award KI
      const p1Won = duel.winner.toString() === duel.player1.toString();
      const p1Perfect = duel.scores.player1 === 10;
      const p2Perfect = duel.scores.player2 === 10;

      const p1KI = calculateDuelKI(duel.answers.player1, p1Won, p1Perfect);
      const p2KI = calculateDuelKI(duel.answers.player2, !p1Won, p2Perfect);

      await addKI(duel.player1, p1KI, 'duel');
      await addKI(duel.player2, p2KI, 'duel');
    }

    await duel.save();
    res.json({ duel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get duel by id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const duel = await Duel.findById(req.params.id)
      .populate('player1', 'username rank aura avatar')
      .populate('player2', 'username rank aura avatar')
      .populate('questions');
    if (!duel) return res.status(404).json({ error: 'Duel introuvable' });
    res.json({ duel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
