import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../../context/LangContext';
import { adminAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function AdminUsers() {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchUsers(); }, [search, flaggedOnly, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.users({ search, flagged: flaggedOnly, page });
      setUsers(data.users || []);
    } catch {}
    setLoading(false);
  };

  const banUser = (user) => {
    const action = user.isBanned ? 'Débannir' : 'Bannir';
    Alert.alert(`${action} ${user.username}?`, '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: async () => {
        try {
          await adminAPI.ban(user._id, !user.isBanned);
          fetchUsers();
        } catch (err) { Alert.alert(t('common.error'), err.message); }
      }}
    ]);
  };

  const clearFlag = async (user) => {
    try {
      await adminAPI.clearFlag(user._id);
      Alert.alert('✅', 'Flag effacé');
      fetchUsers();
    } catch (err) { Alert.alert(t('common.error'), err.message); }
  };

  const giveCoins = (user) => {
    Alert.prompt('Donner RC', `À ${user.username}`, async (val) => {
      const amount = parseInt(val);
      if (!amount) return;
      try {
        await adminAPI.giveCoins(user._id, amount);
        Alert.alert('✅', `+${amount} RC donné`);
        fetchUsers();
      } catch (err) { Alert.alert(t('common.error'), err.message); }
    }, 'plain-text', '', 'number-pad');
  };

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      {/* Search + Filter */}
      <View style={s.searchBar}>
        <TextInput style={s.searchInput} value={search} onChangeText={v => { setSearch(v); setPage(1); }}
          placeholder="Chercher un joueur..." placeholderTextColor={COLORS.textDim} />
        <TouchableOpacity style={[s.filterBtn, flaggedOnly && s.filterActive]} onPress={() => setFlaggedOnly(!flaggedOnly)}>
          <Text style={[s.filterText, flaggedOnly && { color: COLORS.danger }]}>⚠️</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={s.loading} size="large" color={COLORS.primary} /> : (
        <FlatList
          data={users}
          keyExtractor={u => u._id}
          contentContainerStyle={s.list}
          renderItem={({ item: u }) => (
            <View style={[s.userCard, u.isBanned && s.userBanned, u.anticheat?.flagged && s.userFlagged]}>
              <View style={s.userTop}>
                <View style={s.userMain}>
                  <Text style={s.userName}>{u.username}</Text>
                  <Text style={s.userEmail}>{u.email}</Text>
                  <Text style={s.userMeta}>{u.rank?.toUpperCase()} · {(u.ki||0).toLocaleString()} KI · 💎{u.ryu_coins||0}</Text>
                </View>
                <View style={s.badges}>
                  {u.isAdmin && <Text style={s.badge}>⛩️</Text>}
                  {u.isBanned && <Text style={s.badge}>🚫</Text>}
                  {u.anticheat?.flagged && <Text style={s.badge}>⚠️</Text>}
                </View>
              </View>

              {u.anticheat?.flagged && (
                <Text style={s.flagReason}>⚠️ {u.anticheat.flagReason}</Text>
              )}

              <View style={s.userActions}>
                <TouchableOpacity style={[s.actionBtn, { borderColor: u.isBanned ? COLORS.success : COLORS.danger }]}
                  onPress={() => banUser(u)}>
                  <Text style={[s.actionText, { color: u.isBanned ? COLORS.success : COLORS.danger }]}>
                    {u.isBanned ? '✅ Débannir' : '🚫 Bannir'}
                  </Text>
                </TouchableOpacity>
                {u.anticheat?.flagged && (
                  <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.warning }]} onPress={() => clearFlag(u)}>
                    <Text style={[s.actionText, { color: COLORS.warning }]}>🧹 Clear Flag</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.primary }]} onPress={() => giveCoins(u)}>
                  <Text style={[s.actionText, { color: COLORS.primary }]}>💎 RC</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  searchBar: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  searchInput: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.sm, borderWidth: 1, borderColor: COLORS.border },
  filterBtn: { width: 44, height: 44, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  filterActive: { borderColor: COLORS.danger },
  filterText: { fontSize: 18 },
  loading: { marginTop: SPACING.xl },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  userCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  userBanned: { borderColor: COLORS.danger, opacity: 0.7 },
  userFlagged: { borderColor: COLORS.warning },
  userTop: { flexDirection: 'row', marginBottom: SPACING.sm },
  userMain: { flex: 1 },
  userName: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  userEmail: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  userMeta: { color: COLORS.primary, fontSize: FONTS.sizes.xs, marginTop: 2 },
  badges: { gap: 4 },
  badge: { fontSize: 16 },
  flagReason: { color: COLORS.warning, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm, fontStyle: 'italic' },
  userActions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1 },
  actionText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
});
