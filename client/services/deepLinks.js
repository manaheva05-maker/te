import { Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';

// Deep link scheme: shinken://
// Universal link: https://shinken.app/

export const DEEP_LINK_PREFIX = 'shinken://';
export const UNIVERSAL_LINK_PREFIX = 'https://shinken.app/';

// Map of deep link paths to navigation actions
const LINK_ROUTES = {
  // shinken://clan/invite/CODE
  'clan/invite': (params, navigation) => {
    navigation.navigate('ClanInvite', { code: params.code });
  },
  // shinken://duel/challenge/USER_ID
  'duel/challenge': (params, navigation) => {
    navigation.navigate('Duel', { challengeUserId: params.userId });
  },
  // shinken://live/MATCH_ID
  'live': (params, navigation) => {
    navigation.navigate('Live', { matchId: params.matchId });
  },
  // shinken://competition/invite/CODE
  'competition/invite': (params, navigation) => {
    navigation.navigate('CompetitionDetail', { inviteCode: params.code });
  },
  // shinken://competition/CODE
  'competition': (params, navigation) => {
    navigation.navigate('CompetitionDetail', { inviteCode: params.code });
  },
  // shinken://join/REFERRAL_CODE
  'join': (params, navigation) => {
    navigation.navigate('Register', { referralCode: params.code });
  },
  // shinken://profile/USERNAME
  'profile': (params, navigation) => {
    navigation.navigate('UserProfile', { username: params.username });
  },
};

/**
 * Parse a deep link URL and extract route + params
 * shinken://clan/invite/ABC123 → { route: 'clan/invite', params: { code: 'ABC123' } }
 */
export const parseDeepLink = (url) => {
  if (!url) return null;

  // Normalize: remove prefix
  let path = url
    .replace(DEEP_LINK_PREFIX, '')
    .replace(UNIVERSAL_LINK_PREFIX, '')
    .replace(/^\//, '');

  const parts = path.split('/');

  // Try to match routes
  // clan/invite/CODE
  if (parts[0] === 'clan' && parts[1] === 'invite' && parts[2]) {
    return { route: 'clan/invite', params: { code: parts[2] } };
  }
  // duel/challenge/USER_ID
  if (parts[0] === 'duel' && parts[1] === 'challenge' && parts[2]) {
    return { route: 'duel/challenge', params: { userId: parts[2] } };
  }
  // live/MATCH_ID
  if (parts[0] === 'live' && parts[1]) {
    return { route: 'live', params: { matchId: parts[1] } };
  }
  // competition/invite/CODE
  if (parts[0] === 'competition' && parts[1] === 'invite' && parts[2]) {
    return { route: 'competition/invite', params: { code: parts[2] } };
  }
  // competition/CODE (short form)
  if (parts[0] === 'competition' && parts[1]) {
    return { route: 'competition', params: { code: parts[1] } };
  }
  // join/CODE
  if (parts[0] === 'join' && parts[1]) {
    return { route: 'join', params: { code: parts[1] } };
  }
  // profile/USERNAME
  if (parts[0] === 'profile' && parts[1]) {
    return { route: 'profile', params: { username: parts[1] } };
  }

  return null;
};

/**
 * Handle a deep link URL → navigate to the right screen
 */
export const handleDeepLink = (url, navigation) => {
  const parsed = parseDeepLink(url);
  if (!parsed) return;

  const handler = LINK_ROUTES[parsed.route];
  if (handler && navigation) {
    handler(parsed.params, navigation);
  }
};

/**
 * Setup deep link listener (call on app mount)
 */
export const setupDeepLinkListener = (navigation) => {
  // Handle deep link when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url, navigation);
  });

  // Handle deep link that launched the app
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url, navigation);
  });

  return () => subscription?.remove();
};

/**
 * Generate shareable deep links
 */
export const generateLinks = {
  clanInvite: (code) => ({
    deep: `${DEEP_LINK_PREFIX}clan/invite/${code}`,
    universal: `${UNIVERSAL_LINK_PREFIX}clan/invite/${code}`,
    share: `Rejoins mon clan sur SHINKEN ! Code: ${code}\nshinken://clan/invite/${code}`
  }),
  duelChallenge: (userId, username) => ({
    deep: `${DEEP_LINK_PREFIX}duel/challenge/${userId}`,
    share: `${username} te défie en duel sur SHINKEN !\nshinken://duel/challenge/${userId}`
  }),
  liveMatch: (matchId) => ({
    deep: `${DEEP_LINK_PREFIX}live/${matchId}`,
    share: `Match en LIVE sur SHINKEN !\nshinken://live/${matchId}`
  }),
  competition: (code, name) => ({
    deep: `${DEEP_LINK_PREFIX}competition/${code}`,
    share: `Rejoins la compétition "${name}" sur SHINKEN !\nshinken://competition/${code}`
  }),
  referral: (userId, username) => ({
    deep: `${DEEP_LINK_PREFIX}join/${userId}`,
    share: `${username} t'invite sur SHINKEN — le meilleur quiz anime !\nshinken://join/${userId}`
  }),
};
