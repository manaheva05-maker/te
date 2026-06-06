import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function ClanWarScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [searching, setSearching] = useState(false);

  const startWar = () => {
    if (!user?.clan) return Alert.alert('', t('clan.no_clan'));
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      Alert.alert('⚔️', 'Clan War démarrée ! Match en préparation...');
    }, 3000);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A0000']} style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>🏯 CLAN WAR</Text>
        <Text style={s.sub}>Affronte un clan ennemi. Score collectif.</Text>

        {/* War format */}
        <View style={s.formatCard}>
          <Text style={s.formatTitle}>FORMAT</Text>
          {[
            { icon: '👑', label: 'Manche 1', desc: 'Shogun vs Shogun · 15 questions · 2 pts' },
            { icon: '⚔️', label: 'Manche 2', desc: 'Duels de Spécialités Âme · 3 pts' },
            { icon: '💥', label: 'Manche 3', desc: 'Battle Royale 5v5 · Flash · 3 pts' },
            { icon: '🎲', label: 'Manche 4', desc: 'Wildcard IA · Voté public · 2 pts' },
            { icon: '⚡', label: 'Manche 5', desc: 'Sudden Death si égalité · 1v1' },
          ].map((m, i) => (
            <View key={i} style={s.mancheRow}>
              <Text style={s.mancheIcon}>{m.icon}</Text>
              <View>
                <Text style={s.mancheLabel}>{m.label}</Text>
                <Text style={s.mancheDesc}>{m.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <View style={s.reqCard}>
          <Text style={s.reqTitle}>PRÉREQUIS</Text>
          <Text style={[s.reqItem, user?.clan ? s.reqOk : s.reqBad]}>
            {user?.clan ? '✅' : '❌'} Être dans un clan
          </Text>
          <Text style={[s.reqItem, ['shogun','samurai'].includes(user?.clanRole) ? s.reqOk : s.reqBad]}>
            {['shogun','samurai'].includes(user?.clanRole) ? '✅' : '⚠️'} Rang Samurai ou Shogun recommandé
          </Text>
        </View>

        {/* ELO reward */}
        <View style={s.rewardCard}>
          <Text style={s.rewardTitle}>RÉCOMPENSES</Text>
          <View style={s.rewardRow}>
            <Text style={s.rewardIcon}>🏆</Text>
            <Text style={s.rewardText}>Victoire: +ELO clan · +30 KI · Stats War</Text>
          </View>
          <View style={s.rewardRow}>
            <Text style={s.rewardIcon}>💀</Text>
            <Text style={s.rewardText}>Défaite: -ELO clan · +10 KI participation</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.startBtn, (!user?.clan || searching) && s.startBtnDisabled]}
          onPress={startWar}
          disabled={!user?.clan || searching}
        >
          <LinearGradient colors={[COLORS.secondary, '#5A0000']} style={s.startGrad}>
            <Text style={s.startText}>{searching ? '⏳ Recherche...' : '⚔️ LANCER LA CLAN WAR'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!user?.clan && (
          <TouchableOpacity style={s.joinClanBtn} onPress={() => navigation.navigate('Clan')}>
            <Text style={s.joinClanText}>Rejoindre un clan →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: 20, gap: SPACING.md },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxxl, fontWeight: '900', letterSpacing: 4 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  formatCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  formatTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '900', letterSpacing: 2, marginBottom: SPACING.sm },
  mancheRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  mancheIcon: { fontSize: 20, width: 28 },
  mancheLabel: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.sm },
  mancheDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  reqCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  reqTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '900', letterSpacing: 2 },
  reqItem: { fontSize: FONTS.sizes.sm },
  reqOk: { color: COLORS.success },
  reqBad: { color: COLORS.danger },
  rewardCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  rewardTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '900', letterSpacing: 2 },
  rewardRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  rewardIcon: { fontSize: 20 },
  rewardText: { color: COLORS.text, fontSize: FONTS.sizes.sm, flex: 1 },
  startBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  startBtnDisabled: { opacity: 0.5 },
  startGrad: { paddingVertical: SPACING.lg, alignItems: 'center' },
  startText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.lg, letterSpacing: 2 },
  joinClanBtn: { alignItems: 'center', padding: SPACING.md },
  joinClanText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
