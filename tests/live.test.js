require('./setup');
const LiveMatch = require('../src/models/LiveMatch');
const User = require('../src/models/User');
const Clan = require('../src/models/Clan');
const Tournament = require('../src/models/Tournament');

const makeBase = async () => {
  const u1 = await new User({ uid: 'lu1', email: 'lu1@t.com', username: 'LUser1' }).save();
  const u2 = await new User({ uid: 'lu2', email: 'lu2@t.com', username: 'LUser2' }).save();
  const c1 = await new Clan({ name: 'LiveClan1', tag: 'LV1', shogun: u1._id }).save();
  const c2 = await new Clan({ name: 'LiveClan2', tag: 'LV2', shogun: u2._id }).save();
  const t = await new Tournament({
    name: { fr: 'Test', en: 'Test' }, type: 'mondial', season: 'S1',
    startDate: new Date(), endDate: new Date(Date.now() + 86400000),
    registrationStart: new Date(), registrationEnd: new Date(Date.now() + 86400000)
  }).save();
  return { u1, u2, c1, c2, t };
};

describe('LiveMatch', () => {
  test('créer un live match', async () => {
    const { c1, c2, t } = await makeBase();
    const live = new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id });
    await live.save();
    expect(live.status).toBe('waiting');
    expect(live.spectatorCount).toBe(0);
    expect(live.scores.clan1).toBe(0);
    expect(live.scores.clan2).toBe(0);
  });

  test('ajouter un spectateur', async () => {
    const { u1, c1, c2, t } = await makeBase();
    const live = new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id });
    live.spectators.push(u1._id);
    live.spectatorCount = 1;
    await live.save();
    expect(live.spectatorCount).toBe(1);
  });

  test('enregistrer un cadeau', async () => {
    const { u1, c1, c2, t } = await makeBase();
    const live = new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id, status: 'live' });
    live.gifts.push({
      sender: u1._id,
      recipientClan: c1._id,
      giftType: 'ryu',
      ryuCost: 100,
      kiGiven: 15
    });
    live.giftRevenue += 100;
    await live.save();
    expect(live.gifts.length).toBe(1);
    expect(live.giftRevenue).toBe(100);
  });

  test('enregistrer une prédiction', async () => {
    const { u1, c1, c2, t } = await makeBase();
    const live = new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id, status: 'live' });
    live.predictions.push({ user: u1._id, predictedWinner: c1._id, kiStaked: 50, correct: null });
    await live.save();
    expect(live.predictions.length).toBe(1);
    expect(live.predictions[0].correct).toBeNull();
  });

  test('message chat ajouté', async () => {
    const { u1, c1, c2, t } = await makeBase();
    const live = new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id, status: 'live' });
    live.chatMessages.push({ user: u1._id, username: 'LUser1', message: 'GG!', sentAt: new Date() });
    await live.save();
    expect(live.chatMessages.length).toBe(1);
    expect(live.chatMessages[0].message).toBe('GG!');
  });

  test('score mis à jour', async () => {
    const { c1, c2, t } = await makeBase();
    const live = await new LiveMatch({ tournament: t._id, clan1: c1._id, clan2: c2._id }).save();
    live.scores.clan1 = 3;
    live.scores.clan2 = 1;
    await live.save();
    expect(live.scores.clan1).toBe(3);
  });
});
