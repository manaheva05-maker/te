import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import { questionAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const TIMER_SECS = 20;

export default function SenseiTrainingScreen() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [phase, setPhase] = useState('menu'); // menu | playing | debate | result
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(TIMER_SECS);
  const [answered, setAnswered] = useState(false);
  const [debateText, setDebateText] = useState('');
  const [debateResult, setDebateResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTraining = async () => {
    setPhase('playing');
    setScore({ correct: 0, total: 0 });
    await loadQuestion();
  };

  const loadQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setAnswered(false);
    setDebateText('');
    setDebateResult(null);
    setTimer(TIMER_SECS);
    try {
      const data = await questionAPI.get({ limit: 1, soul: user?.aura });
      setQuestion(data.questions?.[0] || null);
      startTimer();
    } catch {
      Alert.alert(t('common.error'), 'Impossible de charger une question');
      setPhase('menu');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!answered) handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = async (idx) => {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question?.correct_index;
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    await questionAPI.updateStats(question._id, correct).catch(() => {});
  };

  const submitDebate = () => {
    if (!debateText.trim()) return;
    // Simulate AI judge (in prod: call /api/questions/debate)
    const valid = debateText.length > 20 && Math.random() > 0.5;
    setDebateResult({ valid, reason: valid ? 'Argument valide ! Demi-point accordé.' : 'Argument insuffisant selon le lore.' });
  };

  const optionStyle = (idx) => {
    if (!answered) return s.option;
    if (idx === question.correct_index) return [s.option, s.optionCorrect];
    if (idx === selected && idx !== question.correct_index) return [s.option, s.optionWrong];
    return [s.option, s.optionDim];
  };

  const timerColor = timer <= 5 ? COLORS.danger : timer <= 10 ? COLORS.warning : COLORS.success;

  if (phase === 'menu') return (
    <LinearGradient colors={['#0A0A0F', '#0A1A2A']} style={s.container}>
      <ScrollView contentContainerStyle={s.menuContent}>
        <Text style={s.menuIcon}>🤖</Text>
        <Text style={s.menuTitle}>SENSEI AI</Text>
        <Text style={s.menuSub}>{t('training.title')}</Text>

        <View style={s.infoCards}>
          {[
            { icon: '🎯', title: 'Adaptatif', desc: 'Questions selon ton niveau et ton Âme' },
            { icon: '⚖️', title: 'Mode Débat', desc: 'Conteste une mauvaise réponse avec un argument' },
            { icon: '📈', title: 'Progression', desc: 'Le Sensei identifie tes points faibles' },
          ].map((c, i) => (
            <View key={i} style={s.infoCard}>
              <Text style={s.infoIcon}>{c.icon}</Text>
              <View>
                <Text style={s.infoTitle}>{c.title}</Text>
                <Text style={s.infoDesc}>{c.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.startBtn} onPress={startTraining}>
          <LinearGradient colors={[COLORS.info, '#1A4A8A']} style={s.startGrad}>
            <Text style={s.startText}>🤖 {t('training.start').toUpperCase()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  if (loading) return (
    <LinearGradient colors={['#0A0A0F', '#0A1A2A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.info} />
      <Text style={s.loadingText}>Sensei prépare ta question...</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0A0A0F', '#0A1A2A']} style={s.container}>
      {/* Score + Timer */}
      <View style={s.topBar}>
        <View style={s.scoreBox}>
          <Text style={s.scoreText}>✅ {score.correct}/{score.total}</Text>
        </View>
        <View style={[s.timerBox, { borderColor: timerColor }]}>
          <Text style={[s.timerText, { color: timerColor }]}>{timer}s</Text>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('menu'); }}>
          <Text style={s.exitText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.questionContent}>
        {question ? (
          <>
            <View style={s.qMeta}>
              <Text style={s.qAnime}>{question.anime}</Text>
              <Text style={s.qDiff}>{'⭐'.repeat(Math.min(question.difficulty || 1, 5))}</Text>
            </View>
            <Text style={s.qText}>{question.text?.[lang] || question.text?.fr}</Text>

            {question.options?.map((opt, i) => (
              <TouchableOpacity key={i} style={optionStyle(i)} onPress={() => handleAnswer(i)} disabled={answered}>
                <Text style={s.optionLetter}>{['A','B','C','D'][i]}</Text>
                <Text style={s.optionText}>{opt[lang] || opt.fr}</Text>
                {answered && i === question.correct_index && <Text style={s.optionCheck}>✓</Text>}
                {answered && i === selected && i !== question.correct_index && <Text style={s.optionX}>✗</Text>}
              </TouchableOpacity>
            ))}

            {answered && selected !== question.correct_index && (
              <View style={s.debateBox}>
                <Text style={s.debateTitle}>⚖️ {t('training.debate')}</Text>
                <Text style={s.debateSub}>Tu penses que ta réponse est défendable ?</Text>
                <TextInput
                  style={s.debateInput}
                  value={debateText}
                  onChangeText={setDebateText}
                  placeholder={t('training.argue')}
                  placeholderTextColor={COLORS.textDim}
                  multiline numberOfLines={3}
                />
                {!debateResult ? (
                  <TouchableOpacity style={s.debateBtn} onPress={submitDebate}>
                    <Text style={s.debateBtnText}>Soumettre au Sensei</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[s.debateResult, { borderColor: debateResult.valid ? COLORS.success : COLORS.danger }]}>
                    <Text style={[s.debateResultText, { color: debateResult.valid ? COLORS.success : COLORS.danger }]}>
                      {debateResult.valid ? '✅' : '❌'} {debateResult.reason}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {answered && (
              <TouchableOpacity style={s.nextBtn} onPress={loadQuestion}>
                <LinearGradient colors={[COLORS.info, '#1A4A8A']} style={s.nextGrad}>
                  <Text style={s.nextText}>Question suivante →</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={s.noQ}>Aucune question disponible</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  menuContent: { padding: SPACING.xl, alignItems: 'center', paddingTop: 80 },
  menuIcon: { fontSize: 64, marginBottom: SPACING.sm },
  menuTitle: { color: COLORS.info, fontSize: FONTS.sizes.xxxl, fontWeight: '900', letterSpacing: 4 },
  menuSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xl },
  infoCards: { width: '100%', gap: SPACING.md, marginBottom: SPACING.xl },
  infoCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', gap: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  infoIcon: { fontSize: 28 },
  infoTitle: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  infoDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  startBtn: { width: '100%', borderRadius: RADIUS.md, overflow: 'hidden' },
  startGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  startText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm },
  scoreBox: { flex: 1, backgroundColor: COLORS.surfaceLight, padding: SPACING.sm, borderRadius: RADIUS.md },
  scoreText: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.sm },
  timerBox: { borderWidth: 2, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full },
  timerText: { fontWeight: '900', fontSize: FONTS.sizes.lg },
  exitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  exitText: { color: COLORS.textMuted, fontWeight: '900' },
  questionContent: { padding: SPACING.lg },
  qMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  qAnime: { color: COLORS.info, fontWeight: '700', fontSize: FONTS.sizes.sm },
  qDiff: { fontSize: FONTS.sizes.xs },
  qText: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 28, marginBottom: SPACING.lg },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  optionCorrect: { borderColor: COLORS.success, backgroundColor: '#0A2A0A' },
  optionWrong: { borderColor: COLORS.danger, backgroundColor: '#2A0A0A' },
  optionDim: { opacity: 0.4 },
  optionLetter: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg, width: 24 },
  optionText: { color: COLORS.text, fontSize: FONTS.sizes.md, flex: 1 },
  optionCheck: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.lg },
  optionX: { color: COLORS.danger, fontWeight: '900', fontSize: FONTS.sizes.lg },
  debateBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.lg, marginBottom: SPACING.md },
  debateTitle: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md, marginBottom: 4 },
  debateSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.md },
  debateInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.sm, borderWidth: 1, borderColor: COLORS.border, minHeight: 70, textAlignVertical: 'top', marginBottom: SPACING.md },
  debateBtn: { backgroundColor: COLORS.info, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  debateBtnText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.sm },
  debateResult: { borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1 },
  debateResultText: { fontWeight: '700', fontSize: FONTS.sizes.sm },
  nextBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md },
  nextGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  nextText: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.md },
  noQ: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
});
