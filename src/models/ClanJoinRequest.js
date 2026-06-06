const mongoose = require('mongoose');

const clanJoinRequestSchema = new mongoose.Schema({
  clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  userRank: { type: String, default: 'munou' },
  userKI: { type: Number, default: 0 },
  userAura: { type: String, default: 'shonen' },
  message: { type: String, default: '', maxlength: 200 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectReason: { type: String, default: '' },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, { timestamps: true });

clanJoinRequestSchema.index({ clan: 1, status: 1 });
clanJoinRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('ClanJoinRequest', clanJoinRequestSchema);
