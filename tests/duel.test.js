require('./setup');
const User = require('../src/models/User');
const Duel = require('../src/models/Duel');
const Question = require('../src/models/Question');
const { calculateDuelKI } = require('../src/services/ki.service');

const makeUser = async (suffix) => new User({
  uid: `uid_${suffix}`,
  email: `${suffix}@test.com`,
  username: `Player_${suffix}`
}).save();

const makeQuestion = async (soul = 'shonen') => new Question({
  text: { fr: 'Question test?', en: 'Test question?' },
  options: [
    { fr: 'A', en: 'A' }, { fr: 'B', en: 'B' },
    { fr: 'C', en: 'C' }, { fr: 'D', en: 'D' }
  ],
  correct_index: 0,
  anime: 'Naruto',
  category: soul,
  soul
}).save();

describe('Duel', () => {
  test('créer un duel', async () => {
    const p1 = await makeUser('d1');
    const p2 = await makeUser('d2');
    const duel = new Duel({ player1: p1._id, player2: p2._id, type: 'ranked' });
    await duel.save();
    expect(duel.status).toBe('waiting');
    expect(duel.scores.player1).toBe(0);
    expect(duel.scores.player2).toBe(0);
  });

  test('ban phase — deux bans définis', async () => {
    const p1 = await makeUser('d3');
    const p2 = await makeUser('d4');
    const duel = new Duel({
      player1: p1._id, player2: p2._id,
      bans: { player1: 'mecha', player2: 'isekai' },
      status: 'ban_phase'
    });
    await duel.save();
    expect(duel.bans.player1).toBe('mecha');
    expect(duel.bans.player2).toBe('isekai');
  });

  test('questions chargées après ban', async () => {
    const q1 = await makeQuestion('shonen');
    const q2 = await makeQuestion('seinen');
    const p1 = await makeUser('d5');
    const p2 = await makeUser('d6');

    const duel = new Duel({
      player1: p1._id, player2: p2._id,
      questions: [q1._id, q2._id],
      status: 'in_progress'
    });
    await duel.save();
    expect(duel.questions.length).toBe(2);
    expect(duel.status).toBe('in_progress');
  });

  test('calcul KI victoire parfaite', () => {
    const answers = Array(10).fill({ correct: true, time_ms: 3000 });
    const ki = calculateDuelKI(answers, true, true);
    expect(ki).toBeGreaterThan(100);
  });

  test('calcul KI défaite totale', () => {
    const answers = Array(10).fill({ correct: false, time_ms: 10000 });
    const ki = calculateDuelKI(answers, false, false);
    expect(ki).toBeLessThan(0);
  });

  test('duel terminé avec winner', async () => {
    const p1 = await makeUser('d7');
    const p2 = await makeUser('d8');
    const duel = new Duel({
      player1: p1._id, player2: p2._id,
      status: 'finished',
      winner: p1._id,
      scores: { player1: 8, player2: 4 },
      finishedAt: new Date()
    });
    await duel.save();
    expect(duel.winner.toString()).toBe(p1._id.toString());
  });
});
