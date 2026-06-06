import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const MatchBox = ({ match, onPress }) => {
  if (!match) return null;
  return (
    <TouchableOpacity style={s.matchBox} onPress={onPress}>
      <View style={[s.matchTeam, match.winner?.toString() === match.clan1?.toString() && s.matchWinner]}>
        <Text style={s.matchTag}>[{match.clan1?.tag || '???'}]</Text>
        <Text style={s.matchName}>{match.clan1?.name || 'TBD'}</Text>
      </View>
      <Text style={s.matchVs}>VS</Text>
      <View style={[s.matchTeam, match.winner?.toString() === match.clan2?.toString() && s.matchWinner]}>
        <Text style={s.matchTag}>[{match.clan2?.tag || '???'}]</Text>
        <Text style={s.matchName}>{match.clan2?.name || 'TBD'}</Text>
      </View>
      {match.scheduled && (
        <Text style={s.matchDate}>{new Date(match.scheduled).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function BracketScreen({ route, navigation }) {
  const { tournament } = route.params || {};
  const { t } = useLang();
  const bracket = tournament?.bracket || {};

  const phase = bracket.currentPhase || 'groups';

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🏆 {tournament?.name?.fr || 'Bracket'}</Text>
        <Text style={s.sub}>{tournament?.season}</Text>
        <View style={s.phaseBadge}>
          <Text style={s.phaseText}>{phase.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Phase de groupes */}
        {bracket.groups?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>PHASE DE GROUPES</Text>
            {bracket.groups.map((group, gi) => (
              <View key={gi} style={s.groupCard}>
                <Text style={s.groupTitle}>Groupe {gi + 1}</Text>
                {group.clans?.map((clan, ci) => (
                  <View key={ci} style={s.groupRow}>
                    <Text style={s.groupClanName}>{clan?.name || clan?.toString()?.slice(-6) || 'TBD'}</Text>
                  </View>
                ))}
                {group.qualified?.length > 0 && (
                  <Text style={s.qualifiedText}>✅ Qualifiés: {group.qualified.length}/2</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Quarts */}
        {bracket.quarters?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>QUARTS DE FINALE</Text>
            {bracket.quarters.map((match, i) => (
              <MatchBox key={i} match={match} onPress={() => {}} />
            ))}
          </>
        )}

        {/* Demis */}
        {bracket.semis?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>DEMI-FINALES</Text>
            {bracket.semis.map((match, i) => (
              <MatchBox key={i} match={match} onPress={() => {}} />
            ))}
          </>
        )}

        {/* 3ème place */}
        {bracket.thirdPlace && (
          <>
            <Text style={s.sectionTitle}>🥉 3ÈME PLACE</Text>
            <MatchBox match={bracket.thirdPlace} onPress={() => {}} />
          </>
        )}

        {/* Finale */}
        {bracket.final && (
          <>
            <Text style={[s.sectionTitle, s.finalTitle]}>⛩️ GRANDE FINALE</Text>
            <LinearGradient colors={['#1A1000', '#0A0800']} style={s.finalCard}>
              <MatchBox match={bracket.final} onPress={() => {
                if (tournament?.liveMatch) navigation.navigate('Live', { matchId: tournament.liveMatch });
              }} />
              {tournament?.liveMatch && (
                <TouchableOpacity style={s.watchBtn} onPress={() => navigation.navigate('Live', { matchId: tournament.liveMatch })}>
                  <Text style={s.watchBtnText}>🔴 REGARDER EN LIVE</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </>
        )}

        {/* No bracket yet */}
        {!bracket.groups?.length && !bracket.final && (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>⏳</Text>
            <Text style={s.emptyText}>Le bracket sera généré après la clôture des inscriptions</Text>
            <Text style={s.emptyCount}>
              {tournament?.registeredClans?.length || 0} / {tournament?.maxClans || 64} clans inscrits
            </Text>
          </View>
        )}

        {/* Prize pool */}
        {tournament?.prizePool > 0 && (
          <View style={s.prizeBox}>
            <Text style={s.prizeLabel}>💎 PRIZE POOL</Text>
            <Text style={s.prizeVal}>{tournament.prizePool.toLocaleString()} RC</Text>
            <Text style={s.prizeSub}>+ 20% des cadeaux Live</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  phaseBadge: { marginTop: SPACING.sm, alignSelf: 'flex-start', backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  phaseText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.xs, letterSpacing: 2 },
  content: { padding: SPACING.lg },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '900', letterSpacing: 3, marginBottom: SPACING.md, marginTop: SPACING.sm },
  finalTitle: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  groupCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  groupTitle: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  groupRow: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  groupClanName: { color: COLORS.text, fontSize: FONTS.sizes.sm },
  qualifiedText: { color: COLORS.success, fontSize: FONTS.sizes.xs, marginTop: SPACING.sm },
  matchBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  matchTeam: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md },
  matchWinner: { backgroundColor: COLORS.accent, borderWidth: 1, borderColor: COLORS.primary },
  matchTag: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
  matchName: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md, flex: 1 },
  matchVs: { color: COLORS.textMuted, textAlign: 'center', fontWeight: '900', fontSize: FONTS.sizes.sm, marginVertical: 4 },
  matchDate: { color: COLORS.textDim, fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: 4 },
  finalCard: { borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 2, borderColor: COLORS.primary, marginBottom: SPACING.lg },
  watchBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', marginTop: SPACING.sm },
  watchBtnText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 22 },
  emptyCount: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  prizeBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginTop: SPACING.lg },
  prizeLabel: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm, letterSpacing: 2 },
  prizeVal: { color: COLORS.text, fontSize: FONTS.sizes.xxxl, fontWeight: '900' },
  prizeSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
});
