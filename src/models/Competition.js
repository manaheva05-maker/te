const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 50 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorUsername: { type: String, required: true },
  type: {
    type: String,
    enum: ['solo_1v1', 'solo_battle_royale', 'clan_war'],
    required: true
  },
  soul: {
    type: String,
    enum: ['shonen','isekai','seinen','mystere','dark','mecha','slice','fantasy','gore','mixed'],
    default: 'mixed'
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'ongoing', 'finished', 'cancelled'],
    default: 'open'
  },
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true },

  maxParticipants: { type: Number, default: 8, min: 2, max: 50 },
  entryFeeKI: { type: Number, default: 0, min: 0 },
  prizePoolKI: { type: Number, default: 0 },

  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    rank: String,
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['waiting','active','eliminated','winner'], default: 'waiting' },
    score: { type: Number, default: 0 }
  }],

  // For clan competitions
  clanParticipants: [{
    clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan' },
    clanName: String,
    clanTag: String,
    joinedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 }
  }],

  bracket: { type: Array, default: [] },
  currentRound: { type: Number, default: 1 },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  winnerClan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', default: null },

  scheduledAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null },

  description: { type: String, default: '', maxlength: 200 },
  rules: { type: String, default: '', maxlength: 300 },
}, { timestamps: true });

// Auto-generate invite code
competitionSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'COMP';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    this.inviteCode = code;
  }
  next();
});

module.exports = mongoose.model('Competition', competitionSchema);
