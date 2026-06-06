import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function ResultScreen({ navigation, route }) {
  const { duel, kiEarned } = route.params || {};
  const { user, refreshUser } = useAuth();
  const { resetGame } = useGame();
  const { t } = useLang();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isWinner = duel?.winner?.toString() === user?._id?.toString();
  const isPerfect = isWinner && (duel?.scores?.[duel?.player1?.toString() === user?._id?.toString() ? 'player1' : 'player2'] === 10);
  const myScore = duel?.scores?.[duel?.player1?.toString() === user?._id?.toString() ? 'player1' : 'player2'] || 0;
  const oppScore = duel?.scores?.[duel?.player1?.toString() === user?._id?.toString() ? 'player2' : 'player1'] || 0;

  useEffect(() => {
    refreshUser();
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = () => {
    resetGame();
    navigation.navigate('Main');
  };

  return (
    <LinearGradient
      colors={isWinner ? ['#0A1A0A', '#001000'] : ['#1A0A0A', '#100000']}
      style={s.container}
    >
      {/* Result */}
      <Animated.View style={[s.resultBox, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={s.resultEmoji}>{isPerfect ? '⚡' : isWinner ? '🏆' : '💀'}</Text>
        <Text style={[s.resultText, { color: isWinner ? COLORS.success : COLORS.danger }]}>
          {isPerfect ? t('duel.perfect') : isWinner ? t('duel.victory') : t('duel.defeat')}
        </Text>
      </Animated.View>

      {/* Score */}
      <Animated.View style={[s.scoreRow, { opacity: fadeAnim }]}>
        <View style={s.scoreBox}>
          <Text style={[s.scoreNum, { color: isWinner ? COLORS.success : COLORS.text }]}>{myScore}</Text>
          <Text style={s.scoreName}>{user?.username}</Text>
        </View>
        <Text style={s.vsText}>VS</Text>
        <View style={s.scoreBox}>
          <Text style={[s.scoreNum, { color: !isWinner ? COLORS.success : COLORS.text }]}>{oppScore}</Text>
          <Text style={s.scoreName}>{t('common.loading')}</Text>
        </View>
      </Animated.View>

      {/* KI Earned */}
      <Animated.View style={[s.kiBox, { opacity: fadeAnim }]}>
        <Text style={s.kiLabel}>{t('duel.ki_earned')}</Text>
        <Text style={[s.kiValue, { color: (kiEarned || 0) > 0 ? COLORS.primary : COLORS.danger }]}>
          {(kiEarned || 0) > 0 ? '+' : ''}{kiEarned || 0} KI
        </Text>
        <Text style={s.kiTotal}>{t('profile.ki')}: {user?.ki?.toLocaleString() || 0}</Text>
      </Animated.View>

      {/* Rank up notification */}
      {user?.rank && (
        <View style={s.rankBox}>
          <Text style={s.rankText}>⛩️ {user.rank.toUpperCase()}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.rematchBtn} onPress={() => { resetGame(); navigation.replace('Duel'); }}>
          <Text style={s.rematchText}>⚔️ REVANCHE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={handleContinue}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.homeBtnGrad}>
            <Text style={s.homeText}>{t('home.title').toUpperCase()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  resultBox: { alignItems: 'center', marginBottom: SPACING.xl },
  resultEmoji: { fontSize: 80 },
  resultText: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', letterSpacing: 4, marginTop: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl, marginBottom: SPACING.xl },
  scoreBox: { alignItems: 'center' },
  scoreNum: { fontSize: 60, fontWeight: '900' },
  scoreName: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },
  vsText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  kiBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, width: '100%', marginBottom: SPACING.lg },
  kiLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  kiValue: { fontSize: FONTS.sizes.xxxl, fontWeight: '900' },
  kiTotal: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4 },
  rankBox: { marginBottom: SPACING.xl },
  rankText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg, letterSpacing: 3 },
  actions: { width: '100%', gap: SPACING.md },
  rematchBtn: { padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md },
  rematchText: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md },
  homeBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  homeBtnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  homeText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
});
