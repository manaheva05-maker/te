const cron = require('node-cron');
const User = require('../models/User');
const Clan = require('../models/Clan');

const inactivityJob = () => {
  // Every day at 2am
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Cron: inactivité KI...');
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);

    // -10 KI/day for inactive 3+ days
    await User.updateMany(
      { 'stats.last_active': { $lt: threeDaysAgo }, ki: { $gt: 0 } },
      { $inc: { ki: -10 } }
    );

    // Demote inactive members to ronin
    const inactiveMembers = await User.find({
      clan: { $ne: null },
      clanRole: 'samurai',
      'stats.last_active': { $lt: sevenDaysAgo }
    });
    for (const u of inactiveMembers) {
      u.clanRole = 'ronin';
      await u.save();
      console.log(`  → ${u.username} rétrogradé Ronin`);
    }

    // Expel ronin inactive 14+ days
    const expelList = await User.find({
      clan: { $ne: null },
      clanRole: 'ronin',
      'stats.last_active': { $lt: fourteenDaysAgo }
    });
    for (const u of expelList) {
      const clan = await Clan.findById(u.clan);
      if (clan) {
        clan.members = clan.members.filter(m => m.toString() !== u._id.toString());
        await clan.save();
      }
      u.clan = null;
      await u.save();
      console.log(`  → ${u.username} expulsé du clan`);
    }

    // Shogun inactive 21 days → penalty
    const inactiveShogun = await User.find({
      clanRole: 'shogun',
      'stats.last_active': { $lt: twentyOneDaysAgo }
    });
    for (const u of inactiveShogun) {
      u.ki = Math.max(0, u.ki - 15);
      await u.save();
      console.log(`  → Shogun ${u.username} pénalisé -15 KI`);
    }

    console.log('✅ Cron inactivité terminé');
  });
};

module.exports = inactivityJob;
