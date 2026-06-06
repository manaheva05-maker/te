import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const { width } = Dimensions.get('window');

// ─── REGION DATA ──────────────────────────────────────────────
const REGIONS = [
  {
    key: 'europe',
    name: 'Europe',
    flag: '🇪🇺',
    color: '#003087',
    accentColor: '#FFD700',
    languages: [
      { code: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷' },
      { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
      { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
      { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
      { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
      { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
    ],
  },
  {
    key: 'americas',
    name: 'Amériques',
    flag: '🌎',
    color: '#0A6E4A',
    accentColor: '#F5A623',
    languages: [
      { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', native: 'Español', flag: '🇲🇽' },
      { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
      { code: 'fr', name: 'French', native: 'Français', flag: '🇭🇹' },
    ],
  },
  {
    key: 'asia',
    name: 'Asie',
    flag: '🌏',
    color: '#C0392B',
    accentColor: '#FFD700',
    languages: [
      { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
      { code: 'en', name: 'English', native: 'English', flag: '🇸🇬' },
      { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
      { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
      { code: 'id', name: 'Indonesian', native: 'Bahasa', flag: '🇮🇩' },
    ],
  },
  {
    key: 'africa',
    name: 'Afrique',
    flag: '🌍',
    color: '#27AE60',
    accentColor: '#F39C12',
    languages: [
      { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
      { code: 'en', name: 'English', native: 'English', flag: '🇳🇬' },
      { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇲🇦' },
      { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
      { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇦🇴' },
      { code: 'ha', name: 'Hausa', native: 'Hausa', flag: '🇳🇪' },
      { code: 'wo', name: 'Wolof', native: 'Wolof', flag: '🇸🇳' },
    ],
  },
];

// ─── REGION SVG MAP ICON ─────────────────────────────────────
function RegionIcon({ regionKey, size = 48, color, active }) {
  const c = active ? color : COLORS.textMuted;
  switch (regionKey) {
    case 'europe':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Defs>
            <SvgGradient id={`grad_eu_${active}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={active ? '#FFD700' : '#666'} />
              <Stop offset="1" stopColor={active ? color : '#444'} />
            </SvgGradient>
          </Defs>
          <Circle cx="24" cy="24" r="20" fill="none" stroke={`url(#grad_eu_${active})`} strokeWidth="2"/>
          {/* EU stars */}
          {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = 24 + 13 * Math.cos(angle);
            const y = 24 + 13 * Math.sin(angle);
            return <Circle key={i} cx={x} cy={y} r={active ? 2 : 1.5} fill={active ? '#FFD700' : '#888'} />;
          })}
        </Svg>
      );
    case 'americas':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="20" fill="none" stroke={c} strokeWidth="2"/>
          {/* Simplified America shape */}
          <Path d="M16 10 C14 12 12 16 13 20 C14 24 16 26 15 30 C14 34 16 38 18 40 C22 36 24 32 22 28 C20 24 22 20 24 16 C22 12 19 9 16 10Z"
            fill={active ? color : '#555'} opacity="0.7"/>
          <Path d="M22 16 C24 14 27 13 29 15 C31 17 30 22 28 26 C26 30 26 34 28 38 C25 37 23 34 24 30 C25 26 24 22 22 16Z"
            fill={active ? color : '#555'} opacity="0.5"/>
        </Svg>
      );
    case 'asia':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="20" fill="none" stroke={c} strokeWidth="2"/>
          {/* Simplified Asia/circle pattern */}
          <Path d="M28 10 C32 12 36 16 37 22 C38 28 35 33 30 36 C25 39 19 38 15 34 C11 30 11 23 14 18 C17 13 23 10 28 10Z"
            fill={active ? color : '#555'} opacity="0.6"/>
          <Circle cx="26" cy="20" r="4" fill={active ? '#FFD700' : '#777'}/>
          <Path d="M18 28 C22 32 28 32 32 28" stroke={active ? '#FFD700' : '#666'} strokeWidth="1.5" fill="none"/>
        </Svg>
      );
    case 'africa':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Circle cx="24" cy="24" r="20" fill="none" stroke={c} strokeWidth="2"/>
          {/* Africa shape */}
          <Path d="M20 10 C24 9 28 10 30 13 C32 16 32 20 31 23 C33 25 34 28 32 32 C30 36 26 40 22 40 C18 40 15 37 14 33 C13 29 15 25 14 21 C13 17 15 12 20 10Z"
            fill={active ? color : '#555'} opacity="0.7"/>
          <Ellipse cx="24" cy="27" rx="5" ry="8" fill={active ? '#F39C12' : '#666'} opacity="0.4"/>
        </Svg>
      );
    default:
      return null;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function RegionLanguageScreen({ onComplete }) {
  const [step, setStep] = useState('region'); // region | language | confirm
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLang, setSelectedLang] = useState(null);
  const [customLang, setCustomLang] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  const region = REGIONS.find(r => r.key === selectedRegion);

  const handleRegionSelect = (regionKey) => {
    setSelectedRegion(regionKey);
    setSelectedLang(null);
    setStep('language');
  };

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedRegion || !selectedLang) return;
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // simulate API
      onComplete?.({ region: selectedRegion, language: selectedLang });
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally { setSaving(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A', '#0A0A0F']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        {step !== 'region' && (
          <TouchableOpacity onPress={() => setStep(step === 'confirm' ? 'language' : 'region')} style={s.backBtn}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            {step === 'region' ? '🌍 Ta région' : step === 'language' ? '💬 Ta langue' : '✅ Confirmation'}
          </Text>
          <Text style={s.headerSub}>
            {step === 'region'
              ? 'Les questions s\'adapiteront à ta région'
              : step === 'language'
              ? 'Toutes les questions seront dans cette langue'
              : 'C\'est parti !'}
          </Text>
        </View>
        {/* Progress dots */}
        <View style={s.progressDots}>
          {['region','language','confirm'].map((s2, i) => (
            <View key={i} style={[s.dot, step === s2 && s.dotActive,
              ['region','language','confirm'].indexOf(step) > i && s.dotDone]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: REGION ── */}
        {step === 'region' && (
          <View style={s.regionGrid}>
            {REGIONS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[s.regionCard, selectedRegion === r.key && { borderColor: r.accentColor, backgroundColor: r.color + '22' }]}
                onPress={() => handleRegionSelect(r.key)}
                activeOpacity={0.8}
              >
                <View style={s.regionIconWrap}>
                  <RegionIcon regionKey={r.key} size={56} color={r.color} active={true} />
                </View>
                <Text style={s.regionFlag}>{r.flag}</Text>
                <Text style={[s.regionName, { color: r.color }]}>{r.name}</Text>
                <Text style={s.regionLangCount}>{r.languages.length} langues</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── STEP 2: LANGUAGE ── */}
        {step === 'language' && region && (
          <View>
            <View style={s.regionPreview}>
              <RegionIcon regionKey={region.key} size={40} color={region.color} active={true} />
              <View>
                <Text style={[s.regionPreviewName, { color: region.color }]}>{region.flag} {region.name}</Text>
                <Text style={s.regionPreviewSub}>Choisir ta langue</Text>
              </View>
            </View>

            <View style={s.langGrid}>
              {region.languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[s.langCard, selectedLang?.code === lang.code && { borderColor: region.color, backgroundColor: region.color + '22' }]}
                  onPress={() => handleLangSelect(lang)}
                  activeOpacity={0.8}
                >
                  <Text style={s.langFlag}>{lang.flag}</Text>
                  <Text style={s.langNative}>{lang.native}</Text>
                  <Text style={s.langName}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom language input */}
            <TouchableOpacity style={s.customToggle} onPress={() => setShowCustom(!showCustom)}>
              <Text style={s.customToggleText}>
                {showCustom ? '▲' : '▼'} Ma langue n'est pas listée
              </Text>
            </TouchableOpacity>

            {showCustom && (
              <View style={s.customInputWrap}>
                <TextInput
                  style={s.customInput}
                  value={customLang}
                  onChangeText={setCustomLang}
                  placeholder="Ex: Hausa, Wolof, Tigrinya..."
                  placeholderTextColor={COLORS.textDim}
                  autoCapitalize="words"
                />
                {customLang.trim().length > 1 && (
                  <TouchableOpacity style={s.customConfirmBtn} onPress={() => {
                    handleLangSelect({ code: customLang.toLowerCase().slice(0,5), name: customLang, native: customLang, flag: '🌐' });
                  }}>
                    <Text style={s.customConfirmText}>Utiliser "{customLang}"</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 'confirm' && selectedLang && region && (
          <View style={s.confirmWrap}>
            <View style={s.confirmCard}>
              <RegionIcon regionKey={region.key} size={64} color={region.color} active={true} />
              <Text style={[s.confirmRegion, { color: region.color }]}>{region.flag} {region.name}</Text>
              <View style={s.confirmLang}>
                <Text style={s.confirmLangFlag}>{selectedLang.flag}</Text>
                <Text style={s.confirmLangName}>{selectedLang.native}</Text>
              </View>
            </View>

            <View style={s.confirmInfo}>
              <View style={s.confirmInfoRow}>
                <Text style={s.confirmInfoIcon}>🤖</Text>
                <Text style={s.confirmInfoText}>
                  Le Sensei AI détectera ta langue automatiquement et affichera les questions en {selectedLang.native}
                </Text>
              </View>
              <View style={s.confirmInfoRow}>
                <Text style={s.confirmInfoIcon}>⚔️</Text>
                <Text style={s.confirmInfoText}>
                  En duel, chaque joueur voit les questions dans SA langue. Même question, langues différentes.
                </Text>
              </View>
              <View style={s.confirmInfoRow}>
                <Text style={s.confirmInfoIcon}>🔄</Text>
                <Text style={s.confirmInfoText}>
                  Tu pourras changer ta langue à tout moment dans les paramètres.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} disabled={saving}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.confirmBtnGrad}>
                {saving
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={s.confirmBtnText}>⛩️ COMMENCER SHINKEN</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  backBtn: { marginBottom: SPACING.sm },
  backBtnText: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  headerCenter: { alignItems: 'center', marginBottom: SPACING.md },
  headerTitle: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 2 },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: 4 },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  dotDone: { backgroundColor: COLORS.primary + '88' },
  content: { paddingHorizontal: SPACING.lg },

  // Region grid
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'center' },
  regionCard: { width: (width - SPACING.lg * 2 - SPACING.md) / 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, borderWidth: 2, borderColor: COLORS.border },
  regionIconWrap: { marginBottom: SPACING.xs },
  regionFlag: { fontSize: 32 },
  regionName: { fontSize: FONTS.sizes.lg, fontWeight: '900', letterSpacing: 1 },
  regionLangCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Region preview
  regionPreview: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  regionPreviewName: { fontSize: FONTS.sizes.lg, fontWeight: '900' },
  regionPreviewSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

  // Language grid
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  langCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 3, borderWidth: 1.5, borderColor: COLORS.border },
  langFlag: { fontSize: 22 },
  langNative: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '900', textAlign: 'center' },
  langName: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center' },

  // Custom lang
  customToggle: { marginTop: SPACING.lg, padding: SPACING.sm, alignItems: 'center' },
  customToggleText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  customInputWrap: { marginTop: SPACING.sm, gap: SPACING.sm },
  customInput: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border },
  customConfirmBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  customConfirmText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.sm },

  // Confirm step
  confirmWrap: { gap: SPACING.lg },
  confirmCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  confirmRegion: { fontSize: FONTS.sizes.xl, fontWeight: '900' },
  confirmLang: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  confirmLangFlag: { fontSize: 24 },
  confirmLangName: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  confirmInfo: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  confirmInfoRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  confirmInfoIcon: { fontSize: 20, width: 28 },
  confirmInfoText: { color: COLORS.text, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 20 },
  confirmBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  confirmBtnGrad: { paddingVertical: SPACING.lg, alignItems: 'center' },
  confirmBtnText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.lg, letterSpacing: 3 },
});
