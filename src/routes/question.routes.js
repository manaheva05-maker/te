const router = require('express').Router();
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { generateQuestion } = require('../services/sensei.service');

// Get questions (filtered)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { soul, difficulty, anime, type, limit = 10 } = req.query;
    const filter = { isValidated: true };
    if (soul) filter.soul = soul;
    if (difficulty) filter.difficulty = parseInt(difficulty);
    if (anime) filter.anime = new RegExp(anime, 'i');
    if (type) filter.type = type;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(limit) } }
    ]);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add question manually
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Generate question via Sensei AI
router.post('/admin/generate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { anime, soul, difficulty } = req.body;
    const question = await generateQuestion(anime, soul, difficulty);
    if (!question) return res.status(500).json({ error: 'Génération IA échouée' });
    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Validate AI question
router.patch('/admin/:id/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isValidated: true },
      { new: true }
    );
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update success rate after a question is answered
router.patch('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { correct } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question introuvable' });

    question.times_asked += 1;
    question.success_rate = (
      (question.success_rate * (question.times_asked - 1) + (correct ? 1 : 0)) /
      question.times_asked
    );
    await question.save();
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
