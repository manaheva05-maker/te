import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './client/context/AuthContext';
import { LangProvider } from './client/context/LangContext';
import { GameProvider } from './client/context/GameContext';
import { OnboardingProvider } from './client/context/OnboardingContext';
import AppNavigator from './client/navigation/AppNavigator';
import AppEntry from './client/navigation/AppEntry';
import { initApiUrl } from './client/services/api';

export default function App() {
  useEffect(() => {
    initApiUrl();
  }, []);

  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <AuthProvider>
            <OnboardingProvider>
              <GameProvider>
                <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
                <AppEntry>
                  <AppNavigator />
                </AppEntry>
              </GameProvider>
            </OnboardingProvider>
          </AuthProvider>
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
