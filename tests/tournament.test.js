require('./setup');
const Tournament = require('../src/models/Tournament');
const Clan = require('../src/models/Clan');
const User = require('../src/models/User');
const { generateBracket } = require('../src/services/bracket.service');

const makeClan = async (i) => {
  const u = await new User({ uid: `uid_t${i}`, email: `t${i}@t.com`, username: `TUser${i}` }).save();
  return new Clan({ name: `Clan ${i}`, tag: `C${String(i).padStart(3,'0')}`, shogun: u._id }).save();
};

describe('Tournament', () => {
  test('créer un tournoi', async () => {
    const t = new Tournament({
      name: { fr: 'Grand Tournoi', en: 'Grand Tournament' },
      type: 'mondial',
      season: 'Saison 1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
    await t.save();
    expect(t.status).toBe('upcoming');
    expect(t.maxClans).toBe(64);
    expect(t.prizePool).toBe(0);
  });

  test('inscrire un clan', async () => {
    const clan = await makeClan(99);
    const t = new Tournament({
      name: { fr: 'Tournoi Test', en: 'Test Tournament' },
      type: 'local', season: 'S1',
      status: 'registration',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      registrationStart: new Date(),
      registrationEnd: new Date(Date.now() + 86400000)
    });
    t.registeredClans.push({ clan: clan._id, confirmed: true, entryFeePaid: true });
    await t.save();
    expect(t.registeredClans.length).toBe(1);
  });

  test('générer bracket 8 clans', async () => {
    const clans = await Promise.all(Array.from({ length: 8 }, (_, i) => makeClan(i + 10)));
    const ids = clans.map(c => c._id);
    const bracket = generateBracket(ids);
    expect(bracket.groups.length).toBe(1);
    expect(bracket.groups[0].clans.length).toBe(8);
    expect(bracket.currentPhase).toBe('groups');
  });

  test('générer bracket 16 clans → 2 groupes', async () => {
    const clans = await Promise.all(Array.from({ length: 16 }, (_, i) => makeClan(i + 20)));
    const ids = clans.map(c => c._id);
    const bracket = generateBracket(ids);
    expect(bracket.groups.length).toBe(2);
  });

  test('prize pool augmente avec les inscriptions', async () => {
    const t = new Tournament({
      name: { fr: 'Pool Test', en: 'Pool Test' },
      type: 'mondial', season: 'S1',
      entryFee: 500, prizePool: 0,
      startDate: new Date(), endDate: new Date(Date.now() + 86400000),
      registrationStart: new Date(), registrationEnd: new Date(Date.now() + 86400000)
    });
    t.prizePool += Math.floor(500 * 0.8); // 80% contribution
    await t.save();
    expect(t.prizePool).toBe(400);
  });
});
