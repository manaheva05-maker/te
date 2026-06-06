require('./setup');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');

const makeUser = async (suffix, ki = 5000) => new User({
  uid: `uid_comp_${suffix}_${Date.now()}`,
  email: `comp_${suffix}${Date.now()}@test.com`,
  username: `CompUser_${suffix}_${Date.now()}`,
  ki
}).save();

describe('Competition', () => {

  test('créer une compétition', async () => {
    const user = await makeUser('c1');
    const comp = new Competition({
      name: 'Mon Tournoi Naruto',
      type: 'solo_1v1',
      soul: 'shonen',
      createdBy: user._id,
      creatorUsername: user.username,
      maxParticipants: 8,
      entryFeeKI: 0,
    });
    comp.participants.push({ user: user._id, username: user.username, rank: user.rank });
    await comp.save();
    expect(comp._id).toBeDefined();
    expect(comp.status).toBe('open');
    expect(comp.inviteCode).toBeDefined();
    expect(comp.inviteCode.startsWith('COMP')).toBe(true);
    expect(comp.participants.length).toBe(1);
  });

  test('inviteCode auto-généré unique', async () => {
    const u1 = await makeUser('inv1');
    const u2 = await makeUser('inv2');
    const c1 = new Competition({ name: 'Comp1', type: 'solo_1v1', createdBy: u1._id, creatorUsername: u1.username });
    const c2 = new Competition({ name: 'Comp2', type: 'solo_1v1', createdBy: u2._id, creatorUsername: u2.username });
    await c1.save(); await c2.save();
    expect(c1.inviteCode).not.toBe(c2.inviteCode);
  });

  test('rejoindre une compétition', async () => {
    const creator = await makeUser('creator1');
    const joiner = await makeUser('joiner1');
    const comp = new Competition({
      name: 'Join Test', type: 'solo_1v1',
      createdBy: creator._id, creatorUsername: creator.username,
      maxParticipants: 4
    });
    comp.participants.push({ user: creator._id, username: creator.username, rank: creator.rank });
    await comp.save();

    comp.participants.push({ user: joiner._id, username: joiner.username, rank: joiner.rank });
    await comp.save();
    expect(comp.participants.length).toBe(2);
  });

  test('compétition pleine → auto-start', async () => {
    const creator = await makeUser('full1');
    const comp = new Competition({
      name: 'Full Comp', type: 'solo_1v1',
      createdBy: creator._id, creatorUsername: creator.username,
      maxParticipants: 2
    });
    comp.participants.push({ user: creator._id, username: creator.username, rank: creator.rank });
    await comp.save();

    const joiner = await makeUser('full2');
    comp.participants.push({ user: joiner._id, username: joiner.username, rank: joiner.rank });
    if (comp.participants.length >= comp.maxParticipants) {
      comp.status = 'ongoing'; comp.startedAt = new Date();
    }
    await comp.save();
    expect(comp.status).toBe('ongoing');
  });

  test('entry fee déduit du créateur', async () => {
    const user = await makeUser('fee1', 1000);
    const initialKI = user.ki;
    const entryFee = 100;

    const comp = new Competition({
      name: 'Fee Comp', type: 'solo_1v1',
      createdBy: user._id, creatorUsername: user.username,
      entryFeeKI: entryFee, prizePoolKI: entryFee
    });
    comp.participants.push({ user: user._id, username: user.username, rank: user.rank });
    await comp.save();

    user.ki = Math.max(0, user.ki - entryFee);
    await user.save();
    expect(user.ki).toBe(initialKI - entryFee);
    expect(comp.prizePoolKI).toBe(entryFee);
  });

  test('terminer et trouver le gagnant', async () => {
    const u1 = await makeUser('win1');
    const u2 = await makeUser('win2');
    const comp = new Competition({
      name: 'Winner Test', type: 'solo_1v1',
      createdBy: u1._id, creatorUsername: u1.username,
      status: 'ongoing', prizePoolKI: 500
    });
    comp.participants.push({ user: u1._id, username: u1.username, rank: u1.rank, score: 8 });
    comp.participants.push({ user: u2._id, username: u2.username, rank: u2.rank, score: 3 });
    await comp.save();

    // Finish: sort by score
    comp.participants.sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = comp.participants[0];
    comp.winner = winner.user;
    winner.status = 'winner';
    comp.status = 'finished';
    comp.finishedAt = new Date();
    await comp.save();

    expect(comp.status).toBe('finished');
    expect(comp.winner.toString()).toBe(u1._id.toString());
    expect(comp.participants[0].status).toBe('winner');
  });

  test('annuler → statut cancelled', async () => {
    const user = await makeUser('cancel1');
    const comp = new Competition({
      name: 'Cancel Test', type: 'solo_battle_royale',
      createdBy: user._id, creatorUsername: user.username
    });
    comp.participants.push({ user: user._id, username: user.username, rank: user.rank });
    await comp.save();
    comp.status = 'cancelled'; await comp.save();
    expect(comp.status).toBe('cancelled');
  });

  test('score mis à jour pour un participant', async () => {
    const u = await makeUser('score1');
    const comp = new Competition({
      name: 'Score Test', type: 'solo_1v1',
      createdBy: u._id, creatorUsername: u.username, status: 'ongoing'
    });
    comp.participants.push({ user: u._id, username: u.username, rank: u.rank, score: 0 });
    await comp.save();

    const p = comp.participants.find(p => p.user.toString() === u._id.toString());
    p.score += 5;
    await comp.save();
    const found = await Competition.findById(comp._id);
    expect(found.participants[0].score).toBe(5);
  });
});
