const User = require('../models/User');

const KI_VALUES = {
  correct_fast: 15,
  correct_normal: 10,
  win_duel: 50,
  perfect_victory: 100,
  clan_war_participation: 30,
  daily_login: 20,
  streak_7days: 200,
  gift_sent: 5,
  live_spectator: 10,
  wrong_answer: -5,
  abandon_duel: -30,
  humiliating_defeat: -20,
};

const addKI = async (userId, amount, reason = '') => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    user.ki = Math.max(0, user.ki + amount);
    user.stats.last_active = new Date();
    await user.save(); // triggers rank update via pre-save hook

    return { ki: user.ki, rank: user.rank, added: amount, reason };
  } catch (err) {
    console.error('KI service error:', err);
    return null;
  }
};

const calculateDuelKI = (answers, isWinner, isPerfect) => {
  let total = 0;
  answers.forEach(a => {
    if (a.correct) {
      total += a.time_ms < 5000 ? KI_VALUES.correct_fast : KI_VALUES.correct_normal;
    } else {
      total += KI_VALUES.wrong_answer;
    }
  });
  if (isWinner) total += KI_VALUES.win_duel;
  if (isPerfect) total += KI_VALUES.perfect_victory;
  return total;
};

const dailyLogin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const lastActive = new Date(user.stats.last_active);
  const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    if (diffDays === 1) {
      user.stats.streak += 1;
    } else {
      user.stats.streak = 1;
    }

    let kiAmount = KI_VALUES.daily_login;
    if (user.stats.streak >= 7) kiAmount += KI_VALUES.streak_7days;

    user.ki = Math.max(0, user.ki + kiAmount);
    user.stats.last_active = now;
    await user.save();
    return { ki: user.ki, rank: user.rank, streak: user.stats.streak, kiAdded: kiAmount };
  }
  return null;
};

module.exports = { addKI, calculateDuelKI, dailyLogin, KI_VALUES };
