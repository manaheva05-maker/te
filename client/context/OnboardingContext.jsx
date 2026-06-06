import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@shinken_onboarding_done';
const STORAGE_STEP = '@shinken_onboarding_step';

const OnboardingContext = createContext();

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: { fr: 'Bienvenue dans SHINKEN', en: 'Welcome to SHINKEN' },
    desc: { fr: 'Ton savoir est ton arme.\nTa culture est ton pouvoir.', en: 'Your knowledge is your weapon.\nYour culture is your power.' },
    icon: '⛩️',
    target: null,
    action: null,
  },
  {
    id: 'soul',
    title: { fr: 'Ton Âme — ta spécialité', en: 'Your Soul — your specialty' },
    desc: { fr: "L'Âme définit ta catégorie de prédilection.\nElle influence tes bonus de KI en duel.", en: "Your Soul defines your specialty.\nIt influences your KI bonuses in duels." },
    icon: '👁️',
    target: 'soul_selector',
    action: null,
  },
  {
    id: 'ki',
    title: { fr: 'Le KI — ta ressource vitale', en: 'KI — your vital resource' },
    desc: { fr: 'Gagne du KI en jouant.\nPlus tu as de KI, plus ton rang monte.\nLe KI ne se reset jamais.', en: 'Earn KI by playing.\nThe more KI you have, the higher your rank.\nKI never resets.' },
    icon: '⚡',
    target: 'ki_bar',
    action: null,
  },
  {
    id: 'duel',
    title: { fr: 'Lance ton premier Duel !', en: 'Start your first Duel!' },
    desc: { fr: 'Choisis un mode, bans une catégorie\net prouve ta valeur !', en: 'Choose a mode, ban a category\nand prove your worth!' },
    icon: '⚔️',
    target: 'duel_tab',
    action: 'navigate_duel',
    highlight: true,
  },
  {
    id: 'clan',
    title: { fr: 'Rejoins un Clan', en: 'Join a Clan' },
    desc: { fr: 'Un clan = un groupe de chat privé\n+ Clan Wars + Tournois.\nRang minimum CHUNIN pour en créer un.', en: 'A clan = private group chat\n+ Clan Wars + Tournaments.\nMin rank CHUNIN to create one.' },
    icon: '🏯',
    target: 'clan_tab',
    action: 'navigate_clan',
  },
  {
    id: 'tournament',
    title: { fr: 'Les Tournois Mondiaux', en: 'World Tournaments' },
    desc: { fr: 'Inscris ton clan aux tournois.\nLes matchs sont diffusés en LIVE\navec cadeaux et prédictions.', en: 'Register your clan for tournaments.\nMatches are streamed LIVE\nwith gifts and predictions.' },
    icon: '🏆',
    target: 'tournament_btn',
    action: 'navigate_tournament',
  },
  {
    id: 'live',
    title: { fr: 'Le Live — expérience totale', en: 'Live — total experience' },
    desc: { fr: 'Regarde les matchs en direct.\nEnvoie des cadeaux, vote pour la Wildcard,\nparie du KI sur le vainqueur.', en: 'Watch matches live.\nSend gifts, vote for Wildcard,\nbet KI on the winner.' },
    icon: '🔴',
    target: 'live_btn',
    action: 'navigate_live',
  },
  {
    id: 'shop',
    title: { fr: 'La Boutique', en: 'The Shop' },
    desc: { fr: 'Achète des Ryū Coins pour des cosmétiques.\nAucun achat ne donne un avantage en jeu.\nLe skill reste 100% réel.', en: 'Buy Ryū Coins for cosmetics.\nNo purchase gives an in-game advantage.\nSkill stays 100% real.' },
    icon: '🛍️',
    target: 'shop_btn',
    action: 'navigate_shop',
  },
  {
    id: 'done',
    title: { fr: 'Tu es prêt, Guerrier !', en: 'You are ready, Warrior!' },
    desc: { fr: 'Bonne chance dans tes duels.\nQue ton savoir soit une lame acérée.', en: 'Good luck in your duels.\nMay your knowledge be a sharp blade.' },
    icon: '⛩️',
    target: null,
    action: 'finish',
    highlight: true,
  },
];

export const OnboardingProvider = ({ children }) => {
  const [isDone, setIsDone] = useState(true); // default true to avoid flash
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { checkOnboarding(); }, []);

  const checkOnboarding = async () => {
    try {
      const done = await AsyncStorage.getItem(STORAGE_KEY);
      const step = await AsyncStorage.getItem(STORAGE_STEP);
      if (!done) {
        setIsDone(false);
        setCurrentStep(step ? parseInt(step) : 0);
        setIsVisible(true);
      } else {
        setIsDone(true);
      }
    } catch {
      setIsDone(true);
    } finally {
      setLoaded(true);
    }
  };

  const nextStep = async () => {
    const next = currentStep + 1;
    if (next >= ONBOARDING_STEPS.length) {
      await finishOnboarding();
    } else {
      setCurrentStep(next);
      await AsyncStorage.setItem(STORAGE_STEP, String(next));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const skipOnboarding = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setIsDone(true);
    setIsVisible(false);
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(STORAGE_STEP);
    setIsDone(false);
    setCurrentStep(0);
    setIsVisible(true);
  };

  return (
    <OnboardingContext.Provider value={{
      isDone, isVisible, currentStep, loaded,
      nextStep, prevStep, skipOnboarding, resetOnboarding,
      totalSteps: ONBOARDING_STEPS.length,
      step: ONBOARDING_STEPS[currentStep],
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
