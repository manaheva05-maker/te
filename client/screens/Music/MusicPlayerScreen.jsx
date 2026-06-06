import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, Animated, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '../../context/LangContext';
import {
  ANIME_TRACKS, playTrack, togglePlay, stopMusic,
  setVolume, seekTo, setStatusListener,
  getCurrentTrackId, getIsPlaying, getTracksBySoul
} from '../../services/musicPlayer';
import { COLORS, SPACING, RADIUS } from '../../constants/colors';
import { SOULS } from '../../constants/ranks';

export default function MusicPlayerScreen({ navigation }) {
  const { lang } = useLang();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  const [soulFilter, setSoulFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setStatusListener((status) => {
      if (status.isLoaded) {
        setPlaying(status.isPlaying);
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        if (duration > 0) {
          Animated.timing(progressAnim, {
            toValue: (status.positionMillis || 0) / (status.durationMillis || 1),
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
      if (status.didJustFinish) {
        setPlaying(false);
        setCurrentTrack(null);
      }
    });

    return () => { setStatusListener(null); stopMusic(); };
  }, []);

  useEffect(() => {
    if (playing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [playing]);

  const handlePlay = async (track) => {
    if (currentTrack?.id === track.id && playing) {
      const nowPlaying = await togglePlay();
      setPlaying(nowPlaying);
      return;
    }
    setLoading(true);
    try {
      await playTrack(track);
      setCurrentTrack(track);
      setPlaying(true);
    } catch {
      Alert.alert(
        '🎵',
        lang === 'fr'
          ? 'Piste indisponible. Upload les fichiers audio sur Cloudinary.'
          : 'Track unavailable. Upload audio files to Cloudinary.'
      );
    } finally { setLoading(false); }
  };

  const handleToggle = async () => {
    if (!currentTrack) return;
    const nowPlaying = await togglePlay();
    setPlaying(nowPlaying);
  };

  const handleStop = async () => {
    await stopMusic();
    setCurrentTrack(null);
    setPlaying(false);
    setPosition(0);
    progressAnim.setValue(0);
  };

  const handleVolume = async (v) => {
    setVolumeState(v);
    await setVolume(v);
  };

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const filteredTracks = soulFilter === 'all'
    ? ANIME_TRACKS
    : getTracksBySoul(soulFilter);

  return (
    <LinearGradient colors={['#0A0A0F', '#0A0A1E']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.title}>🎵 {lang === 'fr' ? 'MUSIQUE ANIME' : 'ANIME MUSIC'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Now playing */}
      {currentTrack && (
        <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.nowPlaying}>
          <Animated.Text style={[s.nowPlayingIcon, { transform: [{ scale: pulseAnim }] }]}>
            {currentTrack.cover}
          </Animated.Text>
          <View style={s.nowPlayingInfo}>
            <Text style={s.nowPlayingTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={s.nowPlayingAnime}>{currentTrack.anime}</Text>
          </View>
          <View style={s.controls}>
            <TouchableOpacity style={s.controlBtn} onPress={handleToggle}>
              <Ionicons
                name={playing ? 'pause-circle' : 'play-circle'}
                size={44}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.stopBtn} onPress={handleStop}>
              <Ionicons name="stop-circle-outline" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={s.progressContainer}>
            <Text style={s.timeText}>{formatTime(position)}</Text>
            <View style={s.progressBg}>
              <Animated.View style={[s.progressFill, {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }]} />
            </View>
            <Text style={s.timeText}>{formatTime(duration || (currentTrack.duration * 1000))}</Text>
          </View>

          {/* Volume */}
          <View style={s.volumeRow}>
            <Ionicons name="volume-low-outline" size={16} color={COLORS.textMuted} />
            <View style={s.volumeTrack}>
              {[0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
                <TouchableOpacity key={v} onPress={() => handleVolume(v)}>
                  <View style={[s.volumeBar, {
                    height: v * 20 + 4,
                    backgroundColor: volume >= v ? COLORS.primary : COLORS.border
                  }]} />
                </TouchableOpacity>
              ))}
            </View>
            <Ionicons name="volume-high-outline" size={16} color={COLORS.textMuted} />
          </View>
        </LinearGradient>
      )}

      {/* Soul filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.soulFilters}
      >
        <TouchableOpacity
          style={[s.soulChip, soulFilter === 'all' && s.soulChipActive]}
          onPress={() => setSoulFilter('all')}
        >
          <Text style={s.soulChipText}>🎲 {lang === 'fr' ? 'Tous' : 'All'}</Text>
        </TouchableOpacity>
        {SOULS.map(soul => (
          <TouchableOpacity
            key={soul.key}
            style={[s.soulChip, soulFilter === soul.key && s.soulChipActive]}
            onPress={() => setSoulFilter(soul.key)}
          >
            <Text style={s.soulChipText}>{soul.icon} {soul.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Track list */}
      <FlatList
        data={filteredTracks}
        keyExtractor={t => t.id}
        contentContainerStyle={s.trackList}
        renderItem={({ item: track }) => {
          const isCurrent = currentTrack?.id === track.id;
          const soul = SOULS.find(s => s.key === track.soul);
          return (
            <TouchableOpacity
              style={[s.trackCard, isCurrent && s.trackCardActive]}
              onPress={() => handlePlay(track)}
              activeOpacity={0.8}
            >
              <View style={[s.trackCover, isCurrent && { borderColor: COLORS.primary }]}>
                <Text style={s.trackCoverEmoji}>{track.cover}</Text>
                {isCurrent && playing && (
                  <View style={s.playingIndicator}>
                    {[...Array(3)].map((_, i) => (
                      <Animated.View key={i} style={[s.bar, { height: 8 + i * 4, backgroundColor: COLORS.primary }]} />
                    ))}
                  </View>
                )}
              </View>
              <View style={s.trackInfo}>
                <Text style={[s.trackTitle, isCurrent && { color: COLORS.primary }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={s.trackAnime}>{track.anime}</Text>
                <Text style={[s.trackSoul, { color: soul?.color }]}>{soul?.icon} {soul?.label}</Text>
              </View>
              <View style={s.trackRight}>
                <Text style={s.trackDuration}>
                  {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                </Text>
                {isCurrent ? (
                  <Ionicons
                    name={playing ? 'pause-circle' : 'play-circle'}
                    size={28}
                    color={COLORS.primary}
                  />
                ) : (
                  <Ionicons name="play-circle-outline" size={28} color={COLORS.textMuted} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: 18, fontWeight: '900', letterSpacing: 3 },

  nowPlaying: { margin: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '44' },
  nowPlayingIcon: { fontSize: 40, textAlign: 'center', marginBottom: SPACING.sm },
  nowPlayingInfo: { alignItems: 'center', marginBottom: SPACING.md },
  nowPlayingTitle: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  nowPlayingAnime: { color: COLORS.primary, fontSize: 12, marginTop: 2 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  controlBtn: {},
  stopBtn: { padding: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  timeText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', width: 36 },
  progressBg: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  volumeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, justifyContent: 'center' },
  volumeTrack: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  volumeBar: { width: 12, borderRadius: 2 },

  soulFilters: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.sm },
  soulChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  soulChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  soulChipText: { color: COLORS.text, fontSize: 11, fontWeight: '700' },

  trackList: { padding: SPACING.md, gap: SPACING.sm },
  trackCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  trackCardActive: { borderColor: COLORS.primary, backgroundColor: '#1A1A2E' },
  trackCover: { width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, position: 'relative' },
  trackCoverEmoji: { fontSize: 26 },
  playingIndicator: { position: 'absolute', bottom: 4, flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  bar: { width: 3, borderRadius: 1 },
  trackInfo: { flex: 1 },
  trackTitle: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  trackAnime: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  trackSoul: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  trackRight: { alignItems: 'center', gap: 4 },
  trackDuration: { color: COLORS.textDim, fontSize: 10 },
});
