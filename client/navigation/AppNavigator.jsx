import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useOnboarding } from '../context/OnboardingContext';
import { COLORS } from '../constants/colors';
import { HomeIcon, SwordIcon, ShieldIcon, TrophyIcon, PersonIcon } from '../components/svg/Icons';

import OnboardingOverlay from '../screens/Onboarding/OnboardingOverlay';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/Onboarding/DragonIntroScreen';

import HomeScreen from '../screens/Home/HomeScreen';
import DuelScreen from '../screens/Duel/DuelScreen';
import BanPhaseScreen from '../screens/Duel/BanPhaseScreen';
import ResultScreen from '../screens/Duel/ResultScreen';
import BattleRoyaleScreen from '../screens/Duel/BattleRoyaleScreen';
import ClanHomeScreen from '../screens/Clan/ClanHomeScreen';
import ClanCreateScreen from '../screens/Clan/ClanCreateScreen';
import ClanWarScreen from '../screens/Clan/ClanWarScreen';
import ClanDetailScreen from '../screens/Clan/ClanDetailScreen';
import TournamentListScreen from '../screens/Tournament/TournamentListScreen';
import BracketScreen from '../screens/Tournament/BracketScreen';
import LiveStreamScreen from '../screens/Live/LiveStreamScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ShopScreen from '../screens/Shop/ShopScreen';
import BattlePassScreen from '../screens/Shop/BattlePassScreen';
import LeaderboardScreen from '../screens/Ranking/LeaderboardScreen';
import SenseiTrainingScreen from '../screens/Training/SenseiTrainingScreen';
import AdminDashboard from '../screens/Admin/AdminDashboard';
import AdminUsers from '../screens/Admin/AdminUsers';
import AdminQuestions from '../screens/Admin/AdminQuestions';
import AdminTournaments from '../screens/Admin/AdminTournaments';
import AdminLive from '../screens/Admin/AdminLive';
import CompetitionScreen from '../screens/Competition/CompetitionScreen';
import CompetitionDetailScreen from '../screens/Competition/CompetitionDetailScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import MusicPlayerScreen from '../screens/Music/MusicPlayerScreen';
import useDeepLinks from '../hooks/useDeepLinks';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.primary,
  headerTitleStyle: { fontWeight: 'bold', color: COLORS.text },
  contentStyle: { backgroundColor: COLORS.background },
};

const TabNavigator = () => {
  const { t } = useLang();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const p = { size, color };
        const map = {
          Home: <HomeIcon {...p} filled={focused} />,
          Duel: <SwordIcon {...p} />,
          Clan: <ShieldIcon {...p} />,
          Ranking: <TrophyIcon {...p} />,
          Profile: <PersonIcon {...p} filled={focused} />,
        };
        return map[route.name] || null;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: 60, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      headerShown: false,
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home.title') }} />
      <Tab.Screen name="Duel" component={DuelScreen} options={{ tabBarLabel: t('duel.title') }} />
      <Tab.Screen name="Clan" component={ClanHomeScreen} options={{ tabBarLabel: t('clan.title') }} />
      <Tab.Screen name="Ranking" component={LeaderboardScreen} options={{ tabBarLabel: t('ranking.title') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile.title') }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { isVisible } = useOnboarding();
  const navRef = React.useRef(null);
  useDeepLinks(navRef);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={screenOptions}>
          {!user ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="BanPhase" component={BanPhaseScreen} />
              <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false }} />
              <Stack.Screen name="BattleRoyale" component={BattleRoyaleScreen} />
              <Stack.Screen name="ClanCreate" component={ClanCreateScreen} />
              <Stack.Screen name="ClanWar" component={ClanWarScreen} />
              <Stack.Screen name="ClanDetail" component={ClanDetailScreen} options={{ title: 'Clan' }} />
              <Stack.Screen name="TournamentList" component={TournamentListScreen} />
              <Stack.Screen name="Bracket" component={BracketScreen} />
              <Stack.Screen name="Live" component={LiveStreamScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Shop" component={ShopScreen} />
              <Stack.Screen name="BattlePass" component={BattlePassScreen} />
              <Stack.Screen name="Training" component={SenseiTrainingScreen} />
              {user?.isAdmin && (
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin' }} />
                  <Stack.Screen name="AdminUsers" component={AdminUsers} />
                  <Stack.Screen name="AdminQuestions" component={AdminQuestions} />
                  <Stack.Screen name="AdminTournaments" component={AdminTournaments} />
                  <Stack.Screen name="AdminLive" component={AdminLive} />
                </>
              )}
              <Stack.Screen name="Competitions" component={CompetitionScreen} options={{ title: 'Competitions' }} />
              <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
              <Stack.Screen name="Music" component={MusicPlayerScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isVisible && <OnboardingOverlay />}
    </>
  );
};

export default AppNavigator;
