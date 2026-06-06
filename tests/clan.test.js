require('./setup');
const User = require('../src/models/User');
const Clan = require('../src/models/Clan');

const makeUser = async (suffix, ki = 2500) => new User({
  uid: `uid_${suffix}`,
  email: `${suffix}@clan.com`,
  username: `Player_${suffix}`,
  ki
}).save();

describe('Clan', () => {
  test('créer un clan', async () => {
    const shogun = await makeUser('c1');
    const clan = new Clan({
      name: 'Clan Akuma',
      tag: 'AKUM',
      shogun: shogun._id
    });
    await clan.save();
    expect(clan._id).toBeDefined();
    expect(clan.elo).toBe(0);
    expect(clan.clanRank).toBe('munou');
    expect(clan.treasury).toBe(0);
  });

  test('tag en majuscules unique', async () => {
    const u1 = await makeUser('c2');
    const u2 = await makeUser('c3');
    await new Clan({ name: 'Clan One', tag: 'TEST', shogun: u1._id }).save();
    const dup = new Clan({ name: 'Clan Two', tag: 'TEST', shogun: u2._id });
    await expect(dup.save()).rejects.toThrow();
  });

  test('rang clan mis à jour selon ELO', async () => {
    const u = await makeUser('c4');
    const clan = new Clan({ name: 'Elite Clan', tag: 'ELIT', shogun: u._id, elo: 600 });
    await clan.save();
    expect(clan.clanRank).toBe('genin');
  });

  test('daimyo rank à 10000 ELO', async () => {
    const u = await makeUser('c5');
    const clan = new Clan({ name: 'Daimyo Clan', tag: 'DAIM', shogun: u._id, elo: 12000 });
    await clan.save();
    expect(clan.clanRank).toBe('daimyo');
  });

  test('ajouter membre au clan', async () => {
    const shogun = await makeUser('c6');
    const member = await makeUser('c7');
    const clan = new Clan({ name: 'Test Clan', tag: 'TCLX', shogun: shogun._id });
    clan.members.push(member._id);
    await clan.save();
    expect(clan.members.length).toBe(1);
  });

  test('treasury contribution', async () => {
    const u = await makeUser('c8');
    const clan = new Clan({ name: 'Rich Clan', tag: 'RICH', shogun: u._id, treasury: 0 });
    await clan.save();
    clan.treasury += 200;
    await clan.save();
    expect(clan.treasury).toBe(200);
  });
});
