const cron = require('node-cron');
const Season = require('../models/Season');
const User = require('../models/User');

const SEASON_THEMES = [
  { theme: 'Shonen', soul: 'shonen' },
  { theme: 'Isekai', soul: 'isekai' },
  { theme: 'Seinen', soul: 'seinen' },
  { theme: 'Dark', soul: 'dark' },
  { theme: 'Fantasy', soul: 'fantasy' },
  { theme: 'Mecha', soul: 'mecha' },
];

const seasonJob = () => {
  // Check every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const activeSeason = await Season.findOne({ status: 'active' });

      if (activeSeason && new Date() > activeSeason.endDate) {
        // End current season
        activeSeason.status = 'finished';
        await activeSeason.save();
        console.log(`✅ Saison ${activeSeason.number} terminée`);

        // Reset KI (keep 30%)
        await User.updateMany({}, [
          { $set: { ki: { $floor: { $multiply: ['$ki', 0.3] } } } }
        ]);
        console.log('✅ KI reset (30% conservé)');

        // Create next season
        const nextNum = activeSeason.number + 1;
        const themeIndex = (nextNum - 1) % SEASON_THEMES.length;
        const theme = SEASON_THEMES[themeIndex];
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

        const newSeason = new Season({
          name: `Saison ${nextNum} — ${theme.theme}`,
          theme: theme.theme,
          soul: theme.soul,
          number: nextNum,
          status: 'active',
          startDate,
          endDate
        });
        await newSeason.save();
        console.log(`✅ Saison ${nextNum} démarrée: ${theme.theme}`);
      }

      // Activate upcoming season if start date reached
      const upcomingSeason = await Season.findOne({ status: 'upcoming' });
      if (upcomingSeason && new Date() >= upcomingSeason.startDate) {
        upcomingSeason.status = 'active';
        await upcomingSeason.save();
        console.log(`✅ Saison ${upcomingSeason.number} activée`);
      }
    } catch (err) {
      console.error('Season job error:', err.message);
    }
  });
};

module.exports = seasonJob;
