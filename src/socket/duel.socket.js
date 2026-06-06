const duelSocket = (io) => {
  const rooms = new Map(); // duelId -> { player1: socketId, player2: socketId, surge: {p1: 0, p2: 0} }

  io.of('/duel').on('connection', (socket) => {
    console.log('Duel socket connected:', socket.id);

    socket.on('duel:join', ({ duelId, userId }) => {
      socket.join(duelId);
      if (!rooms.has(duelId)) rooms.set(duelId, { players: {}, surge: {} });
      rooms.get(duelId).players[userId] = socket.id;
      io.of('/duel').to(duelId).emit('duel:player_joined', { userId });
    });

    socket.on('duel:ban_selected', ({ duelId, userId, category }) => {
      io.of('/duel').to(duelId).emit('duel:ban_confirmed', { userId, category });
    });

    socket.on('duel:answer', ({ duelId, userId, questionIndex, answer, time_ms, correct }) => {
      const room = rooms.get(duelId);
      if (!room) return;

      // Track surge (consecutive correct)
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

      io.of('/duel').to(duelId).emit('duel:answer_received', { userId, questionIndex, correct });
    });

    socket.on('duel:shield_used', ({ duelId, userId }) => {
      io.of('/duel').to(duelId).emit('duel:shield_activated', { userId });
    });

    socket.on('duel:finished', ({ duelId, winner }) => {
      io.of('/duel').to(duelId).emit('duel:result', { winner });
      rooms.delete(duelId);
    });

    socket.on('disconnect', () => {
      rooms.forEach((room, duelId) => {
        Object.entries(room.players).forEach(([userId, sid]) => {
          if (sid === socket.id) {
            io.of('/duel').to(duelId).emit('duel:opponent_disconnected', { userId });
          }
        });
      });
    });
  });
};

module.exports = duelSocket;
