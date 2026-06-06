import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { SOULS } from '../../constants/ranks';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t, lang } = useLang();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [username, setUsername]   = useState('');
  const [selectedSoul, setSelectedSoul] = useState('shonen');
  const [loading, setLoading]     = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !username) {
      return Alert.alert('', lang === 'fr' ? 'Remplis tous les champs' : 'Fill all fields');
    }
    // ✅ FIX: min 8 chars pour correspondre à la validation Joi du backend (était < 6, backend rejette < 8)
    if (password.length < 8) {
      return Alert.alert('', lang === 'fr' ? 'Mot de passe trop court (8 min)' : 'Password too short (8 min)');
    }
    if (username.length < 3) {
      return Alert.alert('', lang === 'fr' ? 'Pseudo trop court (3 min)' : 'Username too short (3 min)');
    }
    setLoading(true);
    try {
      await register(email.trim(), password, username.trim(), selectedSoul, lang);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <Text style={s.logo}>⛩️ SHINKEN</Text>
        <Text style={s.sub}>{lang === 'fr' ? 'Forge ton identité de guerrier' : 'Forge your warrior identity'}</Text>

        <View style={s.form}>
          <TextInput style={s.input} placeholder={t('auth.username')} placeholderTextColor={COLORS.textDim}
            value={username} onChangeText={setUsername} maxLength={20} />
          <TextInput style={s.input} placeholder={t('auth.email')} placeholderTextColor={COLORS.textDim}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={s.input} placeholder={t('auth.password')} placeholderTextColor={COLORS.textDim}
            value={password} onChangeText={setPassword} secureTextEntry />
          {/* ✅ Indice visible pour l'utilisateur */}
          <Text style={s.hint}>{lang === 'fr' ? 'Minimum 8 caractères' : 'Minimum 8 characters'}</Text>
        </View>

        <Text style={s.soulTitle}>{t('auth.choose_soul')}</Text>
        <View style={s.soulGrid}>
          {SOULS.map(soul => (
            <TouchableOpacity
              key={soul.key}
              style={[s.soulCard, selectedSoul === soul.key && s.soulCardActive]}
              onPress={() => setSelectedSoul(soul.key)}
            >
              <Text style={s.soulEmoji}>{soul.icon}</Text>
              <Text style={[s.soulLabel, selectedSoul === soul.key && { color: COLORS.primary }]}>
                {soul.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.btnGrad}>
            {loading
              ? <ActivityIndicator color={COLORS.background} />
              : <Text style={s.btnText}>{lang === 'fr' ? 'CRÉER MON COMPTE' : 'CREATE ACCOUNT'}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>{t('auth.already_account')} </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.link}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: SPACING.xl, paddingTop: 60 },
  logo: { fontSize: 32, fontWeight: '900', color: COLORS.primary, textAlign: 'center', letterSpacing: 4, marginBottom: SPACING.xs },
  sub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },
  form: { gap: SPACING.md, marginBottom: SPACING.xl },
  input: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.text, fontSize: FONTS.sizes.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  hint: { color: COLORS.textDim, fontSize: FONTS.sizes.xs, marginTop: -SPACING.sm, marginLeft: 4 },
  soulTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center' },
  soulGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.xl },
  soulCard: {
    width: 90, padding: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  soulCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  soulEmoji: { fontSize: 24, marginBottom: 4 },
  soulLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  btnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  link: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
