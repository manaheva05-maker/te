const cron = require('node-cron');
const Tournament = require('../models/Tournament');
const Season = require('../models/Season');

const tournamentJob = () => {
  // Every Sunday at 10am → create local tournament
  cron.schedule('0 10 * * 0', async () => {
    try {
      const activeSeason = await Season.findOne({ status: 'active' });
      if (!activeSeason) return;

      const existing = await Tournament.findOne({
        type: 'local',
        status: { $in: ['upcoming', 'registration', 'ongoing'] }
      });
      if (existing) return;

      const start = new Date();
      start.setHours(12, 0, 0, 0);
      const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);

      const t = new Tournament({
        name: { fr: 'Tournoi Local Hebdomadaire', en: 'Weekly Local Tournament' },
        type: 'local',
        season: activeSeason.name,
        status: 'registration',
        maxClans: 32,
        entryFee: 0,
        registrationStart: new Date(),
        registrationEnd: start,
        startDate: start,
        endDate: end
      });
      await t.save();
      console.log('✅ Tournoi local créé:', t._id);
    } catch (err) {
      console.error('Tournament job error:', err.message);
    }
  });

  // Open registration for upcoming tournaments
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      await Tournament.updateMany(
        { status: 'upcoming', registrationStart: { $lte: now } },
        { $set: { status: 'registration' } }
      );

      // Close registration
      await Tournament.updateMany(
        { status: 'registration', registrationEnd: { $lte: now } },
        { $set: { status: 'ongoing' } }
      );
    } catch (err) {
      console.error('Tournament status job error:', err.message);
    }
  });
};

module.exports = tournamentJob;
