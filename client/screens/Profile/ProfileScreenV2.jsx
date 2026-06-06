import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, ActionSheetIOS, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { authAPI } from '../../services/api';
import cloudinaryService, { AVATAR_FOLDERS } from '../../services/cloudinary';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, RANKS } from '../../constants/ranks';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const { resetOnboarding } = useOnboarding();
  const [uploading, setUploading] = useState(false);
  const [langLoading, setLangLoading] = useState(false);

  const rankInfo = getRankInfo(user?.rank);
  const soulInfo = getSoulInfo(user?.aura);
  const winRate = user?.stats?.duels_played
    ? Math.round((user.stats.duels_won / user.stats.duels_played) * 100)
    : 0;

  // ─── AVATAR UPLOAD ────────────────────────────────────────────
  const handleAvatarUpload = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            lang === 'fr' ? 'Annuler' : 'Cancel',
            lang === 'fr' ? 'Choisir dans la galerie' : 'Choose from library',
            lang === 'fr' ? 'Prendre une photo' : 'Take a photo',
          ],
          cancelButtonIndex: 0,
        },
        async (idx) => {
          if (idx === 1) await uploadAvatar('library');
          if (idx === 2) await uploadAvatar('camera');
        }
      );
    } else {
      Alert.alert(
        lang === 'fr' ? 'Photo de profil' : 'Profile picture',
        '',
        [
          { text: lang === 'fr' ? 'Galerie' : 'Gallery', onPress: () => uploadAvatar('library') },
          { text: lang === 'fr' ? 'Caméra' : 'Camera', onPress: () => uploadAvatar('camera') },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  };

  const uploadAvatar = async (source) => {
    setUploading(true);
    try {
      const asset = source === 'camera'
        ? await cloudinaryService.takePhoto({ aspect: [1, 1] })
        : await cloudinaryService.pickImage({ aspect: [1, 1] });

      if (!asset) { setUploading(false); return; }

      const result = await cloudinaryService.uploadToCloudinary(
        asset.uri,
        AVATAR_FOLDERS.avatar
      );

      // Update user profile with new avatar URL
      await api.patch('/users/profile', { avatarUrl: result.url });
      await refreshUser();
      Alert.alert('✅', lang === 'fr' ? 'Photo de profil mise à jour !' : 'Profile picture updated!');
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally { setUploading(false); }
  };

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
    Alert.alert(
      t('auth.logout'),
      lang === 'fr' ? 'Tu vas être déconnecté.' : 'You will be logged out.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: logout }
      ]
    );
  };

  const nextRank = RANKS[RANKS.findIndex(r => r.key === user?.rank) + 1];
  const kiToNext = nextRank ? nextRank.ki - (user?.ki || 0) : 0;
  const kiProgress = () => {
    const idx = RANKS.findIndex(r => r.key === user?.rank);
    const cur = RANKS[idx]?.ki || 0;
    const next = RANKS[idx + 1]?.ki || 100000;
    return Math.min(((user?.ki || 0) - cur) / (next - cur), 1) * 100;
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero section */}
        <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.hero}>
          {/* Avatar with upload */}
          <TouchableOpacity onPress={handleAvatarUpload} style={s.avatarWrap} activeOpacity={0.8}>
            <View style={[s.avatarRing, { borderColor: rankInfo.color }]}>
              {user?.avatarUrl
                ? <Image source={{ uri: user.avatarUrl }} style={s.avatarImg} />
                : <Text style={s.avatarEmoji}>{rankInfo.icon}</Text>}
            </View>
            <View style={s.avatarEditBadge}>
              {uploading
                ? <ActivityIndicator size="small" color={COLORS.background} />
                : <Ionicons name="camera" size={12} color={COLORS.background} />}
            </View>
          </TouchableOpacity>

          <Text style={s.username}>{user?.username}</Text>
          <Text style={[s.rankLabel, { color: rankInfo.color }]}>{rankInfo.icon} {rankInfo.label}</Text>

          <View style={s.soulRow}>
            <Text style={[s.soulText, { color: soulInfo.color }]}>{soulInfo.icon} {soulInfo.label}</Text>
          </View>

          {/* KI + progress */}
          <View style={s.kiSection}>
            <Text style={s.kiVal}>{(user?.ki || 0).toLocaleString()} KI</Text>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${kiProgress()}%` }]} />
            </View>
            <Text style={s.progressHint}>
              {nextRank
                ? `${kiToNext.toLocaleString()} KI → ${nextRank.label}`
                : lang === 'fr' ? 'Rang maximum atteint !' : 'Max rank reached!'}
            </Text>
          </View>

          {/* Currencies */}
          <View style={s.currencies}>
            <View style={s.currency}>
              <Text style={s.currencyVal}>💎 {user?.ryu_coins || 0}</Text>
              <Text style={s.currencyLabel}>Ryū Coins</Text>
            </View>
            <View style={s.currencyDiv} />
            <View style={s.currency}>
              <Text style={s.currencyVal}>⚡ {user?.chakra || 0}</Text>
              <Text style={s.currencyLabel}>Chakra</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <Text style={s.sectionTitle}>{t('profile.stats').toUpperCase()}</Text>
        <View style={s.statsGrid}>
          {[
            { icon: '⚔️', val: user?.stats?.duels_played || 0, label: t('profile.duels') },
            { icon: '🏆', val: user?.stats?.duels_won || 0, label: t('profile.wins') },
            { icon: '📊', val: `${winRate}%`, label: t('profile.winrate') },
            { icon: '⚡', val: user?.stats?.perfect_victories || 0, label: t('profile.perfect') },
            { icon: '🔥', val: `${user?.stats?.streak || 0}j`, label: 'Streak' },
            { icon: '🎁', val: user?.stats?.gifts_sent || 0, label: lang === 'fr' ? 'Cadeaux' : 'Gifts' },
          ].map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={s.statVal}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Rank progression */}
        <Text style={s.sectionTitle}>PROGRESSION</Text>
        <View style={s.rankList}>
          {RANKS.map((r) => {
            const done = (user?.ki || 0) >= r.ki;
            const current = r.key === user?.rank;
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
          {[
            {
              icon: '🌐', label: t('common.language'),
              val: lang === 'fr' ? '🇫🇷 Français' : '🇺🇸 English',
              onPress: toggleLang,
              loading: langLoading,
            },
            {
              icon: '🔍', label: lang === 'fr' ? 'Rechercher un joueur' : 'Search a player',
              val: '›', onPress: () => navigation.navigate('Search'),
            },
            {
              icon: '🎵', label: lang === 'fr' ? 'Musique Anime' : 'Anime Music',
              val: '›', onPress: () => navigation.navigate('Music'),
            },
            {
              icon: '🛍️', label: t('shop.title'),
              val: '›', onPress: () => navigation.navigate('Shop'),
            },
            {
              icon: '🏟️', label: lang === 'fr' ? 'Mes Compétitions' : 'My Competitions',
              val: '›', onPress: () => navigation.navigate('Competitions'),
            },
            {
              icon: '🎓', label: lang === 'fr' ? 'Revoir le tutoriel' : 'Replay tutorial',
              val: '›', onPress: () => { resetOnboarding(); Alert.alert('', lang === 'fr' ? 'Tutoriel réinitialisé !' : 'Tutorial reset!'); },
            },
            ...(user?.isAdmin ? [{
              icon: '⛩️', label: 'Admin Panel',
              val: '›', onPress: () => navigation.navigate('AdminDashboard'),
            }] : []),
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.settingRow, i === 0 && s.settingRowFirst]}
              onPress={item.onPress}
            >
              <Text style={s.settingIcon}>{item.icon}</Text>
              <Text style={s.settingLabel}>{item.label}</Text>
              {item.loading
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={s.settingVal}>{item.val}</Text>}
            </TouchableOpacity>
          ))}
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
  hero: { paddingTop: 60, paddingBottom: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  avatarWrap: { position: 'relative', marginBottom: SPACING.xs },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarEmoji: { fontSize: 44 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background },
  username: { color: COLORS.text, fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  rankLabel: { fontSize: FONTS.sizes.md, fontWeight: '900', letterSpacing: 3 },
  soulRow: { flexDirection: 'row', alignItems: 'center' },
  soulText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  kiSection: { width: '80%', alignItems: 'center', gap: 4 },
  kiVal: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  progressBg: { width: '100%', height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressHint: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  currencies: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  currency: { alignItems: 'center' },
  currencyVal: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  currencyLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  currencyDiv: { width: 1, backgroundColor: COLORS.border },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, marginTop: SPACING.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { width: '30.5%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { fontSize: 20, marginBottom: 3 },
  statVal: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  statLabel: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  rankList: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rankItemActive: { backgroundColor: COLORS.surfaceLight },
  rankItemIcon: { fontSize: 22, width: 30 },
  rankItemInfo: { flex: 1 },
  rankItemLabel: { fontWeight: '900', fontSize: FONTS.sizes.sm },
  rankItemKI: { color: COLORS.textDim, fontSize: FONTS.sizes.xs },
  currentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  checkmark: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.md },
  settingsBox: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  settingRowFirst: { borderTopWidth: 0 },
  settingIcon: { fontSize: 20, marginRight: SPACING.sm },
  settingLabel: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '600' },
  settingVal: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  logoutBtn: { marginHorizontal: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.danger, alignItems: 'center', marginBottom: SPACING.md },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.md },
});
