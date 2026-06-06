const mongoose = require('mongoose');

const clanMessageSchema = new mongoose.Schema({
  clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUsername: { type: String, required: true },
  senderRole: { type: String, enum: ['shogun', 'samurai', 'ronin'], default: 'ronin' },
  type: {
    type: String,
    enum: ['text', 'system', 'duel_share', 'announcement'],
    default: 'text'
  },
  content: { type: String, required: true, maxlength: 500 },
  isPinned: { type: Boolean, default: false },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  // For duel_share type
  duelRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Duel', default: null },
  duelResult: {
    winner: String,
    score: String,
    kiEarned: Number
  },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Index for fast clan message retrieval
clanMessageSchema.index({ clan: 1, createdAt: -1 });

module.exports = mongoose.model('ClanMessage', clanMessageSchema);
