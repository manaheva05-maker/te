import { Audio } from 'expo-av';

// ─── ANIME MUSIC LIBRARY ─────────────────────────────────────
// Free/royalty-free anime-style tracks from Cloudinary or public CDN
// Replace with your actual Cloudinary URLs after uploading
export const ANIME_TRACKS = [
  {
    id: 'naruto_main',
    title: 'Hero\'s Path',
    anime: 'Naruto',
    soul: 'shonen',
    artist: 'SHINKEN OST',
    duration: 180,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/naruto_theme.mp3',
    cover: '🍃',
    free: true,
  },
  {
    id: 'attack_titan',
    title: 'Wings of Freedom',
    anime: 'Attack on Titan',
    soul: 'dark',
    artist: 'SHINKEN OST',
    duration: 210,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/aot_theme.mp3',
    cover: '🗡️',
    free: true,
  },
  {
    id: 'demon_slayer',
    title: 'Flame Breath',
    anime: 'Demon Slayer',
    soul: 'shonen',
    artist: 'SHINKEN OST',
    duration: 195,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/ds_theme.mp3',
    cover: '🔥',
    free: true,
  },
  {
    id: 'death_note',
    title: 'Dark Genius',
    anime: 'Death Note',
    soul: 'seinen',
    artist: 'SHINKEN OST',
    duration: 165,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/dn_theme.mp3',
    cover: '📓',
    free: true,
  },
  {
    id: 'one_piece',
    title: 'Grand Line Journey',
    anime: 'One Piece',
    soul: 'shonen',
    artist: 'SHINKEN OST',
    duration: 190,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/op_theme.mp3',
    cover: '🏴‍☠️',
    free: true,
  },
  {
    id: 'fullmetal',
    title: 'Alchemist\'s Soul',
    anime: 'Fullmetal Alchemist',
    soul: 'seinen',
    artist: 'SHINKEN OST',
    duration: 175,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/fma_theme.mp3',
    cover: '⚗️',
    free: true,
  },
  {
    id: 'dragon_ball',
    title: 'Power Level Rising',
    anime: 'Dragon Ball Z',
    soul: 'shonen',
    artist: 'SHINKEN OST',
    duration: 200,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/dbz_theme.mp3',
    cover: '🐉',
    free: true,
  },
  {
    id: 'chainsaw_man',
    title: 'Devil\'s Contract',
    anime: 'Chainsaw Man',
    soul: 'dark',
    artist: 'SHINKEN OST',
    duration: 185,
    url: 'https://res.cloudinary.com/shinken-app/video/upload/shinken/music/csm_theme.mp3',
    cover: '⛓️',
    free: true,
  },
];

// ─── AUDIO PLAYER STATE ───────────────────────────────────────
let soundObject = null;
let currentTrackId = null;
let isPlaying = false;
let onStatusUpdate = null;

// ─── LOAD & PLAY ──────────────────────────────────────────────
export const playTrack = async (track) => {
  try {
    // Stop current if playing
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: track.url },
      { shouldPlay: true, isLooping: false, volume: 1.0 },
      (status) => {
        isPlaying = status.isPlaying;
        if (status.didJustFinish) {
          currentTrackId = null;
          isPlaying = false;
        }
        onStatusUpdate?.(status);
      }
    );

    soundObject = sound;
    currentTrackId = track.id;
    isPlaying = true;

    return sound;
  } catch (err) {
    console.error('Music player error:', err);
    throw err;
  }
};

// ─── PAUSE / RESUME ───────────────────────────────────────────
export const togglePlay = async () => {
  if (!soundObject) return;
  if (isPlaying) {
    await soundObject.pauseAsync();
    isPlaying = false;
  } else {
    await soundObject.playAsync();
    isPlaying = true;
  }
  return isPlaying;
};

// ─── STOP ─────────────────────────────────────────────────────
export const stopMusic = async () => {
  if (soundObject) {
    await soundObject.stopAsync();
    await soundObject.unloadAsync();
    soundObject = null;
    currentTrackId = null;
    isPlaying = false;
  }
};

// ─── SET VOLUME ───────────────────────────────────────────────
export const setVolume = async (volume) => {
  if (soundObject) {
    await soundObject.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  }
};

// ─── SEEK ─────────────────────────────────────────────────────
export const seekTo = async (positionMs) => {
  if (soundObject) {
    await soundObject.setPositionAsync(positionMs);
  }
};

// ─── STATUS ───────────────────────────────────────────────────
export const getStatus = async () => {
  if (!soundObject) return null;
  return soundObject.getStatusAsync();
};

export const setStatusListener = (cb) => { onStatusUpdate = cb; };
export const getCurrentTrackId = () => currentTrackId;
export const getIsPlaying = () => isPlaying;

// ─── FILTER BY SOUL ───────────────────────────────────────────
export const getTracksBySoul = (soul) =>
  soul ? ANIME_TRACKS.filter(t => t.soul === soul) : ANIME_TRACKS;

export default {
  ANIME_TRACKS, playTrack, togglePlay, stopMusic,
  setVolume, seekTo, getStatus, setStatusListener,
  getCurrentTrackId, getIsPlaying, getTracksBySoul,
};
