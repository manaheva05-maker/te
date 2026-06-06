import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../services/api';
import { generateLinks } from '../../services/deepLinks';
import { COLORS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, SOULS } from '../../constants/ranks';

const compAPI = {
  get:    (id) => api.get(`/competitions/${id}`),
  join:   (id) => api.post(`/competitions/${id}/join`),
  start:  (id) => api.post(`/competitions/${id}/start`),
  cancel: (id) => api.post(`/competitions/${id}/cancel`),
  finish: (id) => api.post(`/competitions/${id}/finish`),
};

const TYPE_ICONS = {
  solo_1v1: '⚔️', solo_battle_royale: '💥', clan_war: '🏯'
};
const TYPE_LABELS = {
  solo_1v1: '1v1 Solo', solo_battle_royale: 'Battle Royale', clan_war: 'Clan War'
};
const STATUS_COLORS = {
  draft: COLORS.textMuted, open: COLORS.success,
  ongoing: COLORS.danger, finished: COLORS.textDim, cancelled: COLORS.textDim
};

export default function CompetitionDetailScreen({ route, navigation }) {
  const { compId, inviteCode } = route.params || {};
  const { user, refreshUser } = useAuth();
  const { lang, t } = useLang();
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchComp(); }, []);

  const fetchComp = async () => {
    setLoading(true);
    try {
      let data;
      if (inviteCode) {
        data = await api.get(`/competitions/invite/${inviteCode}`);
      } else {
        data = await compAPI.get(compId);
      }
      setComp(data.competition);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      let data;
      if (inviteCode && !compId) {
        data = await api.post(`/competitions/invite/${inviteCode}/join`);
      } else {
        data = await compAPI.join(comp._id);
      }
      setComp(data.competition);
      await refreshUser();
      Alert.alert('✅', lang === 'fr' ? 'Tu as rejoint la compétition !' : 'You joined the competition!');
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally { setActionLoading(false); }
  };

  const handleStart = async () => {
    Alert.alert(
      lang === 'fr' ? 'Démarrer ?' : 'Start?',
      lang === 'fr' ? 'La compétition commencera immédiatement.' : 'Competition will start immediately.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: lang === 'fr' ? 'Démarrer' : 'Start', onPress: async () => {
          setActionLoading(true);
          try {
            const data = await compAPI.start(comp._id);
            setComp(data.competition);
          } catch (err) { Alert.alert(t('common.error'), err.message); }
          finally { setActionLoading(false); }
        }}
      ]
    );
  };

  const handleFinish = async () => {
    Alert.alert(
      lang === 'fr' ? 'Terminer ?' : 'Finish?',
      lang === 'fr' ? 'Le gagnant sera déterminé par le score.' : 'Winner determined by score.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: 'OK', onPress: async () => {
          setActionLoading(true);
          try {
            const data = await compAPI.finish(comp._id);
            setComp(data.competition);
            if (data.winner) {
              Alert.alert('🏆', lang === 'fr'
                ? `Gagnant: ${data.winner.username} (+${data.prizeDistributed} KI)`
                : `Winner: ${data.winner.username} (+${data.prizeDistributed} KI)`);
            }
          } catch (err) { Alert.alert(t('common.error'), err.message); }
          finally { setActionLoading(false); }
        }}
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      lang === 'fr' ? 'Annuler ?' : 'Cancel?',
      lang === 'fr' ? 'Les entry fees seront remboursés.' : 'Entry fees will be refunded.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: lang === 'fr' ? 'Annuler la comp' : 'Cancel comp', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            const data = await compAPI.cancel(comp._id);
            setComp(data.competition);
            Alert.alert('✅', lang === 'fr' ? 'Compétition annulée. KI remboursé.' : 'Competition cancelled. KI refunded.');
          } catch (err) { Alert.alert(t('common.error'), err.message); }
          finally { setActionLoading(false); }
        }}
      ]
    );
  };

  const shareComp = async () => {
    if (!comp) return;
    const links = generateLinks.competition(comp.inviteCode, comp.name);
    await Share.share({ message: links.share });
  };

  if (loading) return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );
  if (!comp) return null;

  const isCreator = String(comp.createdBy?._id || comp.createdBy) === String(user?._id);
  const isParticipant = comp.participants?.some(
    p => String(p.user?._id || p.user) === String(user?._id)
  );
  const spotsLeft = (comp.maxParticipants || 8) - (comp.participants?.length || 0);
  const statusColor = STATUS_COLORS[comp.status] || COLORS.textMuted;
  const soulInfo = SOULS.find(s => s.key === comp.soul);

  // Sort participants by score
  const sortedParticipants = [...(comp.participants || [])].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.shareBtn} onPress={shareComp}>
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={s.heroIcon}>{TYPE_ICONS[comp.type] || '🏟️'}</Text>
          <Text style={s.heroName}>{comp.name}</Text>

          <View style={s.heroBadges}>
            <View style={[s.typeBadge, { borderColor: COLORS.primary }]}>
              <Text style={[s.typeBadgeText, { color: COLORS.primary }]}>
                {TYPE_LABELS[comp.type]}
              </Text>
            </View>
            <View style={[s.statusBadge, { borderColor: statusColor }]}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusText, { color: statusColor }]}>{comp.status?.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={s.heroCreator}>
            {lang === 'fr' ? 'par' : 'by'} {comp.creatorUsername}
            {soulInfo && soulInfo.key !== 'mixed' ? `  ${soulInfo.icon} ${soulInfo.label}` : '  🎲 Mixed'}
          </Text>

          {/* Stats row */}
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatVal}>{comp.participants?.length || 0}/{comp.maxParticipants}</Text>
              <Text style={s.heroStatLabel}>{lang === 'fr' ? 'Joueurs' : 'Players'}</Text>
            </View>
            {comp.entryFeeKI > 0 && (
              <View style={s.heroStat}>
                <Text style={[s.heroStatVal, { color: COLORS.primary }]}>⚡ {comp.entryFeeKI}</Text>
                <Text style={s.heroStatLabel}>Entry KI</Text>
              </View>
            )}
            {comp.prizePoolKI > 0 && (
              <View style={s.heroStat}>
                <Text style={[s.heroStatVal, { color: COLORS.gold }]}>🏆 {comp.prizePoolKI}</Text>
                <Text style={s.heroStatLabel}>Prize KI</Text>
              </View>
            )}
            <View style={s.heroStat}>
              <Text style={s.heroStatVal}>{spotsLeft}</Text>
              <Text style={s.heroStatLabel}>{lang === 'fr' ? 'Places' : 'Spots'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.content}>
          {/* Invite code */}
          {comp.inviteCode && (
            <TouchableOpacity style={s.codeCard} onPress={shareComp}>
              <View style={{ flex: 1 }}>
                <Text style={s.codeLabel}>🔗 {lang === 'fr' ? 'Code d\'invitation' : 'Invite Code'}</Text>
                <Text style={s.codeValue}>{comp.inviteCode}</Text>
                <Text style={s.codeDeepLink}>shinken://competition/{comp.inviteCode}</Text>
              </View>
              <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {/* Description */}
          {comp.description ? (
            <View style={s.descCard}>
              <Text style={s.descTitle}>{lang === 'fr' ? 'Description' : 'Description'}</Text>
              <Text style={s.descText}>{comp.description}</Text>
            </View>
          ) : null}

          {/* Rules */}
          {comp.rules ? (
            <View style={s.descCard}>
              <Text style={s.descTitle}>📜 {lang === 'fr' ? 'Règles' : 'Rules'}</Text>
              <Text style={s.descText}>{comp.rules}</Text>
            </View>
          ) : null}

          {/* Winner banner */}
          {comp.status === 'finished' && comp.winner && (
            <LinearGradient colors={['#1A1500', '#0A0A00']} style={s.winnerCard}>
              <Text style={s.winnerLabel}>🏆 {lang === 'fr' ? 'VAINQUEUR' : 'WINNER'}</Text>
              <Text style={s.winnerName}>
                {sortedParticipants[0]?.username || '???'}
              </Text>
              {comp.prizePoolKI > 0 && (
                <Text style={s.winnerPrize}>+{comp.prizePoolKI} KI</Text>
              )}
            </LinearGradient>
          )}

          {/* Participants leaderboard */}
          <Text style={s.sectionTitle}>
            👥 {lang === 'fr' ? 'Participants' : 'Participants'} ({comp.participants?.length || 0})
          </Text>
          {sortedParticipants.map((p, i) => {
            const rankInfo = getRankInfo(p.rank);
            const isWinner = comp.status === 'finished' && i === 0;
            const isMe = String(p.user?._id || p.user) === String(user?._id);
            return (
              <View key={p._id || i} style={[s.participantRow, isMe && s.participantRowMe, isWinner && s.participantRowWinner]}>
                <Text style={[s.participantPos, {
                  color: i === 0 ? COLORS.gold : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : COLORS.textMuted,
                  fontSize: i < 3 ? 20 : 13,
                }]}>
                  {['🥇', '🥈', '🥉'][i] || `#${i + 1}`}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.participantName, isMe && { color: COLORS.primary }]}>
                    {p.username} {isMe ? '(toi)' : ''}
                  </Text>
                  <Text style={s.participantMeta}>
                    {rankInfo?.icon} {rankInfo?.label}
                    {p.status === 'winner' ? '  👑 Gagnant' : ''}
                  </Text>
                </View>
                {comp.status === 'ongoing' || comp.status === 'finished' ? (
                  <Text style={[s.participantScore, { color: i === 0 ? COLORS.gold : COLORS.text }]}>
                    {p.score || 0} pts
                  </Text>
                ) : null}
              </View>
            );
          })}

          {/* Scheduled time */}
          {comp.scheduledAt && (
            <View style={s.scheduleCard}>
              <Text style={s.scheduleIcon}>📅</Text>
              <View>
                <Text style={s.scheduleLabel}>{lang === 'fr' ? 'Planifiée le' : 'Scheduled for'}</Text>
                <Text style={s.scheduleDate}>
                  {new Date(comp.scheduledAt).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {/* Join */}
          {comp.status === 'open' && !isParticipant && spotsLeft > 0 && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleJoin} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator color={COLORS.background} />
                : <Text style={s.primaryBtnText}>
                    {comp.entryFeeKI > 0 ? `⚡ ${comp.entryFeeKI} KI — ` : ''}
                    {lang === 'fr' ? 'Rejoindre' : 'Join'}
                  </Text>}
            </TouchableOpacity>
          )}

          {/* Already joined */}
          {isParticipant && comp.status === 'open' && (
            <View style={s.joinedBadge}>
              <Text style={s.joinedText}>✅ {lang === 'fr' ? 'Tu es inscrit' : 'You are registered'}</Text>
            </View>
          )}

          {/* Creator controls */}
          {isCreator && (
            <View style={s.creatorControls}>
              <Text style={s.creatorLabel}>👑 {lang === 'fr' ? 'Contrôles créateur' : 'Creator controls'}</Text>
              <View style={s.creatorBtns}>
                {comp.status === 'open' && comp.participants?.length >= 2 && (
                  <TouchableOpacity style={s.controlBtn} onPress={handleStart} disabled={actionLoading}>
                    <LinearGradient colors={[COLORS.success, '#1A6A1A']} style={s.controlBtnGrad}>
                      <Text style={s.controlBtnText}>▶ {lang === 'fr' ? 'Démarrer' : 'Start'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {comp.status === 'ongoing' && (
                  <TouchableOpacity style={s.controlBtn} onPress={handleFinish} disabled={actionLoading}>
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.controlBtnGrad}>
                      <Text style={s.controlBtnText}>🏆 {lang === 'fr' ? 'Terminer' : 'Finish'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {['open', 'draft'].includes(comp.status) && (
                  <TouchableOpacity style={[s.controlBtn, { flex: 1 }]} onPress={handleCancel} disabled={actionLoading}>
                    <View style={[s.controlBtnGrad, { borderWidth: 1, borderColor: COLORS.danger, backgroundColor: '#2A0000' }]}>
                      <Text style={[s.controlBtnText, { color: COLORS.danger }]}>
                        🚫 {lang === 'fr' ? 'Annuler' : 'Cancel'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Share */}
          <TouchableOpacity style={s.shareBtn2} onPress={shareComp}>
            <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
            <Text style={s.shareBtnText}>{lang === 'fr' ? 'Partager' : 'Share'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: SPACING.lg, alignItems: 'center', gap: 8, position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16 },
  shareBtn: { position: 'absolute', top: 16, right: 16 },
  heroIcon: { fontSize: 56 },
  heroName: { color: COLORS.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroBadges: { flexDirection: 'row', gap: SPACING.sm },
  typeBadge: { borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  typeBadgeText: { fontSize: 11, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900' },
  heroCreator: { color: COLORS.textMuted, fontSize: 12 },
  heroStats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  heroStat: { alignItems: 'center' },
  heroStatVal: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  heroStatLabel: { color: COLORS.textMuted, fontSize: 10 },
  content: { padding: SPACING.lg },
  codeCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '44', flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  codeLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  codeValue: { color: COLORS.primary, fontWeight: '900', fontSize: 20, letterSpacing: 3 },
  codeDeepLink: { color: COLORS.textDim, fontSize: 10, marginTop: 2 },
  descCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  descTitle: { color: COLORS.primary, fontWeight: '900', fontSize: 13, marginBottom: SPACING.sm },
  descText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  winnerCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 2, borderColor: COLORS.gold, marginBottom: SPACING.md },
  winnerLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  winnerName: { color: COLORS.gold, fontSize: 28, fontWeight: '900', marginTop: 4 },
  winnerPrize: { color: COLORS.primary, fontSize: 16, fontWeight: '900', marginTop: 4 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.md },
  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  participantRowMe: { backgroundColor: '#1A1A00', borderColor: COLORS.primary + '44' },
  participantRowWinner: { backgroundColor: '#1A1500', borderColor: COLORS.gold + '44' },
  participantPos: { fontWeight: '900', width: 32, textAlign: 'center' },
  participantName: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  participantMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  participantScore: { fontWeight: '900', fontSize: 14 },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.sm },
  scheduleIcon: { fontSize: 24 },
  scheduleLabel: { color: COLORS.textMuted, fontSize: 11 },
  scheduleDate: { color: COLORS.text, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' },
  actions: { padding: SPACING.lg, gap: SPACING.md },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center' },
  primaryBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  joinedBadge: { borderWidth: 1, borderColor: COLORS.success, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  joinedText: { color: COLORS.success, fontWeight: '700', fontSize: 13 },
  creatorControls: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  creatorLabel: { color: COLORS.primary, fontWeight: '900', fontSize: 12, marginBottom: SPACING.sm },
  creatorBtns: { flexDirection: 'row', gap: SPACING.sm },
  controlBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  controlBtnGrad: { paddingVertical: SPACING.sm, alignItems: 'center' },
  controlBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 13 },
  shareBtn2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  shareBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
