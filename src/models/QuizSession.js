const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['solo', 'multiplayer', 'ranked'], default: 'solo' },
  category: String,
  language: { type: String, default: 'fr' },

  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answeredIndex: Number,
    correct: Boolean,
    timeMs: Number,
    combo: Number,
    pointsEarned: Number,
  }],

  score: { type: Number, default: 0 },
  maxCombo: { type: Number, default: 0 },
  currentCombo: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },

  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,

  roomId: String,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

quizSessionSchema.index({ user: 1, startedAt: -1 });
quizSessionSchema.index({ score: -1 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
