import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList, Share, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../services/api';
import { generateLinks } from '../../services/deepLinks';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, SOULS } from '../../constants/ranks';

const compAPI = {
  list:       (p) => api.get('/competitions', { params: p }),
  mine:       ()  => api.get('/competitions/mine'),
  get:        (id)=> api.get(`/competitions/${id}`),
  getByCode:  (c) => api.get(`/competitions/invite/${c}`),
  create:     (d) => api.post('/competitions/create', d),
  join:       (id)=> api.post(`/competitions/${id}/join`),
  joinCode:   (c) => api.post(`/competitions/invite/${c}/join`),
  start:      (id)=> api.post(`/competitions/${id}/start`),
  cancel:     (id)=> api.post(`/competitions/${id}/cancel`),
  finish:     (id)=> api.post(`/competitions/${id}/finish`),
};

const TYPE_CONFIG = {
  solo_1v1:          { icon: '⚔️',  label: '1v1 Solo',      color: COLORS.secondary },
  solo_battle_royale:{ icon: '💥', label: 'Battle Royale', color: '#7C4DFF' },
  clan_war:          { icon: '🏯', label: 'Clan War',      color: COLORS.primary },
};

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon', color: COLORS.textMuted },
  open:      { label: 'Ouvert',    color: COLORS.success },
  ongoing:   { label: 'En cours',  color: COLORS.danger },
  finished:  { label: 'Terminé',   color: COLORS.textDim },
  cancelled: { label: 'Annulé',    color: COLORS.textDim },
};

export default function CompetitionScreen({ navigation }) {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [tab, setTab] = useState('browse');
  const [competitions, setCompetitions] = useState([]);
  const [myComps, setMyComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '', type: 'solo_1v1', soul: 'mixed',
    isPrivate: false, maxParticipants: '8',
    entryFeeKI: '0', description: '', rules: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [browse, mine] = await Promise.all([
        compAPI.list({ status: 'open', limit: 30 }),
        compAPI.mine(),
      ]);
      setCompetitions(browse.competitions || []);
      setMyComps(mine.competitions || []);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally { setLoading(false); }
  };

  const createComp = async () => {
    if (!form.name.trim()) return Alert.alert('', lang === 'fr' ? 'Nom requis' : 'Name required');
    setCreating(true);
    try {
      const data = await compAPI.create({
        ...form,
        maxParticipants: parseInt(form.maxParticipants) || 8,
        entryFeeKI: parseInt(form.entryFeeKI) || 0,
      });
      Alert.alert('✅', lang === 'fr' ? 'Compétition créée !' : 'Competition created!');
      setShowCreate(false);
      fetchAll();
      navigation.navigate('CompetitionDetail', { compId: data.competition._id });
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally { setCreating(false); }
  };

  const joinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoiningCode(true);
    try {
      const data = await compAPI.joinCode(joinCode.trim().toUpperCase());
      Alert.alert('✅', lang === 'fr' ? 'Rejoint !' : 'Joined!');
      fetchAll();
      navigation.navigate('CompetitionDetail', { compId: data.competition._id });
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally { setJoiningCode(false); setJoinCode(''); }
  };

  const joinComp = async (compId) => {
    try {
      await compAPI.join(compId);
      Alert.alert('✅', lang === 'fr' ? 'Inscrit !' : 'Joined!');
      fetchAll();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const renderCompCard = ({ item: c }) => {
    const tc = TYPE_CONFIG[c.type] || TYPE_CONFIG.solo_1v1;
    const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
    const isCreator = c.createdBy?._id === user?._id || c.createdBy === user?._id;
    const isParticipant = c.participants?.some(p => p.user === user?._id || p.user?._id === user?._id);
    const spotsLeft = (c.maxParticipants || 8) - (c.participants?.length || 0);

    return (
      <TouchableOpacity
        style={s.compCard}
        onPress={() => navigation.navigate('CompetitionDetail', { compId: c._id })}
      >
        <View style={s.compCardHeader}>
          <View style={[s.typeBadge, { borderColor: tc.color }]}>
            <Text style={[s.typeText, { color: tc.color }]}>{tc.icon} {tc.label}</Text>
          </View>
          <View style={s.statusBadge}>
            <View style={[s.statusDot, { backgroundColor: sc.color }]} />
            <Text style={[s.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <Text style={s.compName}>{c.name}</Text>
        <Text style={s.compCreator}>
          par {c.creatorUsername || c.createdBy?.username}
          {c.soul !== 'mixed' && ` · ${SOULS.find(s => s.key === c.soul)?.icon} ${SOULS.find(s => s.key === c.soul)?.label}`}
        </Text>

        <View style={s.compStats}>
          <View style={s.compStat}>
            <Text style={s.compStatVal}>{c.participants?.length || 0}/{c.maxParticipants}</Text>
            <Text style={s.compStatLabel}>{lang === 'fr' ? 'Joueurs' : 'Players'}</Text>
          </View>
          {c.entryFeeKI > 0 && (
            <View style={s.compStat}>
              <Text style={[s.compStatVal, { color: COLORS.primary }]}>⚡ {c.entryFeeKI}</Text>
              <Text style={s.compStatLabel}>Entry</Text>
            </View>
          )}
          {c.prizePoolKI > 0 && (
            <View style={s.compStat}>
              <Text style={[s.compStatVal, { color: COLORS.gold }]}>🏆 {c.prizePoolKI}</Text>
              <Text style={s.compStatLabel}>Prize</Text>
            </View>
          )}
          <View style={s.compStat}>
            <Text style={s.compStatVal}>{spotsLeft}</Text>
            <Text style={s.compStatLabel}>{lang === 'fr' ? 'Places' : 'Spots'}</Text>
          </View>
        </View>

        {c.status === 'open' && !isParticipant && spotsLeft > 0 && (
          <TouchableOpacity style={s.joinBtn} onPress={() => joinComp(c._id)}>
            <Text style={s.joinBtnText}>
              {c.entryFeeKI > 0 ? `⚡ ${c.entryFeeKI} KI — ` : ''}
              {lang === 'fr' ? 'Rejoindre' : 'Join'}
            </Text>
          </TouchableOpacity>
        )}
        {isParticipant && (
          <View style={s.participantBadge}>
            <Text style={s.participantText}>✅ {lang === 'fr' ? 'Inscrit' : 'Joined'}</Text>
          </View>
        )}
        {isCreator && <Text style={s.creatorBadge}>👑 {lang === 'fr' ? 'Tu as créé' : 'You created'}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🏟️ {lang === 'fr' ? 'COMPÉTITIONS' : 'COMPETITIONS'}</Text>
        <TouchableOpacity style={s.createChip} onPress={() => setShowCreate(true)}>
          <Text style={s.createChipText}>+ {lang === 'fr' ? 'Créer' : 'Create'}</Text>
        </TouchableOpacity>
      </View>

      {/* Join by code */}
      <View style={s.codeRow}>
        <TextInput
          style={s.codeInput}
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder={lang === 'fr' ? 'Code d\'invitation (ex: COMPAB1234)' : 'Invite code (ex: COMPAB1234)'}
          placeholderTextColor={COLORS.textDim}
          autoCapitalize="characters"
          maxLength={12}
        />
        <TouchableOpacity style={s.codeBtn} onPress={joinByCode} disabled={joiningCode || !joinCode.trim()}>
          {joiningCode
            ? <ActivityIndicator size="small" color={COLORS.background} />
            : <Text style={s.codeBtnText}>{lang === 'fr' ? 'Rejoindre' : 'Join'}</Text>}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['browse', 'mine'].map(tb => (
          <TouchableOpacity key={tb} style={[s.tab, tab === tb && s.tabActive]} onPress={() => setTab(tb)}>
            <Text style={[s.tabText, tab === tb && s.tabTextActive]}>
              {tb === 'browse'
                ? (lang === 'fr' ? '🌍 Explorer' : '🌍 Browse')
                : (lang === 'fr' ? '🎯 Mes Comps' : '🎯 My Comps')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={tab === 'browse' ? competitions : myComps}
          keyExtractor={c => c._id}
          contentContainerStyle={s.list}
          renderItem={renderCompCard}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🏟️</Text>
              <Text style={s.emptyText}>
                {tab === 'browse'
                  ? (lang === 'fr' ? 'Aucune compétition ouverte' : 'No open competitions')
                  : (lang === 'fr' ? 'Tu n\'as pas encore de compétition' : 'No competitions yet')}
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
                <Text style={s.emptyBtnText}>+ {lang === 'fr' ? 'Créer la première' : 'Create the first'}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🏟️ {lang === 'fr' ? 'Créer une compétition' : 'Create competition'}</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.formLabel}>{lang === 'fr' ? 'Nom de la compétition' : 'Competition name'} *</Text>
              <TextInput style={s.formInput} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="Ex: Tournoi Naruto S1" placeholderTextColor={COLORS.textDim} maxLength={50} />

              <Text style={s.formLabel}>{lang === 'fr' ? 'Type' : 'Type'}</Text>
              <View style={s.typeRow}>
                {Object.entries(TYPE_CONFIG).map(([key, tc]) => (
                  <TouchableOpacity key={key}
                    style={[s.typeChip, form.type === key && { borderColor: tc.color, backgroundColor: tc.color + '22' }]}
                    onPress={() => setForm(f => ({ ...f, type: key }))}>
                    <Text style={{ fontSize: 16 }}>{tc.icon}</Text>
                    <Text style={[s.typeChipText, form.type === key && { color: tc.color }]}>{tc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>{lang === 'fr' ? 'Catégorie Âme' : 'Soul Category'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                {[{ key: 'mixed', icon: '🎲', label: 'Mixed' }, ...SOULS].map(s2 => (
                  <TouchableOpacity key={s2.key}
                    style={[s.soulChip, form.soul === s2.key && s.soulChipActive]}
                    onPress={() => setForm(f => ({ ...f, soul: s2.key }))}>
                    <Text style={{ fontSize: 14 }}>{s2.icon}</Text>
                    <Text style={[s.soulChipText, form.soul === s2.key && { color: COLORS.primary }]}>{s2.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>{lang === 'fr' ? 'Max joueurs' : 'Max players'}</Text>
                  <TextInput style={s.formInput} value={form.maxParticipants}
                    onChangeText={v => setForm(f => ({ ...f, maxParticipants: v }))}
                    keyboardType="number-pad" maxLength={2} placeholder="8" placeholderTextColor={COLORS.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>{lang === 'fr' ? 'Entry KI' : 'Entry KI'}</Text>
                  <TextInput style={s.formInput} value={form.entryFeeKI}
                    onChangeText={v => setForm(f => ({ ...f, entryFeeKI: v }))}
                    keyboardType="number-pad" placeholder="0" placeholderTextColor={COLORS.textDim} />
                </View>
              </View>

              <Text style={s.formLabel}>{lang === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}</Text>
              <TextInput style={[s.formInput, { height: 70, textAlignVertical: 'top' }]}
                value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
                multiline maxLength={200} placeholder={lang === 'fr' ? 'Décris ta compétition...' : 'Describe...'}
                placeholderTextColor={COLORS.textDim} />

              {/* Private toggle */}
              <TouchableOpacity style={s.toggleRow} onPress={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}>
                <View style={[s.toggle, form.isPrivate && s.toggleActive]}>
                  <View style={[s.toggleThumb, form.isPrivate && s.toggleThumbActive]} />
                </View>
                <Text style={s.toggleLabel}>
                  {lang === 'fr'
                    ? (form.isPrivate ? '🔒 Privé (code d\'invitation uniquement)' : '🌍 Public (visible par tous)')
                    : (form.isPrivate ? '🔒 Private (invite code only)' : '🌍 Public (visible to all)')}
                </Text>
              </TouchableOpacity>

              {parseInt(form.entryFeeKI) > 0 && (
                <View style={s.entryInfo}>
                  <Text style={s.entryInfoText}>
                    💡 {lang === 'fr'
                      ? `Prize Pool = ${parseInt(form.entryFeeKI) * parseInt(form.maxParticipants || 8)} KI max`
                      : `Prize Pool = ${parseInt(form.entryFeeKI) * parseInt(form.maxParticipants || 8)} KI max`}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={s.createBtn} onPress={createComp} disabled={creating}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.createBtnGrad}>
                  {creating
                    ? <ActivityIndicator color={COLORS.background} />
                    : <Text style={s.createBtnText}>🏟️ {lang === 'fr' ? 'CRÉER' : 'CREATE'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  createChip: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  createChipText: { color: COLORS.background, fontWeight: '900', fontSize: 13 },
  codeRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
  codeInput: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: 12, borderWidth: 1, borderColor: COLORS.border },
  codeBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, justifyContent: 'center' },
  codeBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  list: { padding: SPACING.lg, gap: SPACING.md },
  empty: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  emptyBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 13 },
  compCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  compCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  typeBadge: { borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  typeText: { fontSize: 10, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  compName: { color: COLORS.text, fontWeight: '900', fontSize: 16, marginBottom: 2 },
  compCreator: { color: COLORS.textMuted, fontSize: 11, marginBottom: SPACING.md },
  compStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  compStat: { alignItems: 'center' },
  compStatVal: { color: COLORS.text, fontWeight: '900', fontSize: 14 },
  compStatLabel: { color: COLORS.textMuted, fontSize: 10 },
  joinBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  joinBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 13 },
  participantBadge: { borderWidth: 1, borderColor: COLORS.success, borderRadius: RADIUS.md, paddingVertical: SPACING.xs, alignItems: 'center' },
  participantText: { color: COLORS.success, fontWeight: '700', fontSize: 12 },
  creatorBadge: { color: COLORS.primary, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalBox: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  formLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: SPACING.sm },
  formInput: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeChip: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceLight },
  typeChipText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  soulChip: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceLight },
  soulChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  soulChipText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, marginTop: SPACING.sm },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, padding: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.textMuted },
  toggleThumbActive: { backgroundColor: COLORS.background, marginLeft: 20 },
  toggleLabel: { color: COLORS.text, fontSize: 12, flex: 1 },
  entryInfo: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  entryInfoText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  createBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md, marginBottom: SPACING.xl },
  createBtnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  createBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 15, letterSpacing: 2 },
});
