require('./setup');
const User = require('../src/models/User');

const makeUser = async (suffix, ki = 1000) => new User({
  uid: `uid_search_${suffix}_${Date.now()}`,
  email: `search_${suffix}${Date.now()}@test.com`,
  username: `Search_${suffix}_${Date.now()}`,
  ki,
  aura: 'shonen',
  rank: 'genin',
}).save();

describe('User Search + Profile', () => {

  test('chercher utilisateur par username', async () => {
    const u = await makeUser('ninja');
    const results = await User.find({ username: new RegExp('Search_ninja', 'i') });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].username).toMatch(/Search_ninja/i);
  });

  test('recherche insensible à la casse', async () => {
    const u = await makeUser('Warrior');
    const results = await User.find({ username: new RegExp('search_warrior', 'i') });
    expect(results.length).toBeGreaterThan(0);
  });

  test('classement par KI descendant', async () => {
    const u1 = await makeUser('rank1', 5000);
    const u2 = await makeUser('rank2', 2000);
    const u3 = await makeUser('rank3', 8000);
    const results = await User.find({
      username: /Search_rank/i
    }).sort({ ki: -1 });
    expect(results[0].ki).toBeGreaterThanOrEqual(results[1].ki);
    expect(results[1].ki).toBeGreaterThanOrEqual(results[2].ki);
  });

  test('profil public ne expose pas les champs sensibles', async () => {
    const u = await makeUser('public1', 3000);
    const profile = await User.findById(u._id)
      .select('username rank ki aura avatarUrl bannerUrl clan clanRole stats createdAt');
    expect(profile.email).toBeUndefined();
    expect(profile.uid).toBeUndefined();
    expect(profile.username).toBeDefined();
    expect(profile.ki).toBeDefined();
  });

  test('update avatarUrl', async () => {
    const u = await makeUser('avatar1');
    expect(u.avatarUrl).toBeNull();
    u.avatarUrl = 'https://res.cloudinary.com/shinken-app/image/upload/test.jpg';
    await u.save();
    const updated = await User.findById(u._id);
    expect(updated.avatarUrl).toContain('cloudinary.com');
  });

  test('update bio', async () => {
    const u = await makeUser('bio1');
    u.bio = 'Otaku de la première heure. Shonen forever.';
    await u.save();
    const updated = await User.findById(u._id);
    expect(updated.bio).toBe('Otaku de la première heure. Shonen forever.');
  });

  test('filtre soul dans la recherche', async () => {
    const u1 = await new User({
      uid: `uid_s1_${Date.now()}`, email: `s1${Date.now()}@t.com`,
      username: `SoulTest1_${Date.now()}`, aura: 'isekai', ki: 500
    }).save();
    const u2 = await new User({
      uid: `uid_s2_${Date.now()}`, email: `s2${Date.now()}@t.com`,
      username: `SoulTest2_${Date.now()}`, aura: 'shonen', ki: 500
    }).save();

    const isekai = await User.find({ username: /SoulTest/, aura: 'isekai' });
    expect(isekai.every(u => u.aura === 'isekai')).toBe(true);
  });

  test('utilisateur banni exclu de la recherche', async () => {
    const u = await makeUser('banned1');
    u.isBanned = true;
    await u.save();
    const results = await User.find({ username: /Search_banned1/, isBanned: false });
    expect(results.length).toBe(0);
  });

  test('leaderboard top 10 par KI', async () => {
    for (let i = 0; i < 3; i++) {
      await makeUser(`lb${i}`, (i + 1) * 1000);
    }
    const top = await User.find({ isBanned: false }).sort({ ki: -1 }).limit(10);
    expect(top.length).toBeGreaterThan(0);
    for (let i = 0; i < top.length - 1; i++) {
      expect(top[i].ki).toBeGreaterThanOrEqual(top[i + 1].ki);
    }
  });
});
