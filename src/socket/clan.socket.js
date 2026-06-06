const ClanMessage = require('../models/ClanMessage');
const Clan = require('../models/Clan');
const User = require('../models/User');

const clanSocket = (io) => {
  io.of('/clan').on('connection', (socket) => {
    console.log('Clan socket connected:', socket.id);

    // Join clan room
    socket.on('clan:join', async ({ clanId, userId }) => {
      try {
        const clan = await Clan.findById(clanId);
        if (!clan) return socket.emit('clan:error', { message: 'Clan introuvable' });

        const isMember =
          clan.shogun.toString() === userId ||
          clan.samurai.some(s => s.toString() === userId) ||
          clan.members.some(m => m.toString() === userId);

        if (!isMember) return socket.emit('clan:error', { message: 'Membres uniquement' });

        socket.join(clanId);
        socket.data.userId = userId;
        socket.data.clanId = clanId;

        // Send last 50 messages on join
        const messages = await ClanMessage.find({ clan: clanId, deletedAt: null })
          .sort({ createdAt: -1 }).limit(50);

        socket.emit('clan:history', { messages: messages.reverse() });
        io.of('/clan').to(clanId).emit('clan:member_online', { userId });
      } catch (err) {
        socket.emit('clan:error', { message: err.message });
      }
    });

    // Send message
    socket.on('clan:message', async ({ clanId, userId, content, type }) => {
      try {
        if (!content?.trim()) return;

        const clan = await Clan.findById(clanId);
        if (!clan || !clan.chatEnabled) return;

        const isMember =
          clan.shogun.toString() === userId ||
          clan.samurai.some(s => s.toString() === userId) ||
          clan.members.some(m => m.toString() === userId);
        if (!isMember) return;

        if (clan.announcementOnly) {
          const canWrite =
            clan.shogun.toString() === userId ||
            clan.samurai.some(s => s.toString() === userId);
          if (!canWrite) {
            socket.emit('clan:error', { message: 'Mode annonce: Shogun/Samurai uniquement' });
            return;
          }
        }

        const user = await User.findById(userId).select('username clanRole');
        const message = await ClanMessage.create({
          clan: clanId,
          sender: userId,
          senderUsername: user?.username || 'Unknown',
          senderRole: user?.clanRole || 'ronin',
          type: type || 'text',
          content: content.trim().substring(0, 500)
        });

        io.of('/clan').to(clanId).emit('clan:message', { message });
      } catch (err) {
        socket.emit('clan:error', { message: err.message });
      }
    });

    // Share duel result in chat
    socket.on('clan:share_duel', async ({ clanId, userId, duelId, result }) => {
      try {
        const user = await User.findById(userId).select('username clanRole');
        const message = await ClanMessage.create({
          clan: clanId,
          sender: userId,
          senderUsername: user?.username || 'Unknown',
          senderRole: user?.clanRole || 'ronin',
          type: 'duel_share',
          content: `${result.won ? '🏆 Victoire' : '💀 Défaite'} — ${result.score} — +${result.kiEarned} KI`,
          duelRef: duelId,
          duelResult: result
        });
        io.of('/clan').to(clanId).emit('clan:message', { message });
      } catch (err) {
        socket.emit('clan:error', { message: err.message });
      }
    });

    // Typing indicator
    socket.on('clan:typing', ({ clanId, userId, username }) => {
      socket.to(clanId).emit('clan:typing', { userId, username });
    });

    socket.on('clan:stop_typing', ({ clanId, userId }) => {
      socket.to(clanId).emit('clan:stop_typing', { userId });
    });

    // React to message
    socket.on('clan:react', async ({ clanId, msgId, userId, emoji }) => {
      try {
        const msg = await ClanMessage.findById(msgId);
        if (!msg) return;
        const ex = msg.reactions.find(r => r.emoji === emoji);
        if (ex) {
          const idx = ex.users.findIndex(u => u.toString() === userId);
          idx >= 0 ? ex.users.splice(idx, 1) : ex.users.push(userId);
        } else {
          msg.reactions.push({ emoji, users: [userId] });
        }
        await msg.save();
        io.of('/clan').to(clanId).emit('clan:react_update', { msgId, reactions: msg.reactions });
      } catch (err) {
        socket.emit('clan:error', { message: err.message });
      }
    });

    // Pin message
    socket.on('clan:pin', async ({ clanId, msgId, userId }) => {
      try {
        const clan = await Clan.findById(clanId);
        if (!clan) return;
        const canPin =
          clan.shogun.toString() === userId ||
          clan.samurai.some(s => s.toString() === userId);
        if (!canPin) return;
        const msg = await ClanMessage.findByIdAndUpdate(msgId, { isPinned: true }, { new: true });
        io.of('/clan').to(clanId).emit('clan:pinned', { message: msg });
      } catch (err) {
        socket.emit('clan:error', { message: err.message });
      }
    });

    // Join request notification (to Shogun/Samurai)
    socket.on('clan:notify_request', ({ clanId, request }) => {
      io.of('/clan').to(clanId).emit('clan:new_request', { request });
    });

    // Request reviewed notification
    socket.on('clan:request_reviewed', ({ clanId, userId, approved }) => {
      io.of('/clan').to(clanId).emit('clan:request_result', { userId, approved });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.data.clanId && socket.data.userId) {
        io.of('/clan').to(socket.data.clanId).emit('clan:member_offline', { userId: socket.data.userId });
      }
    });
  });
};

module.exports = clanSocket;
