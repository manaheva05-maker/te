const User = require('../models/User');

const RANK_ORDER = ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'];

const findMatch = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const rankIndex = RANK_ORDER.indexOf(user.rank);
  const minRankIndex = Math.max(0, rankIndex - 1);
  const maxRankIndex = Math.min(RANK_ORDER.length - 1, rankIndex + 1);
  const validRanks = RANK_ORDER.slice(minRankIndex, maxRankIndex + 1);

  // Find opponent: same rank range, same aura preferred
  let opponent = await User.findOne({
    _id: { $ne: userId },
    rank: { $in: validRanks },
    aura: user.aura,
    isBanned: false,
    'anticheat.flagged': false
  }).sort({ ki: 1 });

  // Fallback: any rank range
  if (!opponent) {
    opponent = await User.findOne({
      _id: { $ne: userId },
      rank: { $in: validRanks },
      isBanned: false,
      'anticheat.flagged': false
    }).sort({ ki: 1 });
  }

  return opponent;
};

module.exports = { findMatch };
