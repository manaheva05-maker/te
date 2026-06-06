import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/colors';
import { getRankInfo, getSoulInfo } from '../../constants/ranks';
import { tournamentAPI } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [liveTournament, setLiveTournament] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const rankInfo = getRankInfo(user?.rank);
  const soulInfo = getSoulInfo(user?.aura);

  useEffect(() => { fetchLive(); }, []);

  const fetchLive = async () => {
    try {
      const data = await tournamentAPI.list();
      const live = data.tournaments?.find(t => t.status === 'ongoing' && t.liveMatch);
      setLiveTournament(live || null);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchLive()]);
    setRefreshing(false);
  };

  const kiProgress = () => {
    const ranks = [0, 500, 2000, 5000, 10000, 20000, 40000, 75000, 100000];
    const idx = ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'].indexOf(user?.rank);
    const current = user?.ki || 0;
    const min = ranks[idx] || 0;
    const max = ranks[idx + 1] || 100000;
    return Math.min((current - min) / (max - min), 1);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A', '#0A0A0F']} style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{t('auth.welcome_back')}</Text>
            <Text style={s.username}>{user?.username}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
              <Text style={s.langText}>{lang === 'fr' ? '🇫🇷' : '🇺🇸'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
              <View style={s.rcBadge}>
                <Text style={s.rcText}>💎 {user?.ryu_coins || 0}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rank card */}
        <LinearGradient colors={['#1A1A2E', '#12121A']} style={[s.rankCard, SHADOWS.gold]}>
          <View style={s.rankRow}>
            <Text style={s.rankIcon}>{rankInfo.icon}</Text>
            <View style={s.rankInfo}>
              <Text style={[s.rankLabel, { color: rankInfo.color }]}>{rankInfo.label}</Text>
              <Text style={s.rankKI}>{(user?.ki || 0).toLocaleString()} KI</Text>
            </View>
            <View style={s.soulBadge}>
              <Text style={s.soulIcon}>{soulInfo.icon}</Text>
              <Text style={[s.soulLabel, { color: soulInfo.color }]}>{soulInfo.label}</Text>
            </View>
          </View>
          {/* KI Progress bar */}
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${kiProgress() * 100}%` }]} />
          </View>
          <Text style={s.progressText}>
            {Math.round(kiProgress() * 100)}% {lang === 'fr' ? 'vers' : 'to'} {getRankInfo(['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'][['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'].indexOf(user?.rank)+1])?.label || 'MAX'}
          </Text>
        </LinearGradient>

        {/* LIVE banner */}
        {liveTournament && (
          <TouchableOpacity style={s.liveBanner} onPress={() => navigation.navigate('Live', { matchId: liveTournament.liveMatch })}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>{t('home.live_now')} 🔴</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        )}

        {/* Clan info */}
        {user?.clan && (
          <TouchableOpacity style={s.clanBanner} onPress={() => navigation.navigate('Clan')}>
            <Text style={s.clanIcon}>🏯</Text>
            <Text style={s.clanText}>{user?.clanRole?.toUpperCase()} · {t('clan.war')}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <Text style={s.sectionTitle}>{t('home.play')}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionCard, s.actionPrimary]} onPress={() => navigation.navigate('Duel')}>
            <LinearGradient colors={[COLORS.secondary, '#5A0000']} style={s.actionGrad}>
              <Text style={s.actionIcon}>⚔️</Text>
              <Text style={s.actionLabel}>{t('home.quick_duel')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Training')}>
            <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.actionGrad}>
              <Text style={s.actionIcon}>🤖</Text>
              <Text style={s.actionLabel}>{t('home.training')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('TournamentList')}>
            <LinearGradient colors={['#1A2E1A', '#0A1E0A']} style={s.actionGrad}>
              <Text style={s.actionIcon}>🏆</Text>
              <Text style={s.actionLabel}>{t('tournament.title')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Clan')}>
            <LinearGradient colors={['#2E1A1A', '#1E0A0A']} style={s.actionGrad}>
              <Text style={s.actionIcon}>🏯</Text>
              <Text style={s.actionLabel}>{t('clan.title')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Competitions')}>
            <LinearGradient colors={['#1A0A2E', '#0A051A']} style={s.actionGrad}>
              <Text style={s.actionIcon}>🏟️</Text>
              <Text style={s.actionLabel}>Compétitions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={s.statsRow}>
          {[
            { label: t('profile.duels'), value: user?.stats?.duels_played || 0, icon: '⚔️' },
            { label: t('profile.wins'), value: user?.stats?.duels_won || 0, icon: '🏆' },
            { label: t('home.streak'), value: `${user?.stats?.streak || 0}j`, icon: '🔥' },
          ].map((stat, i) => (
            <View key={i} style={s.statBox}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={s.statVal}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Admin shortcut */}
        {user?.isAdmin && (
          <TouchableOpacity style={s.adminBtn} onPress={() => navigation.navigate('AdminDashboard')}>
            <Text style={s.adminText}>⛩️ ADMIN PANEL</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 60 },
  greeting: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  username: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  headerRight: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  langBtn: { padding: SPACING.xs },
  langText: { fontSize: 20 },
  rcBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  rcText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  rankCard: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  rankIcon: { fontSize: 40, marginRight: SPACING.md },
  rankInfo: { flex: 1 },
  rankLabel: { fontSize: FONTS.sizes.lg, fontWeight: '900', letterSpacing: 2 },
  rankKI: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  soulBadge: { alignItems: 'center' },
  soulIcon: { fontSize: 20 },
  soulLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700', marginTop: 2 },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  progressText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 6, textAlign: 'right' },
  liveBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.danger },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  liveText: { flex: 1, color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.sm },
  clanBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  clanIcon: { fontSize: 20 },
  clanText: { flex: 1, color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, marginTop: SPACING.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  actionCard: { width: '47%', borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  actionPrimary: { borderColor: COLORS.secondary },
  actionGrad: { padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  actionIcon: { fontSize: 32 },
  actionLabel: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm, textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statVal: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  adminBtn: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.md },
  adminText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm, letterSpacing: 2 },
});
