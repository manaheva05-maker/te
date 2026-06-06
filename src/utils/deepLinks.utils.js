const DEEP_LINK_PREFIX = 'shinken://';
const UNIVERSAL_LINK_PREFIX = 'https://shinken.app/';

const parseDeepLink = (url) => {
  if (!url) return null;

  let path = url
    .replace(DEEP_LINK_PREFIX, '')
    .replace(UNIVERSAL_LINK_PREFIX, '')
    .replace(/^\//, '');

  if (!path || path === url) return null;

  const parts = path.split('/');
  if (!parts[0]) return null;

  if (parts[0] === 'clan' && parts[1] === 'invite' && parts[2])
    return { route: 'clan/invite', params: { code: parts[2] } };

  if (parts[0] === 'duel' && parts[1] === 'challenge' && parts[2])
    return { route: 'duel/challenge', params: { userId: parts[2] } };

  if (parts[0] === 'live' && parts[1])
    return { route: 'live', params: { matchId: parts[1] } };

  if (parts[0] === 'competition' && parts[1] === 'invite' && parts[2])
    return { route: 'competition/invite', params: { code: parts[2] } };

  if (parts[0] === 'competition' && parts[1])
    return { route: 'competition', params: { code: parts[1] } };

  if (parts[0] === 'join' && parts[1])
    return { route: 'join', params: { code: parts[1] } };

  if (parts[0] === 'profile' && parts[1])
    return { route: 'profile', params: { username: parts[1] } };

  return null;
};

const generateLinks = {
  clanInvite: (code) => ({
    deep: `${DEEP_LINK_PREFIX}clan/invite/${code}`,
    universal: `${UNIVERSAL_LINK_PREFIX}clan/invite/${code}`,
    share: `Rejoins mon clan sur SHINKEN ! Code: ${code}\n${DEEP_LINK_PREFIX}clan/invite/${code}`
  }),
  duelChallenge: (userId, username) => ({
    deep: `${DEEP_LINK_PREFIX}duel/challenge/${userId}`,
    share: `${username} te défie en duel sur SHINKEN !\n${DEEP_LINK_PREFIX}duel/challenge/${userId}`
  }),
  liveMatch: (matchId) => ({
    deep: `${DEEP_LINK_PREFIX}live/${matchId}`,
    share: `Match en LIVE sur SHINKEN !\n${DEEP_LINK_PREFIX}live/${matchId}`
  }),
  competition: (code, name) => ({
    deep: `${DEEP_LINK_PREFIX}competition/${code}`,
    share: `Rejoins la compétition "${name}" sur SHINKEN !\n${DEEP_LINK_PREFIX}competition/${code}`
  }),
  referral: (userId, username) => ({
    deep: `${DEEP_LINK_PREFIX}join/${userId}`,
    share: `${username} t'invite sur SHINKEN !\n${DEEP_LINK_PREFIX}join/${userId}`
  }),
};

module.exports = { parseDeepLink, generateLinks };
