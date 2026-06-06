import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { authAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, RANKS } from '../../constants/ranks';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const [langLoading, setLangLoading] = useState(false);

  const rankInfo = getRankInfo(user?.rank);
  const soulInfo = getSoulInfo(user?.aura);
  const winRate = user?.stats?.duels_played
    ? Math.round((user.stats.duels_won / user.stats.duels_played) * 100)
    : 0;

  const toggleLang = async () => {
    const newLang = lang === 'fr' ? 'en' : 'fr';
    setLangLoading(true);
    try {
      await authAPI.setLang(newLang);
      setLang(newLang);
      await refreshUser();
    } catch {}
    setLangLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), lang === 'fr' ? 'Tu vas être déconnecté.' : 'You will be logged out.', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: logout }
    ]);
  };

  const nextRank = RANKS[RANKS.findIndex(r => r.key === user?.rank) + 1];
  const kiToNext = nextRank ? nextRank.ki - (user?.ki || 0) : 0;

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar / rank */}
        <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.heroSection}>
          <View style={s.avatarRing}>
            <Text style={s.avatarEmoji}>{rankInfo.icon}</Text>
          </View>
          <Text style={s.username}>{user?.username}</Text>
          <Text style={[s.rankLabel, { color: rankInfo.color }]}>{rankInfo.label}</Text>
          <View style={s.soulRow}>
            <Text style={s.soulEmoji}>{soulInfo.icon}</Text>
            <Text style={[s.soulLabel, { color: soulInfo.color }]}>{soulInfo.label}</Text>
          </View>
          <View style={s.kiRow}>
            <Text style={s.kiVal}>{(user?.ki || 0).toLocaleString()} KI</Text>
            {nextRank && <Text style={s.kiNext}>{kiToNext.toLocaleString()} KI → {nextRank.label}</Text>}
          </View>
        </LinearGradient>

        {/* Currencies */}
        <View style={s.currencies}>
          <View style={s.currencyBox}>
            <Text style={s.currencyVal}>💎 {user?.ryu_coins || 0}</Text>
            <Text style={s.currencyLabel}>Ryū Coins</Text>
          </View>
          <View style={s.currencyBox}>
            <Text style={s.currencyVal}>⚡ {user?.chakra || 0}</Text>
            <Text style={s.currencyLabel}>Chakra</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>{t('profile.stats').toUpperCase()}</Text>
        <View style={s.statsGrid}>
          {[
            { label: t('profile.duels'),   val: user?.stats?.duels_played || 0,    icon: '⚔️' },
            { label: t('profile.wins'),    val: user?.stats?.duels_won || 0,       icon: '🏆' },
            { label: t('profile.winrate'), val: `${winRate}%`,                     icon: '📊' },
            { label: t('profile.perfect'), val: user?.stats?.perfect_victories||0, icon: '⚡' },
            { label: 'Streak',             val: `${user?.stats?.streak || 0}j`,    icon: '🔥' },
            { label: 'Cadeaux envoyés',    val: user?.stats?.gifts_sent || 0,       icon: '🎁' },
          ].map((s2, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statIcon}>{s2.icon}</Text>
              <Text style={s.statVal}>{s2.val}</Text>
              <Text style={s.statLabel}>{s2.label}</Text>
            </View>
          ))}
        </View>

        {/* Rank progress */}
        <Text style={s.sectionTitle}>PROGRESSION</Text>
        <View style={s.rankList}>
          {RANKS.map((r, i) => {
            const current = r.key === user?.rank;
            const done = (user?.ki || 0) >= r.ki;
            return (
              <View key={r.key} style={[s.rankItem, current && s.rankItemActive]}>
                <Text style={[s.rankItemIcon, !done && { opacity: 0.3 }]}>{r.icon}</Text>
                <View style={s.rankItemInfo}>
                  <Text style={[s.rankItemLabel, { color: done ? r.color : COLORS.textDim }]}>{r.label}</Text>
                  <Text style={s.rankItemKI}>{r.ki.toLocaleString()} KI</Text>
                </View>
                {current && <View style={s.currentDot} />}
                {done && !current && <Text style={s.checkmark}>✓</Text>}
              </View>
            );
          })}
        </View>

        {/* Settings */}
        <Text style={s.sectionTitle}>{t('common.settings').toUpperCase()}</Text>
        <View style={s.settingsBox}>
          <TouchableOpacity style={s.settingRow} onPress={toggleLang}>
            <Text style={s.settingLabel}>🌐 {t('common.language')}</Text>
            <Text style={s.settingVal}>{lang === 'fr' ? '🇫🇷 Français' : '🇺🇸 English'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={() => navigation.navigate('Shop')}>
            <Text style={s.settingLabel}>🛍️ {t('shop.title')}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
          {user?.isAdmin && (
            <TouchableOpacity style={s.settingRow} onPress={() => navigation.navigate('AdminDashboard')}>
              <Text style={s.settingLabel}>⛩️ Admin Panel</Text>
              <Text style={s.settingArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { paddingTop: 60, paddingBottom: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  avatarEmoji: { fontSize: 44 },
  username: { color: COLORS.text, fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  rankLabel: { fontSize: FONTS.sizes.md, fontWeight: '900', letterSpacing: 3 },
  soulRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  soulEmoji: { fontSize: 16 },
  soulLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  kiRow: { alignItems: 'center', marginTop: SPACING.sm },
  kiVal: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  kiNext: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  currencies: { flexDirection: 'row', margin: SPACING.lg, gap: SPACING.sm },
  currencyBox: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  currencyVal: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  currencyLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, marginTop: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { width: '30.5%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statVal: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2, textAlign: 'center' },
  rankList: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rankItemActive: { backgroundColor: COLORS.surfaceLight },
  rankItemIcon: { fontSize: 24, width: 32 },
  rankItemInfo: { flex: 1 },
  rankItemLabel: { fontWeight: '900', fontSize: FONTS.sizes.sm },
  rankItemKI: { color: COLORS.textDim, fontSize: FONTS.sizes.xs },
  currentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.md },
  settingsBox: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.md },
  settingVal: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  settingArrow: { color: COLORS.textMuted, fontSize: FONTS.sizes.xl },
  logoutBtn: { marginHorizontal: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.danger, alignItems: 'center' },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },
});
