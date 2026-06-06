import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  StatusBar
} from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Defs, LinearGradient, Stop,
  RadialGradient, G, Polygon, ClipPath, Rect
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── DRAGON SVG COMPONENT ────────────────────────────────────
function DragonSVG({ breathe = false, size = 320 }) {
  const scale = size / 320;
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 320 272">
      <Defs>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD700" />
          <Stop offset="0.4" stopColor="#C9A227" />
          <Stop offset="1" stopColor="#8B4513" />
        </LinearGradient>
        <LinearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C9A227" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#8B0000" stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id="fireGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FF4500" />
          <Stop offset="0.4" stopColor="#FFD700" />
          <Stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
        </LinearGradient>
        <RadialGradient id="eyeGrad" cx="0.3" cy="0.3" r="0.7">
          <Stop offset="0" stopColor="#FF4500" />
          <Stop offset="1" stopColor="#8B0000" />
        </RadialGradient>
        <LinearGradient id="bellyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5DEB3" />
          <Stop offset="1" stopColor="#DEB887" />
        </LinearGradient>
        <LinearGradient id="hornGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#C9A227" />
          <Stop offset="1" stopColor="#FFD700" />
        </LinearGradient>
      </Defs>

      {/* ── LEFT WING ── */}
      <G opacity="0.85">
        <Path d="M120 120 L30 40 L60 100 L20 80 L50 140 L80 130 Z"
          fill="url(#wingGrad)" stroke="#8B4513" strokeWidth="1.5" />
        {/* Wing veins */}
        <Path d="M120 120 L30 40" stroke="#C9A227" strokeWidth="0.8" opacity="0.5"/>
        <Path d="M120 120 L60 100" stroke="#C9A227" strokeWidth="0.6" opacity="0.4"/>
        <Path d="M120 120 L20 80" stroke="#C9A227" strokeWidth="0.5" opacity="0.3"/>
        <Path d="M120 120 L50 140" stroke="#C9A227" strokeWidth="0.5" opacity="0.3"/>
      </G>

      {/* ── RIGHT WING ── */}
      <G opacity="0.85">
        <Path d="M200 120 L290 40 L260 100 L300 80 L270 140 L240 130 Z"
          fill="url(#wingGrad)" stroke="#8B4513" strokeWidth="1.5" />
        <Path d="M200 120 L290 40" stroke="#C9A227" strokeWidth="0.8" opacity="0.5"/>
        <Path d="M200 120 L260 100" stroke="#C9A227" strokeWidth="0.6" opacity="0.4"/>
        <Path d="M200 120 L300 80" stroke="#C9A227" strokeWidth="0.5" opacity="0.3"/>
        <Path d="M200 120 L270 140" stroke="#C9A227" strokeWidth="0.5" opacity="0.3"/>
      </G>

      {/* ── TAIL ── */}
      <Path d="M110 200 C80 220 60 240 40 230 C30 225 35 215 50 218 C60 220 70 215 80 205 C90 195 100 200 110 200Z"
        fill="url(#bodyGrad)" stroke="#8B4513" strokeWidth="1"/>
      <Path d="M40 230 C25 240 20 255 30 260 C40 265 45 250 40 240"
        fill="#C9A227" stroke="#8B4513" strokeWidth="1"/>
      {/* Tail spikes */}
      <Polygon points="55,220 60,205 65,220" fill="#FFD700" stroke="#C9A227" strokeWidth="0.5"/>
      <Polygon points="75,210 80,195 85,210" fill="#FFD700" stroke="#C9A227" strokeWidth="0.5"/>

      {/* ── BODY ── */}
      <Ellipse cx="160" cy="175" rx="65" ry="55" fill="url(#bodyGrad)" stroke="#8B4513" strokeWidth="1.5"/>
      {/* Belly scales */}
      <Ellipse cx="160" cy="180" rx="40" ry="35" fill="url(#bellyGrad)" opacity="0.7"/>
      <Path d="M130 165 Q160 155 190 165" stroke="#DEB887" strokeWidth="1" fill="none" opacity="0.5"/>
      <Path d="M125 175 Q160 162 195 175" stroke="#DEB887" strokeWidth="1" fill="none" opacity="0.5"/>
      <Path d="M128 185 Q160 172 192 185" stroke="#DEB887" strokeWidth="1" fill="none" opacity="0.5"/>

      {/* ── LEGS ── */}
      {/* Front left */}
      <Path d="M130 210 L115 230 L105 245" stroke="url(#bodyGrad)" strokeWidth="14" strokeLinecap="round"/>
      <Path d="M105 245 L95 252 M105 245 L108 255 M105 245 L115 250"
        stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
      {/* Front right */}
      <Path d="M190 210 L205 230 L215 245" stroke="url(#bodyGrad)" strokeWidth="14" strokeLinecap="round"/>
      <Path d="M215 245 L225 252 M215 245 L212 255 M215 245 L205 250"
        stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>
      {/* Back claws */}
      <Path d="M140 225 L128 248" stroke="url(#bodyGrad)" strokeWidth="10" strokeLinecap="round"/>
      <Path d="M180 225 L192 248" stroke="url(#bodyGrad)" strokeWidth="10" strokeLinecap="round"/>

      {/* ── NECK ── */}
      <Path d="M140 130 C135 110 145 95 160 90 C175 95 185 110 180 130"
        fill="url(#bodyGrad)" stroke="#8B4513" strokeWidth="1.5"/>
      {/* Neck scales */}
      <Path d="M147 120 C155 115 165 115 173 120" stroke="#C9A227" strokeWidth="0.8" fill="none" opacity="0.6"/>
      <Path d="M143 108 C155 102 165 102 177 108" stroke="#C9A227" strokeWidth="0.8" fill="none" opacity="0.5"/>

      {/* ── HEAD ── */}
      <Ellipse cx="160" cy="78" rx="35" ry="28" fill="url(#bodyGrad)" stroke="#8B4513" strokeWidth="1.5"/>

      {/* Snout */}
      <Path d="M130 78 C125 78 120 82 122 88 C124 94 132 92 140 88"
        fill="url(#bodyGrad)" stroke="#8B4513" strokeWidth="1.5"/>
      {/* Nostril */}
      <Ellipse cx="127" cy="84" rx="3" ry="2" fill="#8B4513"/>

      {/* ── HORNS ── */}
      <Path d="M150 52 C147 40 143 28 146 18" stroke="url(#hornGrad)" strokeWidth="6" strokeLinecap="round"/>
      <Path d="M170 52 C173 40 177 28 174 18" stroke="url(#hornGrad)" strokeWidth="6" strokeLinecap="round"/>
      {/* Horn tips */}
      <Circle cx="146" cy="18" r="3" fill="#FFD700"/>
      <Circle cx="174" cy="18" r="3" fill="#FFD700"/>

      {/* ── CREST SPIKES ── */}
      <Polygon points="155,54 151,38 159,54" fill="#C9A227" stroke="#8B4513" strokeWidth="0.5"/>
      <Polygon points="162,52 158,35 166,52" fill="#C9A227" stroke="#8B4513" strokeWidth="0.5"/>
      <Polygon points="168,53 165,37 172,53" fill="#C9A227" stroke="#8B4513" strokeWidth="0.5"/>

      {/* ── EYES ── */}
      {/* Left eye */}
      <Ellipse cx="148" cy="72" rx="7" ry="8" fill="url(#eyeGrad)"/>
      <Ellipse cx="148" cy="72" rx="3" ry="5" fill="#0A0A0F"/>
      <Circle cx="146" cy="70" r="1.5" fill="white" opacity="0.8"/>
      {/* Eyebrow ridge */}
      <Path d="M142 65 C147 62 154 64" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>

      {/* Right eye */}
      <Ellipse cx="172" cy="72" rx="7" ry="8" fill="url(#eyeGrad)"/>
      <Ellipse cx="172" cy="72" rx="3" ry="5" fill="#0A0A0F"/>
      <Circle cx="170" cy="70" r="1.5" fill="white" opacity="0.8"/>
      <Path d="M166 65 C171 62 178 64" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>

      {/* ── MOUTH / JAW ── */}
      <Path d="M125 86 C128 96 145 100 160 100 C175 100 185 96 195 86"
        stroke="#8B4513" strokeWidth="2" fill="none"/>
      {/* Teeth */}
      <Path d="M132 90 L128 98 M140 93 L137 102 M148 94 L146 103"
        stroke="#F5F5DC" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Tongue */}
      <Path d="M155 98 C158 104 162 106 165 104 C163 108 158 110 155 106"
        fill="#FF4444" stroke="#CC2222" strokeWidth="0.5"/>

      {/* ── FIRE BREATH ── */}
      {breathe && (
        <G>
          <Path d="M120 88 C80 80 40 75 -10 80" stroke="url(#fireGrad)" strokeWidth="20" strokeLinecap="round" opacity="0.9"/>
          <Path d="M118 90 C78 88 38 90 -5 95" stroke="url(#fireGrad)" strokeWidth="12" strokeLinecap="round" opacity="0.7"/>
          <Path d="M116 86 C76 78 36 72 -15 72" stroke="url(#fireGrad)" strokeWidth="8" strokeLinecap="round" opacity="0.5"/>
          {/* Sparks */}
          <Circle cx="60" cy="78" r="4" fill="#FFD700" opacity="0.9"/>
          <Circle cx="40" cy="82" r="3" fill="#FF4500" opacity="0.8"/>
          <Circle cx="80" cy="75" r="5" fill="#FF6B00" opacity="0.7"/>
          <Circle cx="20" cy="80" r="3" fill="#FFD700" opacity="0.6"/>
          <Circle cx="100" cy="85" r="2" fill="#FF4500" opacity="0.9"/>
        </G>
      )}

      {/* ── BODY SCALES DETAIL ── */}
      <Path d="M145 155 C155 148 165 148 175 155" stroke="#C9A227" strokeWidth="1" fill="none" opacity="0.4"/>
      <Path d="M140 163 C155 156 165 156 180 163" stroke="#C9A227" strokeWidth="1" fill="none" opacity="0.4"/>
      <Path d="M138 171 C155 164 165 164 182 171" stroke="#C9A227" strokeWidth="1" fill="none" opacity="0.4"/>
      <Path d="M140 179 C155 173 165 173 180 179" stroke="#C9A227" strokeWidth="1" fill="none" opacity="0.3"/>

      {/* ── SHOULDER SCALES ── */}
      <Polygon points="128,135 120,125 136,125" fill="#C9A227" stroke="#8B4513" strokeWidth="0.5" opacity="0.7"/>
      <Polygon points="192,135 184,125 200,125" fill="#C9A227" stroke="#8B4513" strokeWidth="0.5" opacity="0.7"/>
    </Svg>
  );
}

// ─── FIRE PARTICLES ──────────────────────────────────────────
function FireParticle({ delay, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x,
      bottom: 10,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: ['#FF4500','#FFD700','#FF6B00'][Math.floor(x / 30) % 3],
      opacity: anim.interpolate({ inputRange: [0,0.5,1], outputRange: [0,1,0] }),
      transform: [{
        translateY: anim.interpolate({ inputRange: [0,1], outputRange: [0,-60] })
      }]
    }} />
  );
}

// ─── MAIN INTRO SCREEN ───────────────────────────────────────
export default function DragonIntroScreen({ onFinish }) {
  const [breathe, setBreathe] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  // Animations
  const bgAnim = useRef(new Animated.Value(0)).current;
  const dragonY = useRef(new Animated.Value(80)).current;
  const dragonOpacity = useRef(new Animated.Value(0)).current;
  const dragonScale = useRef(new Animated.Value(0.7)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(1.5)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = async () => {
      // 1. Background fade in
      Animated.timing(bgAnim, { toValue: 1, duration: 800, useNativeDriver: false }).start();

      // 2. Dragon flies in from bottom
      await new Promise(r => setTimeout(r, 400));
      Animated.parallel([
        Animated.spring(dragonY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(dragonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(dragonScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();

      // 3. Dragon breathes fire
      await new Promise(r => setTimeout(r, 900));
      setBreathe(true);

      // 4. Title appears with glow
      await new Promise(r => setTimeout(r, 500));
      setShowTitle(true);
      Animated.parallel([
        Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      ]).start();

      // 5. Tagline
      await new Promise(r => setTimeout(r, 700));
      setShowTagline(true);
      Animated.timing(taglineAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

      // 6. Glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        ])
      ).start();

      // 7. Auto-finish after 4.5s
      await new Promise(r => setTimeout(r, 4500));
      Animated.timing(bgAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();
      await new Promise(r => setTimeout(r, 600));
      onFinish?.();
    };

    sequence();
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', '#0A0A0F']
  });

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(201,162,39,0)', 'rgba(201,162,39,0.35)']
  });

  return (
    <Animated.View style={[s.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden />

      {/* Background stars */}
      {[...Array(20)].map((_, i) => (
        <View key={i} style={[s.star, {
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 70}%`,
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          opacity: 0.3 + (i % 5) * 0.1,
        }]} />
      ))}

      {/* Dragon */}
      <Animated.View style={[s.dragonWrap, {
        opacity: dragonOpacity,
        transform: [{ translateY: dragonY }, { scale: dragonScale }]
      }]}>
        {/* Glow behind dragon */}
        <Animated.View style={[s.dragonGlow, { backgroundColor: glowColor }]} />
        <DragonSVG breathe={breathe} size={Math.min(width * 0.85, 300)} />
      </Animated.View>

      {/* Fire particles */}
      {breathe && [0,20,40,60,80,100,120].map((x, i) => (
        <FireParticle key={i} delay={i * 120} x={x} size={6 + (i % 3) * 3} />
      ))}

      {/* Title */}
      {showTitle && (
        <Animated.View style={[s.titleWrap, {
          opacity: titleAnim,
          transform: [{ scale: titleScale }]
        }]}>
          <Animated.View style={[s.titleGlow, { shadowColor: '#C9A227', shadowRadius: glowAnim.interpolate({ inputRange:[0,1], outputRange:[4,20] }) }]} />
          <Text style={s.title}>⛩ SHINKEN</Text>
          <Text style={s.titleJP}>真剣</Text>
        </Animated.View>
      )}

      {/* Tagline */}
      {showTagline && (
        <Animated.View style={[s.taglineWrap, { opacity: taglineAnim }]}>
          <View style={s.taglineLine} />
          <Text style={s.tagline}>Ton savoir est ton arme</Text>
          <View style={s.taglineLine} />
        </Animated.View>
      )}

      {/* Tap to skip */}
      {showTagline && (
        <Animated.View style={[s.skipWrap, { opacity: taglineAnim }]}>
          <Text style={s.skipText} onPress={() => onFinish?.()}>Appuyer pour continuer</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 999 },
  dragonWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  dragonGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  titleWrap: { alignItems: 'center', marginBottom: 16 },
  titleGlow: { position: 'absolute', inset: 0, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
  title: {
    fontSize: 52, fontWeight: '900', color: '#C9A227',
    letterSpacing: 8, fontFamily: 'Cinzel Decorative',
    textShadowColor: '#FFD700', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  titleJP: {
    fontSize: 22, color: '#C9A227', letterSpacing: 12, marginTop: -8,
    opacity: 0.7, fontWeight: '700',
  },
  taglineWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taglineLine: { flex: 1, height: 1, backgroundColor: '#C9A22744', maxWidth: 60 },
  tagline: { color: '#F0EAD6', fontSize: 13, letterSpacing: 2, opacity: 0.8 },
  skipWrap: { position: 'absolute', bottom: 60 },
  skipText: { color: '#C9A227', fontSize: 12, letterSpacing: 1, opacity: 0.6 },
});
