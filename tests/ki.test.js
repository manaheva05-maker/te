require('./setup');
const User = require('../src/models/User');
const { addKI, calculateDuelKI, dailyLogin, KI_VALUES } = require('../src/services/ki.service');

const makeUser = async (ki = 0) => {
  const u = new User({
    uid: `uid_${Date.now()}_${Math.random()}`,
    email: `test${Date.now()}${Math.random()}@test.com`,
    username: `user_${Date.now()}_${Math.floor(Math.random()*9999)}`,
    ki
  });
  await u.save();
  return u;
};

describe('KI Service', () => {
  test('addKI ajoute du KI correctement', async () => {
    const user = await makeUser(100);
    const result = await addKI(user._id, 50, 'test');
    expect(result.ki).toBe(150);
    expect(result.added).toBe(50);
  });

  test('addKI ne descend pas sous 0', async () => {
    const user = await makeUser(10);
    const result = await addKI(user._id, -100, 'test');
    expect(result.ki).toBe(0);
  });

  test('rang mis à jour automatiquement', async () => {
    const user = await makeUser(0);
    await addKI(user._id, 600, 'test');
    const updated = await User.findById(user._id);
    expect(updated.rank).toBe('genin');
  });

  test('calculateDuelKI victoire parfaite', () => {
    const answers = Array(10).fill({ correct: true, time_ms: 3000 });
    const ki = calculateDuelKI(answers, true, true);
    expect(ki).toBe(10 * KI_VALUES.correct_fast + KI_VALUES.win_duel + KI_VALUES.perfect_victory);
  });

  test('calculateDuelKI défaite', () => {
    const answers = Array(10).fill({ correct: false, time_ms: 5000 });
    const ki = calculateDuelKI(answers, false, false);
    expect(ki).toBe(10 * KI_VALUES.wrong_answer);
  });

  test('dailyLogin récompense connexion', async () => {
    const user = await makeUser(100);
    user.stats.last_active = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await user.save();
    const result = await dailyLogin(user._id);
    expect(result).not.toBeNull();
    expect(result.kiAdded).toBe(KI_VALUES.daily_login);
  });

  test('dailyLogin pas de récompense si déjà connecté aujourd\'hui', async () => {
    const user = await makeUser(100);
    const result = await dailyLogin(user._id);
    expect(result).toBeNull();
  });
});
