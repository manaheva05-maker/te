import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { clanAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const COLOR_OPTIONS = [
  { primary: '#C9A227', secondary: '#8B0000' },
  { primary: '#3498DB', secondary: '#1A1A2E' },
  { primary: '#2ECC71', secondary: '#1A2E1A' },
  { primary: '#9B59B6', secondary: '#2E1A2E' },
  { primary: '#E74C3C', secondary: '#2E0A0A' },
  { primary: '#F39C12', secondary: '#2E1A0A' },
];

export default function ClanCreateScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !tag.trim()) return Alert.alert('', 'Nom et tag requis');
    if (tag.length > 4) return Alert.alert('', 'Tag max 4 caractères');
    setLoading(true);
    try {
      await clanAPI.create({ name: name.trim(), tag: tag.trim().toUpperCase(), description, colors });
      await refreshUser();
      Alert.alert('✅', 'Clan créé !');
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>🏯 {t('clan.create')}</Text>

        <View style={s.form}>
          <Text style={s.label}>{t('clan.name')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} maxLength={30}
            placeholder="Ex: Les Shinigami" placeholderTextColor={COLORS.textDim} />

          <Text style={s.label}>{t('clan.tag')}</Text>
          <TextInput style={s.input} value={tag} onChangeText={t => setTag(t.toUpperCase())}
            maxLength={4} placeholder="SHIN" placeholderTextColor={COLORS.textDim}
            autoCapitalize="characters" />

          <Text style={s.label}>{t('clan.description')}</Text>
          <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription}
            maxLength={200} multiline numberOfLines={3}
            placeholder="Décris ton clan..." placeholderTextColor={COLORS.textDim} />

          <Text style={s.label}>Couleurs du clan</Text>
          <View style={s.colorGrid}>
            {COLOR_OPTIONS.map((c, i) => (
              <TouchableOpacity key={i} style={[s.colorOption, colors === c && s.colorSelected]}
                onPress={() => setColors(c)}>
                <View style={[s.colorDot, { backgroundColor: c.primary }]} />
                <View style={[s.colorDot, { backgroundColor: c.secondary }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={[s.preview, { borderColor: colors.primary }]}>
          <Text style={[s.previewTag, { color: colors.primary }]}>[{tag || 'TAG'}]</Text>
          <Text style={s.previewName}>{name || 'Nom du clan'}</Text>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.btnGrad}>
            {loading ? <ActivityIndicator color={COLORS.background} />
              : <Text style={s.btnText}>CRÉER LE CLAN</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: SPACING.lg, paddingTop: 60 },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', marginBottom: SPACING.xl },
  form: { gap: SPACING.md, marginBottom: SPACING.lg },
  label: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 1 },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  colorGrid: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  colorOption: { flexDirection: 'row', gap: 4, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border },
  colorSelected: { borderColor: COLORS.primary },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  preview: { padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 2, alignItems: 'center', marginBottom: SPACING.xl, backgroundColor: COLORS.surface },
  previewTag: { fontSize: FONTS.sizes.xl, fontWeight: '900', letterSpacing: 3 },
  previewName: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700', marginTop: 4 },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  btnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
});
