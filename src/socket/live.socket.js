const LiveMatch = require('../models/LiveMatch');
const { moderateChat } = require('../services/sensei.service');

const liveSocket = (io) => {
  io.of('/live').on('connection', (socket) => {
    console.log('Live socket connected:', socket.id);

    socket.on('live:join', async ({ matchId, userId, username }) => {
      socket.join(matchId);

      await LiveMatch.findByIdAndUpdate(matchId, {
        $addToSet: { spectators: userId },
        $inc: { spectatorCount: 1 }
      });

      const live = await LiveMatch.findById(matchId);
      const count = live?.spectatorCount || 0;

      io.of('/live').to(matchId).emit('live:spectator_count', { count });
      socket.emit('live:joined', { matchId, spectatorCount: count });
    });

    socket.on('live:leave', async ({ matchId, userId }) => {
      socket.leave(matchId);

      await LiveMatch.findByIdAndUpdate(matchId, {
        $pull: { spectators: userId },
        $inc: { spectatorCount: -1 }
      });

      const live = await LiveMatch.findById(matchId);
      io.of('/live').to(matchId).emit('live:spectator_count', { count: live?.spectatorCount || 0 });
    });

    socket.on('live:chat_message', async ({ matchId, userId, username, message }) => {
      const isToxic = await moderateChat(message);
      if (isToxic) {
        socket.emit('live:chat_blocked', { reason: 'Message bloqué par Sensei AI' });
        return;
      }

      const msg = { user: userId, username, message, sentAt: new Date() };

      await LiveMatch.findByIdAndUpdate(matchId, {
        $push: { chatMessages: { $each: [msg], $slice: -200 } }
      });

      io.of('/live').to(matchId).emit('live:chat_message', msg);
    });

    socket.on('live:gift_sent', ({ matchId, gift, sender, recipient, globalNotif }) => {
      // Emit to match room
      io.of('/live').to(matchId).emit('live:gift_received', { gift, sender, recipient });

      // Global notification for big gifts
      if (globalNotif) {
        io.of('/live').emit('live:global_gift_notification', {
          sender, gift, matchId,
          message: `🎁 ${sender.username} a envoyé un ${gift.type} à ${recipient?.username || 'le clan'}!`
        });
      }
    });

    socket.on('live:vote_cast', ({ matchId, category, votes }) => {
      io.of('/live').to(matchId).emit('live:vote_update', { category, votes });
    });

    socket.on('live:score_update', ({ matchId, scores, currentManche }) => {
      io.of('/live').to(matchId).emit('live:score_update', { scores, currentManche });
    });

    socket.on('live:manche_start', ({ matchId, manche, type }) => {
      io.of('/live').to(matchId).emit('live:manche_start', { manche, type });
    });

    socket.on('live:manche_end', ({ matchId, manche, winner, points }) => {
      io.of('/live').to(matchId).emit('live:manche_end', { manche, winner, points });
    });

    socket.on('live:match_end', ({ matchId, winner, scores }) => {
      io.of('/live').to(matchId).emit('live:match_end', { winner, scores });
    });

    socket.on('live:pause', ({ matchId, reason, duration }) => {
      io.of('/live').to(matchId).emit('live:pause', { reason, duration });
    });

    socket.on('disconnect', () => {});
  });
};

module.exports = liveSocket;
