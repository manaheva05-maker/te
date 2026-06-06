const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateGroups = (clans, groupSize = 8) => {
  const shuffled = shuffleArray(clans);
  const groups = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push({
      id: `group_${Math.floor(i / groupSize) + 1}`,
      clans: shuffled.slice(i, i + groupSize),
      results: [],
      qualified: []
    });
  }
  return groups;
};

const generateBracket = (clans) => {
  if (clans.length > 64) clans = clans.slice(0, 64);

  const groups = generateGroups(clans);

  return {
    groups,
    quarters: [],
    semis: [],
    thirdPlace: null,
    final: null,
    currentPhase: 'groups'
  };
};

const advanceToQuarters = (bracket) => {
  const qualified = [];
  bracket.groups.forEach(g => {
    qualified.push(...g.qualified.slice(0, 2));
  });

  bracket.quarters = [];
  for (let i = 0; i < qualified.length; i += 2) {
    bracket.quarters.push({
      id: `quarter_${Math.floor(i / 2) + 1}`,
      clan1: qualified[i],
      clan2: qualified[i + 1] || null,
      winner: null,
      scheduled: null
    });
  }
  bracket.currentPhase = 'quarters';
  return bracket;
};

const advanceToSemis = (bracket) => {
  const winners = bracket.quarters.map(q => q.winner).filter(Boolean);
  bracket.semis = [];
  for (let i = 0; i < winners.length; i += 2) {
    bracket.semis.push({
      id: `semi_${Math.floor(i / 2) + 1}`,
      clan1: winners[i],
      clan2: winners[i + 1] || null,
      winner: null,
      loser: null,
      scheduled: null
    });
  }
  bracket.currentPhase = 'semis';
  return bracket;
};

const advanceToFinal = (bracket) => {
  const winners = bracket.semis.map(s => s.winner).filter(Boolean);
  const losers = bracket.semis.map(s => s.loser).filter(Boolean);

  bracket.thirdPlace = {
    clan1: losers[0] || null,
    clan2: losers[1] || null,
    winner: null,
    scheduled: null
  };

  bracket.final = {
    clan1: winners[0] || null,
    clan2: winners[1] || null,
    winner: null,
    scheduled: null
  };

  bracket.currentPhase = 'final';
  return bracket;
};

module.exports = { generateBracket, advanceToQuarters, advanceToSemis, advanceToFinal };
