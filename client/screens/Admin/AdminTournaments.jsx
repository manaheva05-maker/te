// AdminTournaments.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { adminAPI, tournamentAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name_fr: '', name_en: '', type: 'mondial', season: 'Saison 1', entryFee: '500', maxClans: '64' });

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentAPI.list();
      setTournaments(data.tournaments || []);
    } catch {}
    setLoading(false);
  };

  const createTournament = async () => {
    if (!form.name_fr) return Alert.alert('', 'Nom requis');
    setCreating(true);
    try {
      const now = new Date();
      await adminAPI.createTournament({
        ...form,
        entryFee: parseInt(form.entryFee),
        maxClans: parseInt(form.maxClans),
        registrationStart: now.toISOString(),
        registrationEnd: new Date(now.getTime() + 7 * 86400000).toISOString(),
        startDate: new Date(now.getTime() + 8 * 86400000).toISOString(),
        endDate: new Date(now.getTime() + 10 * 86400000).toISOString(),
      });
      Alert.alert('✅', 'Tournoi créé');
      fetchTournaments();
    } catch (err) { Alert.alert('Erreur', err.message); }
    setCreating(false);
  };

  const generateBracket = async (id) => {
    try {
      await adminAPI.generateBracket(id);
      Alert.alert('✅', 'Bracket généré !');
      fetchTournaments();
    } catch (err) { Alert.alert('Erreur', err.message); }
  };

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Create form */}
        <Text style={s.sectionTitle}>CRÉER UN TOURNOI</Text>
        <View style={s.form}>
          <TextInput style={s.input} value={form.name_fr} onChangeText={v => setForm({...form, name_fr: v})} placeholder="Nom (FR)" placeholderTextColor={COLORS.textDim} />
          <TextInput style={s.input} value={form.name_en} onChangeText={v => setForm({...form, name_en: v})} placeholder="Name (EN)" placeholderTextColor={COLORS.textDim} />
          <View style={s.row}>
            {['local','regional','mondial'].map(type => (
              <TouchableOpacity key={type} style={[s.typeBtn, form.type === type && s.typeBtnActive]} onPress={() => setForm({...form, type})}>
                <Text style={[s.typeBtnText, form.type === type && { color: COLORS.primary }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} value={form.entryFee} onChangeText={v => setForm({...form, entryFee: v})} placeholder="Entry Fee RC" placeholderTextColor={COLORS.textDim} keyboardType="number-pad" />
          <TouchableOpacity style={s.createBtn} onPress={createTournament} disabled={creating}>
            {creating ? <ActivityIndicator color={COLORS.background} /> : <Text style={s.createBtnText}>CRÉER</Text>}
          </TouchableOpacity>
        </View>

        {/* List */}
        <Text style={s.sectionTitle}>TOURNOIS ({tournaments.length})</Text>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : tournaments.map(t => (
          <View key={t._id} style={s.tCard}>
            <Text style={s.tName}>{t.name?.fr}</Text>
            <Text style={s.tMeta}>{t.type.toUpperCase()} · {t.status} · {t.registeredClans?.length || 0}/{t.maxClans} clans</Text>
            {t.status === 'registration' && (
              <TouchableOpacity style={s.bracketBtn} onPress={() => generateBracket(t._id)}>
                <Text style={s.bracketBtnText}>⚡ Générer Bracket</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────

export function AdminLive() {
  const [clan1Id, setClan1Id] = useState('');
  const [clan2Id, setClan2Id] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [activeMatch, setActiveMatch] = useState(null);
  const [creating, setCreating] = useState(false);

  const createLive = async () => {
    if (!clan1Id || !clan2Id || !tournamentId) return Alert.alert('', 'Remplis tous les champs');
    setCreating(true);
    try {
      const data = await adminAPI.createLive({ clan1Id, clan2Id, tournamentId });
      setActiveMatch(data.live);
      Alert.alert('✅', 'Live créé !');
    } catch (err) { Alert.alert('Erreur', err.message); }
    setCreating(false);
  };

  const setStatus = async (status) => {
    if (!activeMatch) return;
    try {
      const data = await adminAPI.setLiveStatus(activeMatch._id, status);
      setActiveMatch(data.live);
      Alert.alert('✅', `Status → ${status}`);
    } catch (err) { Alert.alert('Erreur', err.message); }
  };

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>CRÉER UN LIVE MATCH</Text>
        <View style={s.form}>
          <TextInput style={s.input} value={tournamentId} onChangeText={setTournamentId} placeholder="Tournament ID" placeholderTextColor={COLORS.textDim} />
          <TextInput style={s.input} value={clan1Id} onChangeText={setClan1Id} placeholder="Clan 1 ID" placeholderTextColor={COLORS.textDim} />
          <TextInput style={s.input} value={clan2Id} onChangeText={setClan2Id} placeholder="Clan 2 ID" placeholderTextColor={COLORS.textDim} />
          <TouchableOpacity style={s.createBtn} onPress={createLive} disabled={creating}>
            {creating ? <ActivityIndicator color={COLORS.background} /> : <Text style={s.createBtnText}>CRÉER LE LIVE</Text>}
          </TouchableOpacity>
        </View>

        {activeMatch && (
          <>
            <Text style={s.sectionTitle}>LIVE EN COURS</Text>
            <View style={s.tCard}>
              <Text style={s.tName}>Match: {activeMatch._id?.slice(-8)}</Text>
              <Text style={[s.tMeta, { color: activeMatch.status === 'live' ? COLORS.danger : COLORS.textMuted }]}>
                Status: {activeMatch.status?.toUpperCase()}
              </Text>
              <View style={s.row}>
                <TouchableOpacity style={[s.statusBtn, { borderColor: COLORS.success }]} onPress={() => setStatus('live')}>
                  <Text style={[s.statusBtnText, { color: COLORS.success }]}>▶ START</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.statusBtn, { borderColor: COLORS.danger }]} onPress={() => setStatus('finished')}>
                  <Text style={[s.statusBtnText, { color: COLORS.danger }]}>■ END</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  content: { padding: SPACING.lg },
  sectionTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.md, marginTop: SPACING.sm },
  form: { gap: SPACING.sm, marginBottom: SPACING.xl },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.sm, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: FONTS.sizes.xs },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  createBtnText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  tCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, gap: SPACING.sm },
  tName: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  tMeta: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  bracketBtn: { backgroundColor: COLORS.warning + '22', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.warning },
  bracketBtnText: { color: COLORS.warning, fontWeight: '900', fontSize: FONTS.sizes.xs },
  statusBtn: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  statusBtnText: { fontWeight: '900', fontSize: FONTS.sizes.sm },
});

export default AdminTournaments;
