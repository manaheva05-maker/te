const mongoose = require('mongoose');

const liveMatchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  clan1: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  clan2: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
  status: { type: String, enum: ['waiting','live','finished'], default: 'waiting' },
  spectators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  spectatorCount: { type: Number, default: 0 },
  scores: {
    clan1: { type: Number, default: 0 },
    clan2: { type: Number, default: 0 }
  },
  currentManche: { type: Number, default: 1 },
  mancheResults: [{
    manche: Number,
    type: String,
    winner: mongoose.Schema.Types.ObjectId,
    points: Number
  }],
  gifts: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recipientClan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', default: null },
    giftType: { type: String, enum: ['sakura','eclair','flamme','ryu','shinken_gift','daimyo'] },
    ryuCost: Number,
    kiGiven: Number,
    sentAt: { type: Date, default: Date.now }
  }],
  giftRevenue: { type: Number, default: 0 },
  publicVote: {
    category: { type: String, default: null },
    votes: { type: Map, of: Number, default: {} }
  },
  predictions: [{
    user: mongoose.Schema.Types.ObjectId,
    predictedWinner: mongoose.Schema.Types.ObjectId,
    kiStaked: Number,
    correct: { type: Boolean, default: null }
  }],
  chatMessages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    message: String,
    sentAt: { type: Date, default: Date.now }
  }],
  topDonators: [{
    user: mongoose.Schema.Types.ObjectId,
    username: String,
    totalRC: Number
  }],
  replay_url: { type: String, default: null },
  startedAt: Date,
  finishedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('LiveMatch', liveMatchSchema);
