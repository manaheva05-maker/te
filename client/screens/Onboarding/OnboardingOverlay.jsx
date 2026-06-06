import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../context/OnboardingContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export default function OnboardingOverlay({ navigation }) {
  const { isVisible, currentStep, totalSteps, step, nextStep, prevStep, skipOnboarding } = useOnboarding();
  const { lang } = useLang();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();

      // Arrow bounce loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, { toValue: 8, duration: 600, useNativeDriver: true }),
          Animated.timing(arrowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isVisible, currentStep]);

  const handleNext = () => {
    // Animate out then next step
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(40);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      nextStep();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    });

    // Navigate if step has an action
    if (step?.action && navigation) {
      switch (step.action) {
        case 'navigate_duel': navigation.navigate('Main', { screen: 'Duel' }); break;
        case 'navigate_clan': navigation.navigate('Main', { screen: 'Clan' }); break;
        case 'navigate_tournament': navigation.navigate('TournamentList'); break;
        case 'navigate_live': navigation.navigate('Live'); break;
        case 'navigate_shop': navigation.navigate('Shop'); break;
        default: break;
      }
    }
  };

  if (!isVisible || !step) return null;

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;
  const pct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Modal visible={isVisible} transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>

        {/* Animated pointer arrow (for steps with targets) */}
        {step.highlight && (
          <Animated.View style={[s.pulseRing, { transform: [{ scale: scaleAnim }] }]} />
        )}

        {/* Card */}
        <Animated.View style={[
          s.cardWrap,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }
        ]}>
          <LinearGradient colors={['#1A1A2E', '#0A0A1E']} style={s.card}>
            {/* Progress bar */}
            <View style={s.progressBg}>
              <Animated.View style={[s.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.stepCounter}>{currentStep + 1} / {totalSteps}</Text>

            {/* Icon */}
            <Text style={s.icon}>{step.icon}</Text>

            {/* Title */}
            <Text style={s.title}>{step.title[lang] || step.title.fr}</Text>

            {/* Description */}
            <Text style={s.desc}>{step.desc[lang] || step.desc.fr}</Text>

            {/* Animated arrow for highlight steps */}
            {step.highlight && (
              <Animated.View style={[s.arrow, { transform: [{ translateY: arrowAnim }] }]}>
                <Text style={s.arrowText}>↓</Text>
              </Animated.View>
            )}

            {/* Buttons */}
            <View style={s.btns}>
              {!isFirst && (
                <TouchableOpacity style={s.prevBtn} onPress={prevStep}>
                  <Text style={s.prevBtnText}>‹ {lang === 'fr' ? 'Retour' : 'Back'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[s.nextBtn, isFirst && { flex: 1 }]} onPress={handleNext}>
                <LinearGradient
                  colors={isLast ? [COLORS.success, '#1A6A1A'] : [COLORS.primary, COLORS.primaryDark]}
                  style={s.nextBtnGrad}
                >
                  <Text style={s.nextBtnText}>
                    {isLast
                      ? (lang === 'fr' ? '🎮 C\'est parti !' : '🎮 Let\'s go!')
                      : (step.action && step.action !== 'finish'
                        ? (lang === 'fr' ? 'Voir →' : 'See →')
                        : (lang === 'fr' ? 'Suivant →' : 'Next →'))}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Skip */}
            {!isLast && (
              <TouchableOpacity style={s.skipBtn} onPress={skipOnboarding}>
                <Text style={s.skipText}>{lang === 'fr' ? 'Passer le tutoriel' : 'Skip tutorial'}</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Step dots */}
        <View style={s.dots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i === currentStep && s.dotActive, i < currentStep && s.dotDone]} />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute', width: 80, height: 80,
    borderRadius: 40, borderWidth: 2, borderColor: COLORS.primary,
    opacity: 0.3, bottom: 220,
  },
  cardWrap: { width: width - 40, maxWidth: 360 },
  card: {
    borderRadius: 20, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.primary + '44',
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  progressBg: {
    width: '100%', height: 3, backgroundColor: COLORS.border,
    borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepCounter: {
    color: COLORS.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginBottom: SPACING.lg,
  },
  icon: { fontSize: 64, marginBottom: SPACING.md },
  title: {
    color: COLORS.primary, fontSize: 20, fontWeight: '900',
    textAlign: 'center', letterSpacing: 1, marginBottom: SPACING.md,
    fontFamily: 'Cinzel Decorative',
  },
  desc: {
    color: COLORS.text, fontSize: 14, lineHeight: 22,
    textAlign: 'center', marginBottom: SPACING.xl,
  },
  arrow: { marginBottom: SPACING.md },
  arrowText: { color: COLORS.primary, fontSize: 28, fontWeight: '900' },
  btns: { flexDirection: 'row', gap: SPACING.sm, width: '100%', marginBottom: SPACING.sm },
  prevBtn: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  prevBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  nextBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  nextBtnGrad: { paddingVertical: SPACING.md, alignItems: 'center' },
  nextBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  skipBtn: { paddingVertical: SPACING.sm },
  skipText: { color: COLORS.textDim, fontSize: 12 },
  dots: {
    position: 'absolute', bottom: 40,
    flexDirection: 'row', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 20, backgroundColor: COLORS.primary },
  dotDone: { backgroundColor: COLORS.primary + '88' },
});
