import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../services/api';
import { generateLinks } from '../../services/deepLinks';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo } from '../../constants/ranks';

export default function SearchScreen({ navigation }) {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const searchTimer = useRef(null);

  const search = async (text) => {
    setQuery(text);
    clearTimeout(searchTimer.current);
    if (!text.trim() || text.length < 2) { setResults([]); return; }

    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get('/users/search', { params: { q: text, limit: 20 } });
        setResults(data.users || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }, 400);
  };

  const viewProfile = async (userId) => {
    setLoadingProfile(true);
    setShowProfile(true);
    try {
      const data = await api.get(`/users/${userId}/profile`);
      setUserProfile(data.user);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
      setShowProfile(false);
    } finally { setLoadingProfile(false); }
  };

  const challengeToDuel = (targetUser) => {
    const link = generateLinks.duelChallenge(targetUser._id, user.username);
    Alert.alert(
      `⚔️ ${lang === 'fr' ? 'Défier' : 'Challenge'} ${targetUser.username}`,
      lang === 'fr'
        ? `Envoie ce lien à ${targetUser.username} pour le défier en duel :\n\n${link.deep}`
        : `Send this link to ${targetUser.username} to challenge them:\n\n${link.deep}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: lang === 'fr' ? '📨 Partager' : '📨 Share', onPress: async () => {
          const { Share } = await import('react-native');
          Share.share({ message: link.share });
        }}
      ]
    );
  };

  const sendGiftToUser = async (targetUser) => {
    navigation.navigate('Live', { giftTarget: targetUser });
    setShowProfile(false);
  };

  const renderUserCard = ({ item: u }) => {
    const rankInfo = getRankInfo(u.rank);
    const soulInfo = getSoulInfo(u.aura);
    const isMe = u._id === user?._id;

    return (
      <TouchableOpacity
        style={[s.userCard, isMe && s.userCardMe]}
        onPress={() => viewProfile(u._id)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={[s.avatarRing, { borderColor: rankInfo?.color }]}>
          {u.avatarUrl
            ? <View style={s.avatarImg} />
            : <Text style={s.avatarEmoji}>{rankInfo?.icon}</Text>}
        </View>

        {/* Info */}
        <View style={s.userInfo}>
          <View style={s.userNameRow}>
            <Text style={[s.userName, isMe && { color: COLORS.primary }]}>{u.username}</Text>
            {isMe && <Text style={s.youBadge}>{lang === 'fr' ? 'toi' : 'you'}</Text>}
          </View>
          <Text style={s.userMeta}>
            <Text style={{ color: rankInfo?.color }}>{rankInfo?.icon} {rankInfo?.label}</Text>
            {'  '}<Text style={{ color: soulInfo?.color }}>{soulInfo?.icon} {soulInfo?.label}</Text>
          </Text>
          <Text style={s.userKI}>{(u.ki || 0).toLocaleString()} KI</Text>
        </View>

        {/* Actions */}
        {!isMe && (
          <View style={s.quickActions}>
            <TouchableOpacity style={s.quickBtn} onPress={() => challengeToDuel(u)}>
              <Text style={{ fontSize: 18 }}>⚔️</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🔍 {lang === 'fr' ? 'RECHERCHE' : 'SEARCH'}</Text>
      </View>

      {/* Search input */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={search}
          placeholder={lang === 'fr' ? 'Chercher un joueur...' : 'Search a player...'}
          placeholderTextColor={COLORS.textDim}
          autoFocus
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {results.length === 0 && query.length >= 2 && !loading ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>👤</Text>
          <Text style={s.emptyText}>{lang === 'fr' ? 'Aucun joueur trouvé' : 'No player found'}</Text>
        </View>
      ) : query.length < 2 ? (
        <View style={s.hint}>
          <Text style={s.hintText}>
            {lang === 'fr' ? '✍️ Tape au moins 2 caractères pour chercher' : '✍️ Type at least 2 characters'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={u => u._id}
          contentContainerStyle={s.list}
          renderItem={renderUserCard}
        />
      )}

      {/* User profile modal */}
      <Modal visible={showProfile} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.profileModal}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowProfile(false)}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>

            {loadingProfile ? (
              <View style={s.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : userProfile ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <UserProfileContent
                  profile={userProfile}
                  currentUser={user}
                  lang={lang}
                  t={t}
                  onChallenge={() => { setShowProfile(false); challengeToDuel(userProfile); }}
                  onInviteClan={() => {
                    if (!user?.clan) return Alert.alert('', lang === 'fr' ? 'Tu n\'as pas de clan' : 'You have no clan');
                    // Generate clan invite and share
                    Alert.alert('🏯', lang === 'fr' ? 'Lien d\'invitation généré !' : 'Invite link generated!');
                    setShowProfile(false);
                  }}
                  onGift={() => sendGiftToUser(userProfile)}
                />
              </ScrollView>
            ) : null}
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function UserProfileContent({ profile, currentUser, lang, t, onChallenge, onInviteClan, onGift }) {
  const rankInfo = getRankInfo(profile?.rank);
  const soulInfo = getSoulInfo(profile?.aura);
  const isMe = profile?._id === currentUser?._id;
  const winRate = profile?.stats?.duels_played > 0
    ? Math.round((profile.stats.duels_won / profile.stats.duels_played) * 100)
    : 0;

  return (
    <View>
      {/* Avatar */}
      <View style={s.profileHero}>
        <View style={[s.profileAvatar, { borderColor: rankInfo?.color }]}>
          <Text style={s.profileAvatarEmoji}>{rankInfo?.icon}</Text>
        </View>
        <Text style={s.profileName}>{profile?.username}</Text>
        <Text style={[s.profileRank, { color: rankInfo?.color }]}>
          {rankInfo?.icon} {rankInfo?.label}
        </Text>
        <Text style={[s.profileSoul, { color: soulInfo?.color }]}>
          {soulInfo?.icon} {soulInfo?.label}
        </Text>
        {profile?.clan && (
          <View style={s.clanBadge}>
            <Text style={s.clanBadgeText}>🏯 {profile.clanRole?.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* KI + coins */}
      <View style={s.profileCurrencies}>
        <View style={s.profileCurrency}>
          <Text style={s.profileCurrencyVal}>{(profile?.ki || 0).toLocaleString()}</Text>
          <Text style={s.profileCurrencyLabel}>KI</Text>
        </View>
        <View style={s.divider} />
        <View style={s.profileCurrency}>
          <Text style={s.profileCurrencyVal}>{winRate}%</Text>
          <Text style={s.profileCurrencyLabel}>{lang === 'fr' ? 'Win Rate' : 'Win Rate'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.profileCurrency}>
          <Text style={s.profileCurrencyVal}>{profile?.stats?.duels_played || 0}</Text>
          <Text style={s.profileCurrencyLabel}>{lang === 'fr' ? 'Duels' : 'Duels'}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={s.statsGrid}>
        {[
          { icon: '⚔️', val: profile?.stats?.duels_played || 0, label: lang === 'fr' ? 'Duels' : 'Duels' },
          { icon: '🏆', val: profile?.stats?.duels_won || 0, label: lang === 'fr' ? 'Victoires' : 'Wins' },
          { icon: '⚡', val: profile?.stats?.perfect_victories || 0, label: lang === 'fr' ? 'Parfaites' : 'Perfect' },
          { icon: '🔥', val: `${profile?.stats?.streak || 0}j`, label: 'Streak' },
        ].map((st, i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statIcon}>{st.icon}</Text>
            <Text style={s.statVal}>{st.val}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Actions - only if not viewing own profile */}
      {!isMe && (
        <View style={s.profileActions}>
          <TouchableOpacity style={s.profileAction} onPress={onChallenge}>
            <LinearGradient colors={[COLORS.secondary, '#5A0000']} style={s.profileActionGrad}>
              <Text style={s.profileActionText}>⚔️ {lang === 'fr' ? 'Défier' : 'Challenge'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.profileAction} onPress={onInviteClan}>
            <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={[s.profileActionGrad, { borderWidth: 1, borderColor: COLORS.primary + '44' }]}>
              <Text style={s.profileActionText}>🏯 {lang === 'fr' ? 'Inviter Clan' : 'Invite Clan'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  header: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: SPACING.lg, marginTop: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, fontFamily: 'Rajdhani' },
  list: { padding: SPACING.md, gap: SPACING.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  hintText: { color: COLORS.textDim, fontSize: 13 },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  userCardMe: { borderColor: COLORS.primary + '44', backgroundColor: '#1A1A00' },
  avatarRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceLight },
  avatarEmoji: { fontSize: 26 },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  userName: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  youBadge: { color: COLORS.primary, fontSize: 10, fontWeight: '700', backgroundColor: COLORS.primary + '22', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.full },
  userMeta: { fontSize: 11, marginTop: 2 },
  userKI: { color: COLORS.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  quickActions: { gap: 6 },
  quickBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  profileModal: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg },
  closeBtn: { alignSelf: 'flex-end', padding: SPACING.xs, marginBottom: SPACING.sm },

  profileHero: { alignItems: 'center', gap: 6, marginBottom: SPACING.lg },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  profileAvatarEmoji: { fontSize: 40 },
  profileName: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  profileRank: { fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  profileSoul: { fontSize: 12, fontWeight: '700' },
  clanBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  clanBadgeText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },

  profileCurrencies: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  profileCurrency: { alignItems: 'center' },
  profileCurrencyVal: { color: COLORS.primary, fontWeight: '900', fontSize: 18 },
  profileCurrencyLabel: { color: COLORS.textMuted, fontSize: 10 },
  divider: { width: 1, backgroundColor: COLORS.border },

  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statVal: { color: COLORS.primary, fontWeight: '900', fontSize: 15 },
  statLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 1, textAlign: 'center' },

  profileActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  profileAction: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  profileActionGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  profileActionText: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
});
