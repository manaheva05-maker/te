const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20, trim: true },
  password: { type: String, required: true, select: false },

  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, select: false },
  emailVerifyExpires: { type: Date, select: false },

  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  refreshTokens: { type: [String], select: false, default: [] },

  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },

  avatar: { type: String, default: 'default' },
  avatarUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  bio: { type: String, default: '', maxlength: 150 },

  aura: {
    type: String,
    enum: ['shonen','isekai','seinen','mystere','dark','mecha','slice','fantasy','gore'],
    default: 'shonen'
  },
  secondAura: { type: String, default: null },

  ki: { type: Number, default: 0, min: 0 },
  rank: {
    type: String,
    enum: ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'],
    default: 'munou'
  },
  ryu_coins: { type: Number, default: 0 },
  chakra: { type: Number, default: 0 },

  clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', default: null },
  clanRole: { type: String, enum: ['shogun','samurai','ronin'], default: 'ronin' },

  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  stats: {
    duels_played: { type: Number, default: 0 },
    duels_won: { type: Number, default: 0 },
    perfect_victories: { type: Number, default: 0 },
    tournaments_played: { type: Number, default: 0 },
    gifts_sent: { type: Number, default: 0 },
    gifts_received: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    last_active: { type: Date, default: Date.now },
    quiz_played: { type: Number, default: 0 },
    quiz_best_combo: { type: Number, default: 0 },
    quiz_total_score: { type: Number, default: 0 },
  },

  battlePass: {
    active: { type: Boolean, default: false },
    level: { type: Number, default: 0 },
    season: { type: String, default: null }
  },
  cosmetics: {
    auras: { type: [String], default: ['default'] },
    avatars: { type: [String], default: ['default'] },
    wallpapers: { type: [String], default: [] },
    titles: { type: [String], default: [] }
  },

  language: { type: String, default: 'fr' },
  region: {
    type: String,
    enum: ['europe', 'americas', 'asia', 'africa'],
    default: 'europe',
  },
  hasCompletedRegionSetup: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  anticheat: {
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
    reviewRequired: { type: Boolean, default: false }
  },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ ki: -1 });
userSchema.index({ username: 'text' });
userSchema.index({ aura: 1 });

userSchema.virtual('followersCount').get(function () {
  return this.followers.length;
});
userSchema.virtual('followingCount').get(function () {
  return this.following.length;
});

userSchema.pre('save', function (next) {
  const ki = this.ki;
  if (ki >= 75000) this.rank = 'shinken';
  else if (ki >= 40000) this.rank = 'ryuken';
  else if (ki >= 20000) this.rank = 'akatsuki';
  else if (ki >= 10000) this.rank = 'kage';
  else if (ki >= 5000) this.rank = 'jonin';
  else if (ki >= 2000) this.rank = 'chunin';
  else if (ki >= 500) this.rank = 'genin';
  else this.rank = 'munou';
  next();
});

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);
