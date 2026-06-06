export const RANKS = [
  { key: 'munou',    label: 'MUNOU',    ki: 0,     color: '#888888' },
  { key: 'genin',    label: 'GENIN',    ki: 500,   color: '#4CAF50' },
  { key: 'chunin',   label: 'CHUNIN',   ki: 2000,  color: '#2196F3' },
  { key: 'jonin',    label: 'JONIN',    ki: 5000,  color: '#9C27B0' },
  { key: 'kage',     label: 'KAGE',     ki: 10000, color: '#FF5722' },
  { key: 'akatsuki', label: 'AKATSUKI', ki: 20000, color: '#F44336' },
  { key: 'ryuken',   label: 'RYUKEN',   ki: 40000, color: '#C9A227' },
  { key: 'shinken',  label: 'SHINKEN',  ki: 75000, color: '#FFD700' },
];

export const SOULS = [
  { key: 'shonen',  label: 'Shonen',      color: '#FF6B35' },
  { key: 'isekai',  label: 'Isekai',      color: '#7C4DFF' },
  { key: 'seinen',  label: 'Seinen',      color: '#455A64' },
  { key: 'mystere', label: 'Mystere',     color: '#00BCD4' },
  { key: 'dark',    label: 'Dark',        color: '#9E9E9E' },
  { key: 'mecha',   label: 'Mecha',       color: '#607D8B' },
  { key: 'slice',   label: 'Slice of Life', color: '#E91E63' },
  { key: 'fantasy', label: 'Fantasy',     color: '#4CAF50' },
  { key: 'gore',    label: 'Gore',        color: '#8B0000' },
];

export const CLAN_RANKS = [
  { key: 'munou',   label: 'Clan Munou',   elo: 0,     color: '#888888' },
  { key: 'genin',   label: 'Clan Genin',   elo: 500,   color: '#4CAF50' },
  { key: 'jonin',   label: 'Clan Jonin',   elo: 2000,  color: '#FF5722' },
  { key: 'kage',    label: 'Clan Kage',    elo: 5000,  color: '#C9A227' },
  { key: 'daimyo',  label: 'DAIMYO',       elo: 10000, color: '#FFD700' },
];

export const GIFTS = [
  { key: 'scroll',   label: 'Scroll',   value: 10,  color: '#C9A227' },
  { key: 'kunai',    label: 'Kunai',    value: 50,  color: '#9C27B0' },
  { key: 'katana',   label: 'Katana',   value: 100, color: '#2196F3' },
  { key: 'dragon',   label: 'Dragon',   value: 500, color: '#FF5722' },
  { key: 'shinken',  label: 'Shinken',  value: 1000, color: '#FFD700' },
];

export const getRankInfo = (rankKey) =>
  RANKS.find(r => r.key === rankKey) || RANKS[0];

export const getSoulInfo = (soulKey) =>
  SOULS.find(s => s.key === soulKey) || SOULS[0];

export const getClanRankInfo = (elo = 0) =>
  [...CLAN_RANKS].reverse().find(r => elo >= r.elo) || CLAN_RANKS[0];
