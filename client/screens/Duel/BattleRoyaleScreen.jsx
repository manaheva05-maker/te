import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { questionAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const TOTAL_PLAYERS = 50;
const Q_TIME = 8; // seconds per question in BR

export default function BattleRoyaleScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [phase, setPhase] = useState('lobby'); // lobby | playing | finished
  const [players, setPlayers] = useState(TOTAL_PLAYERS);
  const [question, setQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [timer, setTimer] = useState(Q_TIME);
  const [eliminated, setEliminated] = useState(false);
  const [rank, setRank] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'lobby') {
      // Simulate players joining
      const interval = setInterval(() => {
        setPlayers(p => Math.min(TOTAL_PLAYERS, p + Math.floor(Math.random() * 3)));
      }, 500);
      setTimeout(() => { clearInterval(interval); startGame(); }, 4000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const startGame = async () => {
    setPhase('playing');
    loadQuestion();
  };

  const loadQuestion = async () => {
    try {
      const data = await questionAPI.get({ limit: 1, type: 'flash' });
      setQuestion(data.questions?.[0] || null);
      setTimer(Q_TIME);
      startTimer();
    } catch {}
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    // Auto-eliminate on timeout
    handleAnswer(-1);
  };

  const handleAnswer = async (answerIndex) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = answerIndex === question?.correct_index;

    if (!correct) {
      setEliminated(true);
      setRank(players);
      setPhase('finished');
      return;
    }

    // Simulate eliminations
    const eliminated = Math.floor(players * 0.15);
    const remaining = Math.max(1, players - eliminated);
    setPlayers(remaining);

    if (remaining === 1) {
      setRank(1);
      setPhase('finished');
      return;
    }

    setQIndex(prev => prev + 1);
    loadQuestion();
  };

  if (phase === 'lobby') {
    return (
      <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
        <Text style={s.brTitle}>💥 BATTLE ROYALE</Text>
        <Text style={s.brSub}>Dernier debout gagne</Text>
        <View style={s.lobbyBox}>
          <Text style={s.lobbyCount}>{players}</Text>
          <Text style={s.lobbyLabel}>joueurs prêts</Text>
        </View>
        <Text style={s.lobbySub}>Lancement automatique...</Text>
      </LinearGradient>
    );
  }

  if (phase === 'finished') {
    return (
      <LinearGradient colors={rank === 1 ? ['#0A1A0A','#001000'] : ['#1A0A0A','#100000']} style={s.container}>
        <Text style={s.resultEmoji}>{rank === 1 ? '👑' : '💀'}</Text>
        <Text style={[s.resultText, { color: rank === 1 ? COLORS.primary : COLORS.danger }]}>
          {rank === 1 ? '🏆 VAINQUEUR !' : `#${rank} ÉLIMINÉ`}
        </Text>
        <Text style={s.resultKI}>{rank === 1 ? '+100 KI' : `+${Math.floor(100 / rank)} KI`}</Text>
        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Main')}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.homeBtnGrad}>
            <Text style={s.homeBtnText}>ACCUEIL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const timerColor = timer <= 3 ? COLORS.danger : timer <= 5 ? COLORS.warning : COLORS.success;

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.statChip}><Text style={s.statChipText}>👥 {players}</Text></View>
        <View style={[s.timerChip, { borderColor: timerColor }]}>
          <Text style={[s.timerText, { color: timerColor }]}>{timer}s</Text>
        </View>
        <View style={s.statChip}><Text style={s.statChipText}>Q{qIndex + 1}</Text></View>
      </View>

      {/* Question */}
      {question ? (
        <View style={s.questionBox}>
          <Text style={s.questionType}>⚡ FLASH</Text>
          <Text style={s.questionAnime}>{question.anime}</Text>
          <Text style={s.questionText}>{question.text?.fr || question.text?.en}</Text>

          <View style={s.answers}>
            {question.options?.map((opt, i) => (
              <TouchableOpacity key={i} style={s.answerBtn} onPress={() => handleAnswer(i)}>
                <LinearGradient colors={['#1E1E2E', '#12121A']} style={s.answerGrad}>
                  <Text style={s.answerLetter}>{['A','B','C','D'][i]}</Text>
                  <Text style={s.answerText}>{opt.fr || opt.en}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={s.loading}>
          <Text style={s.loadingText}>⚡ {t('common.loading')}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  brTitle: { color: COLORS.primary, fontSize: FONTS.sizes.xxxl, fontWeight: '900', textAlign: 'center', marginBottom: SPACING.sm },
  brSub: { color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },
  lobbyBox: { alignItems: 'center', marginVertical: SPACING.xl },
  lobbyCount: { fontSize: 80, fontWeight: '900', color: COLORS.primary },
  lobbyLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg },
  lobbySub: { color: COLORS.textMuted, textAlign: 'center' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  statChip: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  statChipText: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm },
  timerChip: { borderWidth: 2, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  timerText: { fontWeight: '900', fontSize: FONTS.sizes.lg },
  questionBox: { flex: 1, paddingHorizontal: SPACING.lg },
  questionType: { color: COLORS.warning, fontSize: FONTS.sizes.xs, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  questionAnime: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: SPACING.md },
  questionText: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 28, marginBottom: SPACING.xl },
  answers: { gap: SPACING.sm },
  answerBtn: { borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  answerGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  answerLetter: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg, width: 24 },
  answerText: { color: COLORS.text, fontSize: FONTS.sizes.md, flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg },
  resultEmoji: { fontSize: 80, textAlign: 'center', marginBottom: SPACING.lg },
  resultText: { fontSize: FONTS.sizes.xxxl, fontWeight: '900', textAlign: 'center', letterSpacing: 4, marginBottom: SPACING.lg },
  resultKI: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', textAlign: 'center', marginBottom: SPACING.xl },
  homeBtn: { margin: SPACING.xl, borderRadius: RADIUS.md, overflow: 'hidden' },
  homeBtnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  homeBtnText: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
});
