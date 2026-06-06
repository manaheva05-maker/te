const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['ranked','friendly','tournament','clan_war'],
    default: 'ranked'
  },
  bans: {
    player1: { type: String, default: null },
    player2: { type: String, default: null }
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  answers: {
    player1: [{
      question_id: mongoose.Schema.Types.ObjectId,
      answer: Number,
      time_ms: Number,
      correct: Boolean,
      ki_earned: Number
    }],
    player2: [{
      question_id: mongoose.Schema.Types.ObjectId,
      answer: Number,
      time_ms: Number,
      correct: Boolean,
      ki_earned: Number
    }]
  },
  scores: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  },
  surge: {
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  },
  surgeActive: {
    player1: { type: Boolean, default: false },
    player2: { type: Boolean, default: false }
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['waiting','ban_phase','in_progress','finished'],
    default: 'waiting'
  },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
  startedAt: Date,
  finishedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Duel', duelSchema);
