require('./setup');
const User = require('../src/models/User');

// Onboarding is frontend-only, but we can test the user model flags
describe('Onboarding - User flags', () => {

  test('nouvel utilisateur → onboarding requis (pas de flag)', async () => {
    const user = new User({
      uid: `uid_ob_${Date.now()}`,
      email: `ob${Date.now()}@test.com`,
      username: `OnboardUser_${Date.now()}`,
    });
    await user.save();
    // Fresh user has no onboarding flag → frontend shows onboarding
    expect(user.ki).toBe(0);
    expect(user.rank).toBe('munou');
    expect(user.language).toBe('fr');
  });

  test('langue par défaut FR', async () => {
    const user = new User({
      uid: `uid_lang_${Date.now()}`,
      email: `lang${Date.now()}@test.com`,
      username: `LangUser_${Date.now()}`,
    });
    await user.save();
    expect(user.language).toBe('fr');
  });

  test('langue peut être EN', async () => {
    const user = new User({
      uid: `uid_en_${Date.now()}`,
      email: `en${Date.now()}@test.com`,
      username: `ENUser_${Date.now()}`,
      language: 'en'
    });
    await user.save();
    expect(user.language).toBe('en');
  });

  test('soul par défaut shonen', async () => {
    const user = new User({
      uid: `uid_soul_${Date.now()}`,
      email: `soul${Date.now()}@test.com`,
      username: `SoulUser_${Date.now()}`,
    });
    await user.save();
    expect(user.aura).toBe('shonen');
  });
});
