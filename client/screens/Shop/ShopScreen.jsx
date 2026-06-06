import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

const SHOP_ITEMS = {
  auras: [
    { id: 'aura_fire',    label: 'Aura Flamme',   emoji: '🔥', price: 199,  owned: false },
    { id: 'aura_thunder', label: 'Aura Foudre',   emoji: '⚡', price: 299,  owned: false },
    { id: 'aura_shadow',  label: 'Aura Ombre',    emoji: '🌑', price: 399,  owned: false },
    { id: 'aura_gold',    label: 'Aura Or',        emoji: '✨', price: 499,  owned: false },
  ],
  avatars: [
    { id: 'avatar_ryuken', label: 'Titan Ryūken', emoji: '🐉', price: 399, owned: false },
    { id: 'avatar_akuma',  label: 'Titan Akuma',  emoji: '😈', price: 399, owned: false },
    { id: 'avatar_shinken',label: 'Titan Shinken',emoji: '⛩️', price: 599, owned: false },
  ],
  boosts: [
    { id: 'boost_ki',    label: 'KI x2 — 24h',    emoji: '💫', price: 99,  owned: false },
    { id: 'soul_slot',   label: '2ème Âme',         emoji: '👁️', price: 299, owned: false },
    { id: 'reroll_5',    label: 'Question Reroll x5',emoji: '🔄', price: 199, owned: false },
  ],
};

const RC_PACKS = [
  { label: 'Starter',  rc: 100,  price: '0,99€',  bonus: '' },
  { label: 'Genin',    rc: 500,  price: '3,99€',  bonus: '' },
  { label: 'Jonin',    rc: 1200, price: '7,99€',  bonus: '+200 bonus' },
  { label: 'Kage',     rc: 3000, price: '17,99€', bonus: '+500 bonus' },
  { label: 'Daimyo',   rc: 7000, price: '39,99€', bonus: '+1500 bonus' },
];

export default function ShopScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState('rc');

  const buyItem = (item) => {
    if (user.ryu_coins < item.price) {
      return Alert.alert('💎', 'Ryū Coins insuffisants. Achète un pack !');
    }
    Alert.alert(`${item.emoji} ${item.label}`, `Acheter pour ${item.price} RC ?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('shop.buy'), onPress: () => Alert.alert('✅', 'Achat effectué !') }
    ]);
  };

  const buyRC = (pack) => {
    Alert.alert(`💎 ${pack.label}`, `${pack.rc} Ryū Coins pour ${pack.price}\n${pack.bonus}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: 'Acheter', onPress: () => Alert.alert('✅', `+${pack.rc} RC ajoutés !`) }
    ]);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🛍️ {t('shop.title').toUpperCase()}</Text>
        <View style={s.balance}>
          <Text style={s.balanceText}>💎 {user?.ryu_coins || 0} RC</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['rc','auras','avatars','boosts'].map(tabKey => (
          <TouchableOpacity key={tabKey} style={[s.tab, tab === tabKey && s.tabActive]} onPress={() => setTab(tabKey)}>
            <Text style={[s.tabText, tab === tabKey && s.tabTextActive]}>
              {tabKey === 'rc' ? '💎' : tabKey === 'auras' ? '✨' : tabKey === 'avatars' ? '🐉' : '⚡'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Battle Pass banner */}
        <TouchableOpacity style={s.bpBanner} onPress={() => navigation.navigate('BattlePass')}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.bpGrad}>
            <Text style={s.bpIcon}>⚔️</Text>
            <View style={s.bpInfo}>
              <Text style={s.bpTitle}>BATTLE PASS SAISONNIER</Text>
              <Text style={s.bpSub}>50 niveaux · Cosmétiques exclusifs</Text>
            </View>
            <Text style={s.bpPrice}>4,99€</Text>
          </LinearGradient>
        </TouchableOpacity>

        {tab === 'rc' && (
          <>
            <Text style={s.sectionTitle}>PACKS RYŪCOINS</Text>
            <Text style={s.sectionSub}>La monnaie premium de SHINKEN</Text>
            {RC_PACKS.map((pack, i) => (
              <TouchableOpacity key={i} style={s.rcCard} onPress={() => buyRC(pack)}>
                <LinearGradient colors={['#1A1A2E', '#12121A']} style={s.rcGrad}>
                  <Text style={s.rcEmoji}>💎</Text>
                  <View style={s.rcInfo}>
                    <Text style={s.rcLabel}>{pack.label}</Text>
                    <Text style={s.rcAmount}>{pack.rc.toLocaleString()} RC {pack.bonus ? <Text style={s.rcBonus}>{pack.bonus}</Text> : null}</Text>
                  </View>
                  <View style={s.rcPriceBox}>
                    <Text style={s.rcPrice}>{pack.price}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <Text style={s.notice}>⚠️ Les Ryū Coins n'affectent jamais les questions ni les résultats des duels.</Text>
          </>
        )}

        {tab === 'auras' && (
          <>
            <Text style={s.sectionTitle}>AURAS DE COMBAT</Text>
            <Text style={s.sectionSub}>Effets visuels en duel — psychologie de guerre</Text>
            <View style={s.grid}>
              {SHOP_ITEMS.auras.map(item => (
                <TouchableOpacity key={item.id} style={[s.itemCard, item.owned && s.itemOwned]} onPress={() => buyItem(item)}>
                  <Text style={s.itemEmoji}>{item.emoji}</Text>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  {item.owned
                    ? <Text style={s.ownedText}>{t('shop.owned')}</Text>
                    : <Text style={s.itemPrice}>💎 {item.price} RC</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tab === 'avatars' && (
          <>
            <Text style={s.sectionTitle}>TITANS — AVATARS</Text>
            <Text style={s.sectionSub}>Personnages légendaires animés</Text>
            <View style={s.grid}>
              {SHOP_ITEMS.avatars.map(item => (
                <TouchableOpacity key={item.id} style={[s.itemCard, item.owned && s.itemOwned]} onPress={() => buyItem(item)}>
                  <Text style={s.itemEmoji}>{item.emoji}</Text>
                  <Text style={s.itemLabel}>{item.label}</Text>
                  {item.owned
                    ? <Text style={s.ownedText}>{t('shop.owned')}</Text>
                    : <Text style={s.itemPrice}>💎 {item.price} RC</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {tab === 'boosts' && (
          <>
            <Text style={s.sectionTitle}>BOOSTS & AVANTAGES</Text>
            <Text style={s.sectionSub}>Confort — jamais pay-to-win</Text>
            {SHOP_ITEMS.boosts.map(item => (
              <TouchableOpacity key={item.id} style={s.boostCard} onPress={() => buyItem(item)}>
                <Text style={s.boostEmoji}>{item.emoji}</Text>
                <View style={s.boostInfo}>
                  <Text style={s.boostLabel}>{item.label}</Text>
                </View>
                {item.owned
                  ? <Text style={s.ownedText}>{t('shop.owned')}</Text>
                  : <Text style={s.itemPrice}>💎 {item.price} RC</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  title: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: 3 },
  balance: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  balanceText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: 18 },
  tabTextActive: { color: COLORS.primary },
  content: { paddingHorizontal: SPACING.lg },
  bpBanner: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
  bpGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  bpIcon: { fontSize: 32 },
  bpInfo: { flex: 1 },
  bpTitle: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.md },
  bpSub: { color: COLORS.background, fontSize: FONTS.sizes.xs, opacity: 0.8 },
  bpPrice: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.lg },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  sectionSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  itemCard: { width: '47%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  itemOwned: { borderColor: COLORS.success, opacity: 0.7 },
  itemEmoji: { fontSize: 36 },
  itemLabel: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm, textAlign: 'center' },
  itemPrice: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
  ownedText: { color: COLORS.success, fontWeight: '700', fontSize: FONTS.sizes.xs },
  rcCard: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  rcGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  rcEmoji: { fontSize: 28 },
  rcInfo: { flex: 1 },
  rcLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 1 },
  rcAmount: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  rcBonus: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  rcPriceBox: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  rcPrice: { color: COLORS.background, fontWeight: '900', fontSize: FONTS.sizes.sm },
  boostCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  boostEmoji: { fontSize: 28 },
  boostInfo: { flex: 1 },
  boostLabel: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md },
  notice: { color: COLORS.textDim, fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 18 },
});
