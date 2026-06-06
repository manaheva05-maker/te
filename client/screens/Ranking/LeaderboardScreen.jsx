import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, SOULS } from '../../constants/ranks';

export default function LeaderboardScreen() {
  const { t } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState('global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soulFilter, setSoulFilter] = useState('shonen');

  useEffect(() => { fetchData(); }, [tab, soulFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.dashboard();
      setData(res.topUsers || []);
    } catch {}
    setLoading(false);
  };

  const medalFor = (i) => ['🥇','🥈','🥉'][i] || `#${i+1}`;
  const medalColor = (i) => [COLORS.gold, COLORS.silver, COLORS.bronze][i] || COLORS.textMuted;

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🏆 {t('ranking.title').toUpperCase()}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['global','soul','clans'].map(tabKey => (
          <TouchableOpacity key={tabKey} style={[s.tab, tab === tabKey && s.tabActive]} onPress={() => setTab(tabKey)}>
            <Text style={[s.tabText, tab === tabKey && s.tabTextActive]}>
              {tabKey === 'global' ? `🌍 ${t('ranking.global')}` : tabKey === 'soul' ? `👁️ ${t('ranking.by_soul')}` : `🏯 ${t('ranking.clans')}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Soul filter */}
      {tab === 'soul' && (
        <FlatList
          data={SOULS}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.soulFilters}
          keyExtractor={i => i.key}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.soulChip, soulFilter === item.key && s.soulChipActive]} onPress={() => setSoulFilter(item.key)}>
              <Text style={s.soulChipText}>{item.icon} {item.label}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item._id || item.username}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>Aucune donnée</Text>}
          renderItem={({ item, index }) => {
            const rankInfo = getRankInfo(item.rank);
            const soulInfo = getSoulInfo(item.aura);
            const isMe = item._id === user?._id || item.username === user?.username;
            return (
              <LinearGradient
                colors={isMe ? ['#1A1A00','#0A0A00'] : ['#12121A','#0A0A0F']}
                style={[s.row, isMe && s.rowMe]}
              >
                <Text style={[s.medal, { color: medalColor(index) }]}>{medalFor(index)}</Text>
                <Text style={s.rowRankIcon}>{rankInfo.icon}</Text>
                <View style={s.rowInfo}>
                  <Text style={[s.rowName, isMe && { color: COLORS.primary }]}>{item.username}</Text>
                  <Text style={s.rowSub}>
                    <Text style={{ color: rankInfo.color }}>{rankInfo.label}</Text>
                    {'  '}{soulInfo.icon} {soulInfo.label}
                  </Text>
                </View>
                <Text style={s.rowKI}>{(item.ki || 0).toLocaleString()} KI</Text>
              </LinearGradient>
            );
          }}
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 3 },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  soulFilters: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  soulChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  soulChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  soulChipText: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.xs },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  rowMe: { borderColor: COLORS.primary },
  medal: { fontWeight: '900', fontSize: FONTS.sizes.md, width: 32, textAlign: 'center' },
  rowRankIcon: { fontSize: 24 },
  rowInfo: { flex: 1 },
  rowName: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  rowSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  rowKI: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
});
