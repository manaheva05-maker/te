import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { clanAPI } from '../../services/clanApi';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, CLAN_RANKS } from '../../constants/ranks';

const ROLE_ICONS = { shogun: '👑', samurai: '⚔️', ronin: '🥋' };

export default function ClanDetailScreen({ route, navigation }) {
  const { clanId } = route.params;
  const { user, refreshUser } = useAuth();
  const { lang, t } = useLang();
  const [clan, setClan] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => { fetchClan(); }, []);

  const fetchClan = async () => {
    setLoading(true);
    try {
      const data = await clanAPI.get(clanId);
      setClan(data.clan);
      setLeaderboard(data.leaderboard || []);
      setMyRequest(data.myRequest);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestJoin = async () => {
    setJoining(true);
    try {
      const data = await clanAPI.requestJoin(clanId, { message: joinMessage });
      if (data.joined) {
        await refreshUser();
        Alert.alert('✅', lang === 'fr' ? 'Clan rejoint !' : 'Joined!');
        navigation.goBack();
      } else {
        setMyRequest(data.request);
        Alert.alert('📨', lang === 'fr' ? 'Demande envoyée !' : 'Request sent!');
        setShowJoinForm(false);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setJoining(false);
    }
  };

  const clanRankInfo = (elo) => CLAN_RANKS.slice().reverse().find(r => (elo||0) >= r.elo) || CLAN_RANKS[0];
  const totalMembers = clan ? clan.samurai?.length + clan.members?.length + 1 : 0;
  const winRate = clan?.stats?.wars_played > 0
    ? Math.round((clan.stats.wars_won / clan.stats.wars_played) * 100)
    : 0;

  if (loading) return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );

  if (!clan) return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.centered}>
      <Text style={{ color: COLORS.textMuted }}>Clan introuvable</Text>
    </LinearGradient>
  );

  const clanRank = clanRankInfo(clan.elo);
  const isMember = user?.clan?.toString() === clan._id.toString();

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#1A1A2E','#0A0A1E']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={s.clanEmblem}>
            <Text style={s.clanEmblemText}>{clan.tag}</Text>
          </View>

          <Text style={s.clanName}>{clan.name}</Text>
          <Text style={[s.clanRankBadge, { color: clanRank.color }]}>{clanRank.icon} {clanRank.label}</Text>

          <View style={s.heroStats}>
            {[
              { val: clan.elo, label: 'ELO' },
              { val: `${totalMembers}/30`, label: lang === 'fr' ? 'Membres' : 'Members' },
              { val: `${winRate}%`, label: lang === 'fr' ? 'Win Rate' : 'Win Rate' },
            ].map((stat, i) => (
              <View key={i} style={s.heroStat}>
                <Text style={s.heroStatVal}>{stat.val}</Text>
                <Text style={s.heroStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={s.content}>
          {/* Info */}
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>👑</Text>
              <Text style={s.infoLabel}>{lang === 'fr' ? 'Shogun' : 'Shogun'}</Text>
              <Text style={s.infoVal}>{clan.shogun?.username}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>🔒</Text>
              <Text style={s.infoLabel}>{lang === 'fr' ? 'Recrutement' : 'Recruitment'}</Text>
              <Text style={[s.infoVal, { color: clan.recruitmentOpen ? COLORS.success : COLORS.danger }]}>
                {clan.recruitmentOpen
                  ? (clan.requiresApproval ? (lang === 'fr' ? 'Avec approbation' : 'Approval required') : (lang === 'fr' ? 'Libre' : 'Open'))
                  : (lang === 'fr' ? 'Fermé' : 'Closed')}
              </Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>⚔️</Text>
              <Text style={s.infoLabel}>{lang === 'fr' ? 'Rang minimum' : 'Min rank'}</Text>
              <Text style={s.infoVal}>{getRankInfo(clan.minRankRequired)?.icon} {clan.minRankRequired?.toUpperCase()}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>💰</Text>
              <Text style={s.infoLabel}>{lang === 'fr' ? 'Trésorerie' : 'Treasury'}</Text>
              <Text style={s.infoVal}>{clan.treasury} RC</Text>
            </View>
          </View>

          {/* Description */}
          {clan.description ? (
            <View style={s.descCard}>
              <Text style={s.descTitle}>{lang === 'fr' ? 'Description' : 'Description'}</Text>
              <Text style={s.descText}>{clan.description}</Text>
            </View>
          ) : null}

          {/* Rules */}
          {clan.rules ? (
            <View style={s.descCard}>
              <Text style={s.descTitle}>📜 {lang === 'fr' ? 'Règles' : 'Rules'}</Text>
              <Text style={s.descText}>{clan.rules}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <Text style={s.sectionTitle}>📊 {lang === 'fr' ? 'Statistiques' : 'Statistics'}</Text>
          <View style={s.statsGrid}>
            {[
              { icon: '⚔️', val: clan.stats?.wars_played || 0, label: lang === 'fr' ? 'Wars jouées' : 'Wars played' },
              { icon: '🏆', val: clan.stats?.wars_won || 0, label: lang === 'fr' ? 'Wars gagnées' : 'Wars won' },
              { icon: '🏟️', val: clan.stats?.tournaments_played || 0, label: lang === 'fr' ? 'Tournois' : 'Tournaments' },
              { icon: '💰', val: clan.stats?.total_ki_donated || 0, label: 'RC donés' },
            ].map((stat, i) => (
              <View key={i} style={s.statCard}>
                <Text style={s.statIcon}>{stat.icon}</Text>
                <Text style={s.statVal}>{stat.val}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Classement interne */}
          <Text style={s.sectionTitle}>🏆 {lang === 'fr' ? 'Classement du clan' : 'Clan Rankings'}</Text>
          {leaderboard.slice(0, 5).map((member, i) => {
            const rankInfo = getRankInfo(member?.rank);
            return (
              <View key={member._id || i} style={s.leaderRow}>
                <Text style={[s.leaderPos, { color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : COLORS.textMuted }]}>
                  {['🥇','🥈','🥉'][i] || `#${i+1}`}
                </Text>
                <View style={s.leaderInfo}>
                  <Text style={s.leaderName}>{member?.username}</Text>
                  <Text style={s.leaderMeta}>{rankInfo?.icon} {rankInfo?.label}</Text>
                </View>
                <Text style={s.leaderKI}>{(member?.ki || 0).toLocaleString()} KI</Text>
              </View>
            );
          })}

          {/* Join section */}
          {!isMember && !user?.clan && clan.recruitmentOpen && (
            <View style={s.joinSection}>
              {myRequest ? (
                <View style={s.pendingBadge}>
                  <Text style={s.pendingText}>⏳ {lang === 'fr' ? 'Demande en attente d\'approbation' : 'Request pending approval'}</Text>
                </View>
              ) : showJoinForm ? (
                <View style={s.joinForm}>
                  <Text style={s.joinFormLabel}>
                    {lang === 'fr' ? 'Message au Shogun (optionnel)' : 'Message to Shogun (optional)'}
                  </Text>
                  <TextInput
                    style={s.joinMessageInput}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                    placeholder={lang === 'fr' ? 'Présente-toi brièvement...' : 'Introduce yourself briefly...'}
                    placeholderTextColor={COLORS.textDim}
                    maxLength={200}
                    multiline
                  />
                  <View style={s.joinFormBtns}>
                    <TouchableOpacity style={s.cancelJoinBtn} onPress={() => setShowJoinForm(false)}>
                      <Text style={s.cancelJoinText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.confirmJoinBtn} onPress={requestJoin} disabled={joining}>
                      {joining
                        ? <ActivityIndicator color={COLORS.background} size="small" />
                        : <Text style={s.confirmJoinText}>{clan.requiresApproval ? '📨 Envoyer' : '+ Rejoindre'}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={s.joinBtn} onPress={() => setShowJoinForm(true)}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.joinBtnGrad}>
                    <Text style={s.joinBtnText}>
                      {clan.requiresApproval
                        ? `📨 ${lang === 'fr' ? 'Demander à rejoindre' : 'Request to join'}`
                        : `+ ${lang === 'fr' ? 'Rejoindre' : 'Join'}`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isMember && (
            <View style={s.alreadyMember}>
              <Text style={s.alreadyMemberText}>✅ {lang === 'fr' ? 'Tu es membre de ce clan' : 'You are a member'}</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16 },
  hero: { paddingTop: 60, paddingBottom: 24, alignItems: 'center', gap: 8 },
  clanEmblem: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.primary, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  clanEmblemText: { color: COLORS.primary, fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  clanName: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  clanRankBadge: { fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  heroStats: { flexDirection: 'row', gap: 32, marginTop: 8 },
  heroStat: { alignItems: 'center' },
  heroStatVal: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  heroStatLabel: { color: COLORS.textMuted, fontSize: 10 },
  content: { padding: SPACING.lg },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIcon: { fontSize: 16, width: 24 },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  infoVal: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  descCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  descTitle: { color: COLORS.primary, fontWeight: '900', fontSize: 13, marginBottom: SPACING.sm },
  descText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { width: '47%', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statVal: { color: COLORS.primary, fontWeight: '900', fontSize: 16 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  leaderPos: { fontWeight: '900', fontSize: 16, width: 32, textAlign: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  leaderMeta: { color: COLORS.textMuted, fontSize: 10 },
  leaderKI: { color: COLORS.primary, fontWeight: '900', fontSize: 12 },
  joinSection: { marginTop: SPACING.lg },
  pendingBadge: { padding: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.warning },
  pendingText: { color: COLORS.warning, fontWeight: '700', fontSize: 13 },
  joinForm: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  joinFormLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.sm },
  joinMessageInput: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, minHeight: 80, textAlignVertical: 'top', marginBottom: SPACING.md },
  joinFormBtns: { flexDirection: 'row', gap: SPACING.sm },
  cancelJoinBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelJoinText: { color: COLORS.textMuted, fontWeight: '700' },
  confirmJoinBtn: { flex: 1, backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  confirmJoinText: { color: COLORS.background, fontWeight: '900', fontSize: 14 },
  joinBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  joinBtnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  joinBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  alreadyMember: { padding: SPACING.md, backgroundColor: COLORS.success + '22', borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.success },
  alreadyMemberText: { color: COLORS.success, fontWeight: '700', fontSize: 13 },
});
