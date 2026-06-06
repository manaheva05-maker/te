import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const REWARDS = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  free: i % 5 === 0 ? { type: 'chakra', amount: 50, emoji: '⚡' } : null,
  premium: i % 2 === 0
    ? { type: 'rc', amount: 10 + i * 5, emoji: '💎' }
    : { type: 'cosmetic', label: `Cosmétique Lv${i+1}`, emoji: ['🎨','🔥','⛩️','🐉','👁️'][i%5] },
}));

export default function BattlePassScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const currentLevel = user?.battlePass?.level || 0;
  const hasPass = user?.battlePass?.active || false;

  const buy = () => {
    Alert.alert('⚔️ Battle Pass', 'Acheter le Battle Pass Saisonnier pour 4,99€ ?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: 'Acheter', onPress: () => Alert.alert('✅', 'Battle Pass activé !') }
    ]);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1000']} style={s.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.hero}>
        <Text style={s.heroTitle}>⚔️ BATTLE PASS</Text>
        <Text style={s.heroSub}>Saison 1 — Shōnen</Text>
        <Text style={s.heroLevel}>Niveau {currentLevel} / 50</Text>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${(currentLevel / 50) * 100}%` }]} />
        </View>
        {!hasPass && (
          <TouchableOpacity style={s.buyBtn} onPress={buy}>
            <Text style={s.buyText}>ACTIVER — 4,99€</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLORS.textMuted }]} />
            <Text style={s.legendText}>Gratuit</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={s.legendText}>Premium</Text>
          </View>
        </View>

        {REWARDS.map(reward => {
          const done = reward.level <= currentLevel;
          return (
            <View key={reward.level} style={[s.rewardRow, done && s.rewardDone]}>
              <View style={[s.levelBadge, done && s.levelBadgeDone]}>
                <Text style={[s.levelNum, done && { color: COLORS.primary }]}>{reward.level}</Text>
              </View>

              {/* Free reward */}
              <View style={[s.rewardBox, s.rewardFree, !reward.free && s.rewardEmpty]}>
                {reward.free ? (
                  <>
                    <Text style={s.rewardEmoji}>{reward.free.emoji}</Text>
                    <Text style={s.rewardLabel}>{reward.free.amount} {reward.free.type}</Text>
                  </>
                ) : (
                  <Text style={s.rewardDash}>—</Text>
                )}
              </View>

              {/* Premium reward */}
              <View style={[s.rewardBox, s.rewardPremium, !hasPass && s.rewardLocked]}>
                {reward.premium ? (
                  <>
                    <Text style={s.rewardEmoji}>{reward.premium.emoji}</Text>
                    <Text style={s.rewardLabel}>
                      {reward.premium.amount ? `${reward.premium.amount} RC` : reward.premium.label}
                    </Text>
                    {!hasPass && <Text style={s.lockIcon}>🔒</Text>}
                  </>
                ) : null}
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingTop: 60, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  heroTitle: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', color: COLORS.background, letterSpacing: 4 },
  heroSub: { color: COLORS.background, fontSize: FONTS.sizes.sm, opacity: 0.8 },
  heroLevel: { color: COLORS.background, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  progressBg: { width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.background, borderRadius: RADIUS.full },
  buyBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.background, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  buyText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.md },
  content: { padding: SPACING.lg },
  legend: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  rewardDone: { opacity: 0.6 },
  levelBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  levelBadgeDone: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  levelNum: { color: COLORS.textMuted, fontWeight: '900', fontSize: FONTS.sizes.sm },
  rewardBox: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center', flexDirection: 'row', gap: SPACING.xs, borderWidth: 1 },
  rewardFree: { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.border },
  rewardPremium: { backgroundColor: '#1A1500', borderColor: COLORS.primary },
  rewardLocked: { opacity: 0.5 },
  rewardEmpty: { opacity: 0.3 },
  rewardEmoji: { fontSize: 18 },
  rewardLabel: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '700', flex: 1 },
  rewardDash: { color: COLORS.textDim, fontSize: FONTS.sizes.sm, flex: 1, textAlign: 'center' },
  lockIcon: { fontSize: 12 },
});
