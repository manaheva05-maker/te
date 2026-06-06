const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
  tag: { type: String, required: true, unique: true, maxlength: 4, uppercase: true },
  shogun: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  samurai: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  isPublic: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: true },
  recruitmentOpen: { type: Boolean, default: true },
  minRankRequired: { type: String, enum: ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'], default: 'munou' },
  rules: { type: String, default: '', maxlength: 500 },
  inviteCode: { type: String, unique: true, sparse: true },
  inviteCodeExpiry: { type: Date, default: null },

  elo: { type: Number, default: 0 },
  clanRank: { type: String, enum: ['munou','genin','jonin','kage','daimyo'], default: 'munou' },
  treasury: { type: Number, default: 0 },
  banner: { type: String, default: 'default' },
  bannerUrl: { type: String, default: null },
  emblem: { type: String, default: 'default' },
  emblemUrl: { type: String, default: null },
  colors: { primary: { type: String, default: '#C9A227' }, secondary: { type: String, default: '#8B0000' } },
  description: { type: String, default: '', maxlength: 300 },
  isAnimatedBanner: { type: Boolean, default: false },

  chatEnabled: { type: Boolean, default: true },
  announcementOnly: { type: Boolean, default: false },

  stats: {
    wars_played: { type: Number, default: 0 },
    wars_won: { type: Number, default: 0 },
    tournaments_played: { type: Number, default: 0 },
    tournaments_won: { type: Number, default: 0 },
    total_ki_donated: { type: Number, default: 0 }
  },

  lastActive: { type: Date, default: Date.now },
  shogunLastActive: { type: Date, default: Date.now }
}, { timestamps: true });

clanSchema.virtual('memberCount').get(function () {
  return this.members.length + this.samurai.length + 1;
});

clanSchema.pre('save', function (next) {
  const elo = this.elo;
  if (elo >= 10000) this.clanRank = 'daimyo';
  else if (elo >= 5000) this.clanRank = 'kage';
  else if (elo >= 2000) this.clanRank = 'jonin';
  else if (elo >= 500) this.clanRank = 'genin';
  else this.clanRank = 'munou';
  next();
});

clanSchema.methods.generateInviteCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  this.inviteCode = code;
  this.inviteCodeExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
  return code;
};

module.exports = mongoose.model('Clan', clanSchema);
