import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('', lang === 'fr' ? 'Remplis tous les champs' : 'Fill all fields');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, rememberMe);
    } catch (err) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.inner}>

        <Text style={s.logo}>⛩️ SHINKEN</Text>
        <Text style={s.sub}>{lang === 'fr' ? 'Bon retour guerrier' : 'Welcome back warrior'}</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder={lang === 'fr' ? 'Email' : 'Email'}
            placeholderTextColor={COLORS.textDim}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={s.input}
            placeholder={lang === 'fr' ? 'Mot de passe' : 'Password'}
            placeholderTextColor={COLORS.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={s.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[s.checkbox, rememberMe && s.checkboxActive]}>
              {rememberMe && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.rememberText}>{lang === 'fr' ? 'Se souvenir de moi' : 'Remember me'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>{lang === 'fr' ? 'SE CONNECTER' : 'LOGIN'}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.forgotText}>{lang === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>{lang === 'fr' ? 'Pas de compte ? ' : 'No account? '}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.link}>{lang === 'fr' ? 'S\'inscrire' : 'Register'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
          <Text style={s.langText}>{lang === 'fr' ? '🇫🇷 FR' : '🇺🇸 EN'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  logo: { fontSize: 36, fontWeight: '900', color: COLORS.primary, textAlign: 'center', letterSpacing: 4, marginBottom: SPACING.xs },
  sub: { fontSize: FONTS.sizes.md, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl * 2 },
  form: { gap: SPACING.md },
  input: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.text, fontSize: FONTS.sizes.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  rememberText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  forgotBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  forgotText: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  link: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  langBtn: { position: 'absolute', top: 50, right: SPACING.lg, padding: SPACING.sm },
  langText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});
