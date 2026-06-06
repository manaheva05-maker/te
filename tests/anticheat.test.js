require('./setup');
const User = require('../src/models/User');
const anticheat = require('../src/middleware/anticheat.middleware');

const makeUser = async () => new User({
  uid: `uid_ac_${Date.now()}`,
  email: `ac${Date.now()}@t.com`,
  username: `AC_${Date.now()}`
}).save();

describe('Anticheat', () => {
  test('pas de flag pour des réponses normales', async () => {
    const user = await makeUser();
    const answers = Array(10).fill({ correct: true, time_ms: 5000 });
    const result = await anticheat(answers, user._id);
    expect(result.flagged).toBe(false);
  });

  test('flag si 5+ réponses correctes < 800ms', async () => {
    const user = await makeUser();
    const answers = [
      ...Array(6).fill({ correct: true, time_ms: 300 }),
      ...Array(4).fill({ correct: true, time_ms: 5000 })
    ];
    const result = await anticheat(answers, user._id);
    expect(result.flagged).toBe(true);
    expect(result.reason).toBe('speed');
    const updated = await User.findById(user._id);
    expect(updated.anticheat.flagged).toBe(true);
    expect(updated.anticheat.reviewRequired).toBe(true);
  });

  test('pas de flag si réponses rapides mais mauvaises', async () => {
    const user = await makeUser();
    const answers = Array(10).fill({ correct: false, time_ms: 200 });
    const result = await anticheat(answers, user._id);
    expect(result.flagged).toBe(false);
  });
});
