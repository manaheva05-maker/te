import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useLang } from '../../context/LangContext';
import { duelAPI } from '../../services/api';
import { getDuelSocket } from '../../services/socket';
import { SOULS } from '../../constants/ranks';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const TIMER = 30;

export default function BanPhaseScreen({ navigation, route }) {
  const { duel, opponent } = route.params;
  const { user } = useAuth();
  const { setDuel, setQuestions, joinDuel } = useGame();
  const { t } = useLang();
  const [selected, setSelected] = useState(null);
  const [opponentBanned, setOpponentBanned] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timer, setTimer] = useState(TIMER);

  useEffect(() => {
    const socket = getDuelSocket();
    joinDuel(duel._id, user._id);

    socket.on('duel:ban_confirmed', ({ userId, category }) => {
      if (userId !== user._id) setOpponentBanned(category);
    });

    socket.on('duel:start', async () => {
      try {
        const data = await duelAPI.get(duel._id);
        setDuel(data.duel);
        setQuestions(data.duel.questions || []);
        navigation.replace('BattleScreen', { duel: data.duel, opponent });
      } catch {}
    });

    // Countdown
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!confirmed) autoConfirm(socket);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      socket.off('duel:ban_confirmed');
      socket.off('duel:start');
    };
  }, []);

  const autoConfirm = (socket) => {
    const fallback = SOULS[0].key;
    confirmBan(selected || fallback, socket);
  };

  const confirmBan = async (category, socket) => {
    if (confirmed) return;
    setConfirmed(true);
    const cat = category || selected;
    if (!cat) return Alert.alert('', 'Choisis une catégorie');

    try {
      await duelAPI.ban(duel._id, cat);
      socket.emit('duel:ban_selected', { duelId: duel._id, userId: user._id, category: cat });
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
      setConfirmed(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A0000']} style={s.container}>
      {/* VS Header */}
      <View style={s.header}>
        <View style={s.player}>
          <Text style={s.playerName}>{user?.username}</Text>
          <Text style={s.playerRank}>{user?.rank?.toUpperCase()}</Text>
        </View>
        <View style={s.timerBox}>
          <Text style={[s.timer, timer <= 10 && { color: COLORS.danger }]}>{timer}</Text>
          <Text style={s.timerLabel}>sec</Text>
        </View>
        <View style={[s.player, { alignItems: 'flex-end' }]}>
          <Text style={s.playerName}>{opponent?.username || '???'}</Text>
          <Text style={s.playerRank}>{opponent?.rank?.toUpperCase() || '---'}</Text>
        </View>
      </View>

      <Text style={s.title}>{t('duel.ban_phase')}</Text>
      <Text style={s.sub}>{t('duel.ban_instruction')}</Text>

      {/* Opponent status */}
      <View style={s.statusRow}>
        <View style={[s.statusDot, { backgroundColor: confirmed ? COLORS.success : COLORS.border }]} />
        <Text style={s.statusText}>Toi: {confirmed ? `BAN ${selected}` : 'En attente...'}</Text>
        <View style={[s.statusDot, { backgroundColor: opponentBanned ? COLORS.danger : COLORS.border }]} />
        <Text style={s.statusText}>Eux: {opponentBanned ? `BAN ${opponentBanned}` : 'En attente...'}</Text>
      </View>

      {/* Soul grid */}
      <FlatList
        data={SOULS}
        numColumns={3}
        keyExtractor={i => i.key}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => {
          const isBanned = item.key === opponentBanned;
          const isSelected = item.key === selected;
          return (
            <TouchableOpacity
              style={[s.soulCard, isSelected && s.soulSelected, isBanned && s.soulBanned]}
              onPress={() => !confirmed && !isBanned && setSelected(item.key)}
              disabled={confirmed || isBanned}
            >
              <Text style={s.soulEmoji}>{item.icon}</Text>
              <Text style={[s.soulLabel, isSelected && { color: COLORS.danger }, isBanned && { color: COLORS.textDim }]}>
                {item.label}
              </Text>
              {isBanned && <Text style={s.bannedText}>BANNI</Text>}
            </TouchableOpacity>
          );
        }}
      />

      {!confirmed && (
        <TouchableOpacity
          style={[s.confirmBtn, !selected && s.confirmDisabled]}
          onPress={() => confirmBan(selected, getDuelSocket())}
          disabled={!selected}
        >
          <LinearGradient colors={[COLORS.danger, '#5A0000']} style={s.confirmGrad}>
            <Text style={s.confirmText}>BAN {selected?.toUpperCase() || '...'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {confirmed && (
        <View style={s.waitingBox}>
          <Text style={s.waitingText}>⏳ {t('common.loading')}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  player: { flex: 1 },
  playerName: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  playerRank: { color: COLORS.primary, fontSize: FONTS.sizes.xs },
  timerBox: { alignItems: 'center', width: 60 },
  timer: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: COLORS.primary },
  timerLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center', marginBottom: SPACING.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  grid: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  soulCard: { flex: 1, margin: 4, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  soulSelected: { borderColor: COLORS.danger, backgroundColor: '#2A0000' },
  soulBanned: { opacity: 0.3, borderColor: COLORS.border },
  soulEmoji: { fontSize: 28, marginBottom: 4 },
  soulLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600', textAlign: 'center' },
  bannedText: { color: COLORS.danger, fontSize: 9, fontWeight: '900', marginTop: 2 },
  confirmBtn: { margin: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden' },
  confirmDisabled: { opacity: 0.4 },
  confirmGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  confirmText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.lg, letterSpacing: 3 },
  waitingBox: { margin: SPACING.lg, padding: SPACING.md, alignItems: 'center' },
  waitingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
});
