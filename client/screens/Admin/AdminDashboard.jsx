import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../../context/LangContext';
import { adminAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function AdminDashboard({ navigation }) {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.dashboard();
      setStats(data.stats);
      setTopUsers(data.topUsers || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  if (loading) return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );

  const STAT_CARDS = [
    { label: t('admin.total_users'), val: stats?.users || 0,       icon: '👤', color: COLORS.info },
    { label: 'Clans',               val: stats?.clans || 0,        icon: '🏯', color: COLORS.primary },
    { label: 'Questions',           val: stats?.questions || 0,    icon: '❓', color: COLORS.success },
    { label: 'Tournois',            val: stats?.tournaments || 0,  icon: '🏆', color: COLORS.warning },
    { label: t('admin.active_lives'),val: stats?.livesActive || 0, icon: '🔴', color: COLORS.danger },
    { label: t('admin.flagged'),     val: stats?.flagged || 0,      icon: '⚠️', color: COLORS.danger },
  ];

  const MENU_ITEMS = [
    { label: t('admin.users'),       icon: '👥', screen: 'AdminUsers' },
    { label: t('admin.questions'),   icon: '❓', screen: 'AdminQuestions' },
    { label: t('admin.tournaments'), icon: '🏆', screen: 'AdminTournaments' },
    { label: t('admin.live'),        icon: '🔴', screen: 'AdminLive' },
  ];

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={COLORS.primary} />}
      >
        <LinearGradient colors={['#1A1A00','#0A0A00']} style={s.adminHero}>
          <Text style={s.adminTitle}>⛩️ ADMIN PANEL</Text>
          <Text style={s.adminSub}>inconnuboy39@gmail.com</Text>
        </LinearGradient>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {STAT_CARDS.map((card, i) => (
            <View key={i} style={[s.statCard, { borderColor: card.color + '44' }]}>
              <Text style={s.statIcon}>{card.icon}</Text>
              <Text style={[s.statVal, { color: card.color }]}>{card.val.toLocaleString()}</Text>
              <Text style={s.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Text style={s.sectionTitle}>GESTION</Text>
        <View style={s.menuGrid}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={s.menuCard} onPress={() => navigation.navigate(item.screen)}>
              <LinearGradient colors={['#1A1A2E','#12121A']} style={s.menuGrad}>
                <Text style={s.menuIcon}>{item.icon}</Text>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top users */}
        <Text style={s.sectionTitle}>TOP JOUEURS</Text>
        {topUsers.slice(0, 5).map((u, i) => (
          <View key={u._id || i} style={s.userRow}>
            <Text style={s.userRank}>#{i+1}</Text>
            <View style={s.userInfo}>
              <Text style={s.userName}>{u.username}</Text>
              <Text style={s.userSub}>{u.rank?.toUpperCase()} · {u.aura}</Text>
            </View>
            <Text style={s.userKI}>{(u.ki||0).toLocaleString()} KI</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  adminHero: { paddingTop: 20, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  adminTitle: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 4 },
  adminSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.lg, gap: SPACING.sm },
  statCard: { width: '30.5%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1 },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statVal: { fontSize: FONTS.sizes.xl, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  menuGrid: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  menuCard: { borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  menuGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  menuIcon: { fontSize: 24 },
  menuLabel: { flex: 1, color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md },
  menuArrow: { color: COLORS.textMuted, fontSize: FONTS.sizes.xl },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  userRank: { color: COLORS.primary, fontWeight: '900', width: 28, fontSize: FONTS.sizes.sm },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md },
  userSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  userKI: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
});
