const User = require('../models/User');

const SUSPICIOUS_SPEED_MS = 800;
const SUSPICIOUS_KI_GAIN = 500;

const anticheatMiddleware = async (answers, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Check response speed
    const fastAnswers = answers.filter(a => a.time_ms < SUSPICIOUS_SPEED_MS && a.correct);
    if (fastAnswers.length >= 5) {
      await User.findByIdAndUpdate(userId, {
        'anticheat.flagged': true,
        'anticheat.flagReason': `Réponses trop rapides: ${fastAnswers.length} réponses < ${SUSPICIOUS_SPEED_MS}ms`,
        'anticheat.reviewRequired': true
      });
      return { flagged: true, reason: 'speed' };
    }

    return { flagged: false };
  } catch (err) {
    console.error('Anticheat error:', err);
    return { flagged: false };
  }
};

module.exports = anticheatMiddleware;
