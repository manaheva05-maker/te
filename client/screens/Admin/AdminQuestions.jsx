import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { adminAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { SOULS } from '../../constants/ranks';

export default function AdminQuestions() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genModal, setGenModal] = useState(false);
  const [genAnime, setGenAnime] = useState('');
  const [genSoul, setGenSoul] = useState('shonen');
  const [genDiff, setGenDiff] = useState('5');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.pendingQ();
      setPending(data.questions || []);
    } catch {}
    setLoading(false);
  };

  const validate = async (id) => {
    try {
      await adminAPI.validateQ(id);
      setPending(prev => prev.filter(q => q._id !== id));
      Alert.alert('✅', 'Question validée');
    } catch (err) { Alert.alert('Erreur', err.message); }
  };

  const generate = async () => {
    if (!genAnime.trim()) return Alert.alert('', 'Anime requis');
    setGenerating(true);
    try {
      const data = await adminAPI.generateQ({ anime: genAnime.trim(), soul: genSoul, difficulty: parseInt(genDiff) });
      Alert.alert('✅', `Question générée: "${data.question?.text?.fr?.substring(0, 50)}..."`);
      setGenModal(false);
      fetchPending();
    } catch (err) { Alert.alert('Erreur IA', err.message); }
    setGenerating(false);
  };

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>❓ Questions en attente ({pending.length})</Text>
        <TouchableOpacity style={s.genBtn} onPress={() => setGenModal(true)}>
          <Text style={s.genBtnText}>🤖 Générer</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={s.loading} color={COLORS.primary} /> : (
        <FlatList
          data={pending}
          keyExtractor={q => q._id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>Aucune question en attente ✅</Text>}
          renderItem={({ item: q }) => (
            <View style={s.qCard}>
              <View style={s.qMeta}>
                <Text style={s.qAnime}>{q.anime}</Text>
                <Text style={s.qDiff}>Diff: {q.difficulty}/10</Text>
                <Text style={s.qSoul}>{q.soul}</Text>
              </View>
              <Text style={s.qText}>{q.text?.fr}</Text>
              {q.options?.map((opt, i) => (
                <Text key={i} style={[s.qOpt, i === q.correct_index && s.qOptCorrect]}>
                  {['A','B','C','D'][i]}. {opt.fr}
                </Text>
              ))}
              <View style={s.qActions}>
                <TouchableOpacity style={s.validateBtn} onPress={() => validate(q._id)}>
                  <Text style={s.validateText}>✅ Valider</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => setPending(prev => prev.filter(x => x._id !== q._id))}>
                  <Text style={s.rejectText}>❌ Rejeter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Generate modal */}
      <Modal visible={genModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <LinearGradient colors={['#1A1A2E','#12121A']} style={s.modalBox}>
            <Text style={s.modalTitle}>🤖 Générer via Sensei AI</Text>
            <TextInput style={s.modalInput} value={genAnime} onChangeText={setGenAnime}
              placeholder="Anime (ex: Naruto)" placeholderTextColor={COLORS.textDim} />
            <TextInput style={s.modalInput} value={genDiff} onChangeText={setGenDiff}
              placeholder="Difficulté (1-10)" placeholderTextColor={COLORS.textDim} keyboardType="number-pad" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.soulScroll}>
              {SOULS.map(soul => (
                <TouchableOpacity key={soul.key} style={[s.soulChip, genSoul === soul.key && s.soulChipActive]}
                  onPress={() => setGenSoul(soul.key)}>
                  <Text style={s.soulChipText}>{soul.icon} {soul.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setGenModal(false)}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalGenerate} onPress={generate} disabled={generating}>
                {generating ? <ActivityIndicator color={COLORS.background} /> : <Text style={s.modalGenerateText}>Générer</Text>}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  title: { flex: 1, color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  genBtn: { backgroundColor: COLORS.info, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full },
  genBtnText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.xs },
  loading: { marginTop: SPACING.xl },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  qCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  qMeta: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  qAnime: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.xs },
  qDiff: { color: COLORS.warning, fontSize: FONTS.sizes.xs },
  qSoul: { color: COLORS.info, fontSize: FONTS.sizes.xs },
  qText: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm, lineHeight: 20 },
  qOpt: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, paddingVertical: 2 },
  qOptCorrect: { color: COLORS.success, fontWeight: '700' },
  qActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  validateBtn: { flex: 1, backgroundColor: COLORS.success + '22', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.success },
  validateText: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.xs },
  rejectBtn: { flex: 1, backgroundColor: COLORS.danger + '22', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  rejectText: { color: COLORS.danger, fontWeight: '900', fontSize: FONTS.sizes.xs },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, gap: SPACING.md },
  modalTitle: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900', marginBottom: SPACING.sm },
  modalInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  soulScroll: { marginVertical: SPACING.sm },
  soulChip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  soulChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  soulChipText: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: SPACING.md },
  modalCancel: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontWeight: '700' },
  modalGenerate: { flex: 1, backgroundColor: COLORS.info, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  modalGenerateText: { color: COLORS.text, fontWeight: '900' },
});
