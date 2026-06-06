const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    fr: { type: String, required: true },
    en: { type: String, required: true }
  },
  type: { type: String, enum: ['local','regional','mondial'], required: true },
  season: { type: String, required: true },
  status: {
    type: String,
    enum: ['upcoming','registration','ongoing','finished'],
    default: 'upcoming'
  },
  maxClans: { type: Number, default: 64 },
  registeredClans: [{
    clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan' },
    registeredAt: { type: Date, default: Date.now },
    confirmed: { type: Boolean, default: false },
    entryFeePaid: { type: Boolean, default: false }
  }],
  entryFee: { type: Number, default: 500 },
  prizePool: { type: Number, default: 0 },
  bracket: {
    groups: { type: Array, default: [] },
    quarters: { type: Array, default: [] },
    semis: { type: Array, default: [] },
    final: { type: Object, default: null }
  },
  currentPhase: { type: String, default: 'groups' },
  liveMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveMatch', default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', default: null },
  registrationStart: Date,
  registrationEnd: Date,
  startDate: Date,
  endDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
