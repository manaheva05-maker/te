import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DragonIntroScreen from '../screens/Onboarding/DragonIntroScreen';
import RegionLanguageScreen from '../screens/Onboarding/RegionLanguageScreen';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { authAPI } from '../services/api'; // ✅ import corrigé
import { COLORS } from '../constants/colors';

const STORAGE_INTRO_DONE  = '@shinken_intro_done';
const STORAGE_REGION_DONE = '@shinken_region_done';

export default function AppEntry({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { setLang } = useLang();
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    checkPhase();
  }, [user, authLoading]);

  const checkPhase = async () => {
    if (authLoading) return;
    if (!user) { setPhase('app'); return; }

    try {
      const [introDone, regionDone] = await Promise.all([
        AsyncStorage.getItem(STORAGE_INTRO_DONE),
        AsyncStorage.getItem(STORAGE_REGION_DONE),
      ]);
      if (!introDone)            { setPhase('intro');  return; }
      if (!regionDone && !user.hasCompletedRegionSetup) {
        setPhase('region');
        return;
      }
      setPhase('app');
    } catch {
      setPhase('app');
    }
  };

  const handleIntroFinish = async () => {
    await AsyncStorage.setItem(STORAGE_INTRO_DONE, 'true');
    setPhase('region');
  };

  const handleRegionFinish = async ({ region, language }) => {
    try {
      // ✅ authAPI.regionSetup au lieu de api.patch direct
      await authAPI.regionSetup({ region, language });
      setLang(language);
      await AsyncStorage.setItem(STORAGE_REGION_DONE, 'true');
    } catch (e) {
      console.warn('regionSetup error:', e.message);
    }
    setPhase('app');
  };

  if (phase === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        {/* ✅ COLORS.background au lieu de COLORS.bg (inexistant) */}
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (phase === 'intro')  return <DragonIntroScreen  onFinish={handleIntroFinish}  />;
  if (phase === 'region') return <RegionLanguageScreen onFinish={handleRegionFinish} />;

  return children;
}
