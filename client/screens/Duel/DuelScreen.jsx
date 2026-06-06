import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useLang } from '../../context/LangContext';
import { duelAPI } from '../../services/api';
import { getDuelSocket } from '../../services/socket';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getSoulInfo } from '../../constants/ranks';

export default function DuelScreen({ navigation }) {
  const { user } = useAuth();
  const { setDuel, setQuestions, setStatus, status } = useGame();
  const { t } = useLang();
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState(null); // ranked | friendly | training

  // ✅ Fix stale closure : on utilise un ref pour le timeout
  const searchingRef = useRef(false);

  const setSearchingBoth = (val) => {
    setSearching(val);
    searchingRef.current = val;
  };

  const startSearch = async (type) => {
    setMode(type);
    setSearchingBoth(true);
    setStatus('searching');
    const socket = getDuelSocket();

    try {
      socket.emit('matchmaking:join', { userId: user._id, rank: user.rank, aura: user.aura, type });

      socket.once('matchmaking:matched', async ({ duelId, opponent }) => {
        try {
          const data = await duelAPI.get(duelId);
          setDuel(data.duel);
          setStatus('ban');
          navigation.navigate('BanPhase', { duel: data.duel, opponent });
        } catch (err) {
          Alert.alert(t('common.error'), err.message);
          setSearchingBoth(false);
          setStatus('idle');
        }
      });

      // ✅ Fix : utilise searchingRef.current au lieu de searching (plus de stale closure)
      setTimeout(() => {
        if (searchingRef.current) {
          socket.emit('matchmaking:leave', { userId: user._id });
          socket.off('matchmaking:matched'); // ✅ nettoie aussi le listener
          setSearchingBoth(false);
          setStatus('idle');
          Alert.alert('', t('duel.searching') + ' (timeout)');
        }
      }, 30000);

    } catch (err) {
      Alert.alert(t('common.error'), err.message);
      setSearchingBoth(false);
      setStatus('idle');
    }
  };

  const cancelSearch = () => {
    const socket = getDuelSocket();
    socket.emit('matchmaking:leave', { userId: user._id });
    socket.off('matchmaking:matched'); // ✅ nettoie le listener
    setSearchingBoth(false);
    setStatus('idle');
    setMode(null);
  };

  const startTraining = () => {
    navigation.navigate('Training');
  };

  const soulInfo = getSoulInfo(user?.aura);

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>⚔️ {t('duel.title').toUpperCase()}</Text>
        <Text style={s.sub}>{t('auth.choose_soul')}: <Text style={{ color: soulInfo.color }}>{soulInfo.icon} {soulInfo.label}</Text></Text>
      </View>

      {searching ? (
        <View style={s.searching}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.searchingText}>{t('duel.searching')}</Text>
          <Text style={s.searchingMode}>{mode?.toUpperCase()}</Text>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelSearch}>
            <Text style={s.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.modes}>
          <TouchableOpacity style={[s.modeCard, s.modePrimary]} onPress={() => startSearch('ranked')}>
            <LinearGradient colors={[COLORS.secondary, '#5A0000']} style={s.modeGrad}>
              <Text style={s.modeIcon}>⚔️</Text>
              <Text style={s.modeLabel}>{t('duel.ranked')}</Text>
              <Text style={s.modeSub}>{t('duel.ranked_desc') || 'KI en jeu'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.modeCard} onPress={() => startSearch('friendly')}>
            <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.modeGrad}>
              <Text style={s.modeIcon}>🤝</Text>
              <Text style={s.modeLabel}>{t('duel.friendly') || 'Amical'}</Text>
              <Text style={s.modeSub}>{t('duel.friendly_desc') || 'Sans enjeu'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.modeCard} onPress={startTraining}>
            <LinearGradient colors={['#1A2E1A', '#0A1E0A']} style={s.modeGrad}>
              <Text style={s.modeIcon}>🤖</Text>
              <Text style={s.modeLabel}>{t('home.training')}</Text>
              <Text style={s.modeSub}>{t('duel.training_desc') || 'vs IA Sensei'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: SPACING.lg, paddingTop: 60, alignItems: 'center' },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 4 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: SPACING.xs },
  searching: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  searchingText: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  searchingMode: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 4 },
  cancelBtn: { marginTop: SPACING.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textMuted, fontWeight: '700' },
  modes: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  modeCard: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  modePrimary: { borderColor: COLORS.secondary },
  modeGrad: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  modeIcon: { fontSize: 48 },
  modeLabel: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.lg, letterSpacing: 2 },
  modeSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});
