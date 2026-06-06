const router = require('express').Router();
const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { addKI } = require('../services/ki.service');

const QUESTION_TIMER = 20000;
const BASE_POINTS = 100;

const calcPoints = (correct, timeMs, combo) => {
  if (!correct) return 0;
  const timeBonus = Math.max(0, Math.floor((QUESTION_TIMER - timeMs) / 1000) * 5);
  const comboBonus = combo > 1 ? Math.min(combo * 10, 100) : 0;
  return BASE_POINTS + timeBonus + comboBonus;
};

router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { category, language = 'fr', mode = 'solo' } = req.body;

    const filter = { isValidated: true };
    if (category) filter.category = category;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: 10 } },
      { $project: { text: 1, options: 1, difficulty: 1, anime: 1, category: 1 } }
    ]);

    if (questions.length < 5) return res.status(400).json({ error: 'Pas assez de questions disponibles' });

    const session = await QuizSession.create({
      user: req.user._id,
      category,
      language,
      mode,
    });

    res.status(201).json({
      sessionId: session._id,
      questions: questions.map(q => ({
        id: q._id,
        text: q.text[language] || q.text.fr,
        options: (q.options || []).map(o => o[language] || o.fr),
        timeLimit: QUESTION_TIMER,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:sessionId/answer', authMiddleware, async (req, res) => {
  try {
    const { questionId, answeredIndex, timeMs } = req.body;
    const session = await QuizSession.findOne({ _id: req.params.sessionId, user: req.user._id, status: 'active' });
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question introuvable' });

    const correct = answeredIndex === question.correct_index;
    const newCombo = correct ? session.currentCombo + 1 : 0;
    const points = calcPoints(correct, timeMs, session.currentCombo);

    session.questions.push({ questionId, answeredIndex, correct, timeMs, combo: session.currentCombo, pointsEarned: points });
    session.score += points;
    session.currentCombo = newCombo;
    session.maxCombo = Math.max(session.maxCombo, newCombo);

    await session.save();

    await Question.findByIdAndUpdate(questionId, {
      $inc: { times_asked: 1, times_correct: correct ? 1 : 0 },
    });

    res.json({ correct, points, combo: newCombo, correctIndex: question.correct_index, score: session.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:sessionId/complete', authMiddleware, async (req, res) => {
  try {
    const session = await QuizSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (session.status === 'completed') return res.json({ session });

    const total = session.questions.length;
    const correct = session.questions.filter(q => q.correct).length;
    session.accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    const kiEarned = Math.floor(session.score / 20);
    await addKI(req.user._id, kiEarned, 'quiz_completed');

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.quiz_played': 1,
        'stats.quiz_total_score': session.score,
      },
      $max: { 'stats.quiz_best_combo': session.maxCombo },
    });

    res.json({
      score: session.score,
      accuracy: session.accuracy,
      maxCombo: session.maxCombo,
      kiEarned,
      totalQuestions: total,
      correctAnswers: correct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    const match = { status: 'completed' };
    if (category) match.category = category;

    const top = await QuizSession.find(match)
      .populate('user', 'username rank ki aura avatarUrl')
      .sort({ score: -1 })
      .limit(parseInt(limit));

    res.json({ leaderboard: top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const sessions = await QuizSession.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(20);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
