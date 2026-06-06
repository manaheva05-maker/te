// Deep link parsing tests (pure JS, no React Native)
const { parseDeepLink, generateLinks } = require('../src/utils/deepLinks.utils');

describe('Deep Links Parsing', () => {

  test('parse clan invite link', () => {
    const result = parseDeepLink('shinken://clan/invite/ABCD1234');
    expect(result).not.toBeNull();
    expect(result.route).toBe('clan/invite');
    expect(result.params.code).toBe('ABCD1234');
  });

  test('parse duel challenge link', () => {
    const result = parseDeepLink('shinken://duel/challenge/507f1f77bcf86cd799439011');
    expect(result).not.toBeNull();
    expect(result.route).toBe('duel/challenge');
    expect(result.params.userId).toBe('507f1f77bcf86cd799439011');
  });

  test('parse live match link', () => {
    const result = parseDeepLink('shinken://live/507f1f77bcf86cd799439011');
    expect(result).not.toBeNull();
    expect(result.route).toBe('live');
    expect(result.params.matchId).toBe('507f1f77bcf86cd799439011');
  });

  test('parse competition invite link', () => {
    const result = parseDeepLink('shinken://competition/invite/COMPAB1234');
    expect(result).not.toBeNull();
    expect(result.route).toBe('competition/invite');
    expect(result.params.code).toBe('COMPAB1234');
  });

  test('parse competition short link', () => {
    const result = parseDeepLink('shinken://competition/COMPAB1234');
    expect(result).not.toBeNull();
    expect(result.route).toBe('competition');
    expect(result.params.code).toBe('COMPAB1234');
  });

  test('parse join/referral link', () => {
    const result = parseDeepLink('shinken://join/REFCODE123');
    expect(result).not.toBeNull();
    expect(result.route).toBe('join');
    expect(result.params.code).toBe('REFCODE123');
  });

  test('parse profile link', () => {
    const result = parseDeepLink('shinken://profile/OtakuWarrior');
    expect(result).not.toBeNull();
    expect(result.route).toBe('profile');
    expect(result.params.username).toBe('OtakuWarrior');
  });

  test('parse universal link (https)', () => {
    const result = parseDeepLink('https://shinken.app/clan/invite/XYZ789');
    expect(result).not.toBeNull();
    expect(result.route).toBe('clan/invite');
    expect(result.params.code).toBe('XYZ789');
  });

  test('invalid link returns null', () => {
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink('https://google.com')).toBeNull();
    expect(parseDeepLink('shinken://')).toBeNull();
  });

  test('generateLinks.clanInvite', () => {
    const links = generateLinks.clanInvite('ABCD1234');
    expect(links.deep).toBe('shinken://clan/invite/ABCD1234');
    expect(links.universal).toBe('https://shinken.app/clan/invite/ABCD1234');
    expect(links.share).toContain('ABCD1234');
  });

  test('generateLinks.competition', () => {
    const links = generateLinks.competition('COMPTEST', 'Mon Tournoi');
    expect(links.deep).toBe('shinken://competition/COMPTEST');
    expect(links.share).toContain('Mon Tournoi');
    expect(links.share).toContain('COMPTEST');
  });

  test('generateLinks.liveMatch', () => {
    const links = generateLinks.liveMatch('matchid123');
    expect(links.deep).toBe('shinken://live/matchid123');
  });
});
