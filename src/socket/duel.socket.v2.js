const MultiLangQuestion = require('../models/MultiLangQuestion');
const Question          = require('../models/Question');
const User              = require('../models/User');
const Duel              = require('../models/Duel');
const { getQuestionForPlayer } = require('../services/translation.service');

const RANK_ORDER = ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'];

const duelSocketV2 = (io) => {
  const rooms = new Map();
  // roomId → { players: {}, surge: {}, questions: [] }

  // ─── MATCHMAKING QUEUE ───────────────────────────────────────
  // userId → { socketId, userId, rank, aura, type, joinedAt }
  const queue = new Map();

  const tryMatch = async (io) => {
    const players = [...queue.values()];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        // Must be same type (ranked / friendly)
        if (p1.type !== p2.type) continue;

        // Must be within 1 rank of each other
        const r1 = RANK_ORDER.indexOf(p1.rank);
        const r2 = RANK_ORDER.indexOf(p2.rank);
        if (Math.abs(r1 - r2) > 1) continue;

        // ✅ Match found — remove both from queue
        queue.delete(p1.userId);
        queue.delete(p2.userId);

        try {
          // Create duel in DB
          const duel = await Duel.create({
            player1:   p1.userId,
            player2:   p2.userId,
            type:      p1.type || 'ranked',
            status:    'ban_phase',
          });

          const duelId = duel._id.toString();

          // Notify both players
          io.of('/duel').to(p1.socketId).emit('matchmaking:matched', {
            duelId,
            opponent: { userId: p2.userId, rank: p2.rank, aura: p2.aura },
          });
          io.of('/duel').to(p2.socketId).emit('matchmaking:matched', {
            duelId,
            opponent: { userId: p1.userId, rank: p1.rank, aura: p1.aura },
          });
        } catch (err) {
          console.error('matchmaking create duel error:', err.message);
          // Re-queue both on failure
          queue.set(p1.userId, p1);
          queue.set(p2.userId, p2);
        }

        return; // one match per tick
      }
    }
  };

  // ─── CONNECTION ───────────────────────────────────────────────
  io.of('/duel').on('connection', (socket) => {

    // ── MATCHMAKING: JOIN ──────────────────────────────────────
    socket.on('matchmaking:join', async ({ userId, rank, aura, type }) => {
      // Remove stale entry if any
      queue.delete(userId);

      queue.set(userId, {
        socketId: socket.id,
        userId,
        rank:     rank || 'munou',
        aura:     aura || 'shonen',
        type:     type || 'ranked',
        joinedAt: Date.now(),
      });

      socket.data.userId = userId;

      // Try to find a match immediately
      await tryMatch(io);
    });

    // ── MATCHMAKING: LEAVE ─────────────────────────────────────
    socket.on('matchmaking:leave', ({ userId }) => {
      queue.delete(userId);
    });

    // ── JOIN DUEL ─────────────────────────────────────────────
    socket.on('duel:join', async ({ duelId, userId }) => {
      try {
        socket.join(duelId);
        if (!rooms.has(duelId)) {
          rooms.set(duelId, { players: {}, surge: {}, questions: [] });
        }
        const room = rooms.get(duelId);

        const user = await User.findById(userId).select('language region');
        const playerLang = user?.language || 'fr';

        room.players[userId] = {
          socketId: socket.id,
          userId,
          lang:   playerLang,
          region: user?.region || 'europe',
        };

        socket.data.userId = userId;
        socket.data.duelId = duelId;

        io.of('/duel').to(duelId).emit('duel:player_joined', { userId, lang: playerLang });
      } catch (err) {
        socket.emit('duel:error', { message: err.message });
      }
    });

    // ── BAN ───────────────────────────────────────────────────
    socket.on('duel:ban_selected', ({ duelId, userId, category }) => {
      io.of('/duel').to(duelId).emit('duel:ban_confirmed', { userId, category });
    });

    // ── SEND QUESTIONS (per-player language) ──────────────────
    socket.on('duel:send_questions', async ({ duelId, questionIds }) => {
      try {
        const room = rooms.get(duelId);
        if (!room) return;

        let questions = await MultiLangQuestion.find({ _id: { $in: questionIds } });
        if (!questions.length) {
          questions = await Question.find({ _id: { $in: questionIds } });
        }
        room.questions = questions;

        for (const playerId of Object.keys(room.players)) {
          const player = room.players[playerId];
          if (!player?.socketId) continue;

          const translated = questions.map(q => getQuestionForPlayer(q, player.lang));
          io.of('/duel').to(player.socketId).emit('duel:questions', {
            questions: translated,
            lang: player.lang,
          });
        }
      } catch (err) {
        socket.emit('duel:error', { message: err.message });
      }
    });

    // ── ANSWER ────────────────────────────────────────────────
    socket.on('duel:answer', ({ duelId, userId, questionIndex, answer, time_ms, correct }) => {
      const room = rooms.get(duelId);
      if (!room) return;

      if (!room.surge[userId]) room.surge[userId] = 0;
      if (correct) {
        room.surge[userId]++;
        if (room.surge[userId] >= 3) {
          io.of('/duel').to(duelId).emit('duel:surge_activated', { userId });
          room.surge[userId] = 0;
        }
      } else {
        room.surge[userId] = 0;
      }

      socket.to(duelId).emit('duel:opponent_answered', { userId, questionIndex, correct, time_ms });
    });

    // ── SHIELD ────────────────────────────────────────────────
    socket.on('duel:shield_used', ({ duelId, userId }) => {
      io.of('/duel').to(duelId).emit('duel:shield_activated', { userId });
    });

    // ── DUEL FINISHED ─────────────────────────────────────────
    socket.on('duel:finished', ({ duelId, winner, scores }) => {
      io.of('/duel').to(duelId).emit('duel:result', { winner, scores });
      rooms.delete(duelId);
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove from matchmaking queue
      if (socket.data.userId) {
        queue.delete(socket.data.userId);
      }

      // Notify duel room if in a game
      rooms.forEach((room, duelId) => {
        const player = Object.values(room.players).find(p => p.socketId === socket.id);
        if (player) {
          io.of('/duel').to(duelId).emit('duel:opponent_disconnected', { userId: player.userId });
        }
      });
    });
  });
};

module.exports = duelSocketV2;
