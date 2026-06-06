import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { tournamentAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const TYPE_CONFIG = {
  local:    { icon: '🗾', color: '#2ECC71', label: 'LOCAL' },
  regional: { icon: '🌏', color: '#3498DB', label: 'RÉGIONAL' },
  mondial:  { icon: '🌍', color: '#C9A227', label: 'MONDIAL' },
};

const STATUS_CONFIG = {
  upcoming:     { label: 'À venir',       color: COLORS.textMuted },
  registration: { label: 'Inscriptions',  color: COLORS.success },
  ongoing:      { label: 'En cours',      color: COLORS.danger },
  finished:     { label: 'Terminé',       color: COLORS.textDim },
};

export default function TournamentListScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    try {
      const data = await tournamentAPI.list();
      setTournaments(data.tournaments || []);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const register = async (tournamentId) => {
    if (!user?.clan) return Alert.alert('', t('clan.no_clan'));
    if (user?.clanRole !== 'shogun') return Alert.alert('', 'Seul le Shogun peut inscrire le clan');
    try {
      await tournamentAPI.register(tournamentId);
      Alert.alert('✅', t('tournament.registered'));
      fetchTournaments();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const filtered = filter === 'all' ? tournaments : tournaments.filter(t => t.type === filter);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '---';

  if (loading) return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🏆 {t('tournament.title').toUpperCase()}</Text>
      </View>

      {/* Filter tabs */}
      <View style={s.filters}>
        {['all','local','regional','mondial'].map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'all' ? 'Tous' : TYPE_CONFIG[f]?.icon + ' ' + TYPE_CONFIG[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTournaments(); }} tintColor={COLORS.primary} />}
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Aucun tournoi disponible</Text>
          </View>
        ) : filtered.map(t => {
          const typeConf = TYPE_CONFIG[t.type];
          const statusConf = STATUS_CONFIG[t.status];
          const isRegistered = t.registeredClans?.some(r => r.clan?._id === user?.clan || r.clan === user?.clan);
          const isFull = t.registeredClans?.length >= t.maxClans;

          return (
            <TouchableOpacity key={t._id} style={s.card} onPress={() => navigation.navigate('Bracket', { tournament: t })}>
              <LinearGradient colors={['#1A1A2E','#12121A']} style={s.cardGrad}>
                {/* Header */}
                <View style={s.cardHeader}>
                  <View style={[s.typeBadge, { borderColor: typeConf.color }]}>
                    <Text style={[s.typeText, { color: typeConf.color }]}>{typeConf.icon} {typeConf.label}</Text>
                  </View>
                  <View style={[s.statusBadge]}>
                    <View style={[s.statusDot, { backgroundColor: statusConf.color }]} />
                    <Text style={[s.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                  </View>
                </View>

                {/* Name */}
                <Text style={s.cardName}>{t.name?.fr || t.name?.en}</Text>
                <Text style={s.cardSeason}>{t.season}</Text>

                {/* Info grid */}
                <View style={s.infoRow}>
                  <View style={s.infoItem}>
                    <Text style={s.infoLabel}>Clans</Text>
                    <Text style={s.infoVal}>{t.registeredClans?.length || 0}/{t.maxClans}</Text>
                  </View>
                  <View style={s.infoItem}>
                    <Text style={s.infoLabel}>Prize Pool</Text>
                    <Text style={[s.infoVal, { color: COLORS.primary }]}>💎 {t.prizePool || 0} RC</Text>
                  </View>
                  <View style={s.infoItem}>
                    <Text style={s.infoLabel}>Entry Fee</Text>
                    <Text style={s.infoVal}>{t.entryFee === 0 ? 'FREE' : `${t.entryFee} RC`}</Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={s.dates}>
                  <Text style={s.dateText}>📅 Début: {formatDate(t.startDate)}</Text>
                  {t.status === 'registration' && (
                    <Text style={s.dateText}>⏳ Inscriptions jusqu'au {formatDate(t.registrationEnd)}</Text>
                  )}
                </View>

                {/* Live indicator */}
                {t.status === 'ongoing' && t.liveMatch && (
                  <TouchableOpacity style={s.liveBtn} onPress={() => navigation.navigate('Live', { matchId: t.liveMatch })}>
                    <View style={s.liveDot} />
                    <Text style={s.liveText}>🔴 LIVE EN COURS</Text>
                  </TouchableOpacity>
                )}

                {/* Register button */}
                {t.status === 'registration' && !isRegistered && !isFull && (
                  <TouchableOpacity style={s.registerBtn} onPress={() => register(t._id)}>
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.registerGrad}>
                      <Text style={s.registerText}>{t.entryFee === 0 ? '✅ ' : `💎 ${t.entryFee} RC · `}{t('tournament.register')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {isRegistered && (
                  <View style={s.registeredBadge}>
                    <Text style={s.registeredText}>✅ {t('tournament.registered')}</Text>
                  </View>
                )}

                {isFull && !isRegistered && (
                  <View style={[s.registeredBadge, { borderColor: COLORS.danger }]}>
                    <Text style={[s.registeredText, { color: COLORS.danger }]}>🔒 {t('tournament.full')}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 3 },
  filters: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  filterText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  filterTextActive: { color: COLORS.primary },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  card: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cardGrad: { padding: SPACING.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  typeBadge: { borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  typeText: { fontSize: FONTS.sizes.xs, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  cardName: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '900', marginBottom: 2 },
  cardSeason: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', marginBottom: SPACING.md },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  infoVal: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '900' },
  dates: { gap: 4, marginBottom: SPACING.md },
  dateText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  liveBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#2A0000', padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  liveText: { color: COLORS.danger, fontWeight: '900', fontSize: FONTS.sizes.sm },
  registerBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  registerGrad: { paddingVertical: SPACING.sm, alignItems: 'center' },
  registerText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.sm },
  registeredBadge: { padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.success, alignItems: 'center' },
  registeredText: { color: COLORS.success, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
