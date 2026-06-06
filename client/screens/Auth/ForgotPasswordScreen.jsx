import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return Alert.alert('', 'Saisis ton email');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <View style={s.inner}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={s.title}>🔑 Mot de passe oublié</Text>

        {sent ? (
          <View style={s.successBox}>
            <Text style={s.successIcon}>📧</Text>
            <Text style={s.successTitle}>Email envoyé !</Text>
            <Text style={s.successText}>
              Si ce compte existe, un lien de réinitialisation a été envoyé. Vérifie ta boîte mail.
            </Text>
            <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.btnGrad}>
                <Text style={s.btnText}>RETOUR À LA CONNEXION</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.form}>
            <Text style={s.desc}>Saisis ton adresse email. Tu recevras un lien pour réinitialiser ton mot de passe.</Text>
            <TextInput
              style={s.input}
              placeholder="ton@email.com"
              placeholderTextColor={COLORS.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>ENVOYER LE LIEN</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: 60 },
  back: { marginBottom: SPACING.xl },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.md },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: SPACING.xl },
  form: { gap: SPACING.md },
  desc: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 22, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.text, fontSize: FONTS.sizes.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  btnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  successBox: { alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xl },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  successText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center', lineHeight: 22 },
});
