import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { liveAPI } from '../../services/api';
import { getLiveSocket } from '../../services/socket';
import { GIFTS } from '../../constants/gifts';
import { SOULS } from '../../constants/ranks';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';

export default function LiveStreamScreen({ navigation, route }) {
  const { matchId } = route.params || {};
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [live, setLive] = useState(null);
  const [spectators, setSpectators] = useState(0);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [tab, setTab] = useState('chat'); // chat | gifts | vote
  const [scores, setScores] = useState({ clan1: 0, clan2: 0 });
  const [currentManche, setCurrentManche] = useState(1);
  const [giftEffect, setGiftEffect] = useState(null);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [kiStake, setKiStake] = useState('');
  const chatRef = useRef(null);
  const giftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLive();
    setupSocket();
    return () => {
      const socket = getLiveSocket();
      socket.emit('live:leave', { matchId, userId: user._id });
      socket.off('live:chat_message');
      socket.off('live:spectator_count');
      socket.off('live:gift_received');
      socket.off('live:score_update');
      socket.off('live:manche_start');
      socket.off('live:vote_update');
    };
  }, []);

  const fetchLive = async () => {
    try {
      const data = await liveAPI.get(matchId);
      setLive(data.live);
      setScores(data.live.scores);
      setCurrentManche(data.live.currentManche);
      setMessages(data.live.chatMessages?.slice(-50) || []);
      setSpectators(data.live.spectatorCount || 0);
    } catch {}
  };

  const setupSocket = () => {
    const socket = getLiveSocket();
    socket.emit('live:join', { matchId, userId: user._id, username: user.username });

    socket.on('live:chat_message', (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('live:spectator_count', ({ count }) => setSpectators(count));

    socket.on('live:gift_received', ({ gift, sender }) => {
      showGiftEffect(gift, sender);
    });

    socket.on('live:global_gift_notification', ({ sender, gift }) => {
      setGiftEffect({ type: 'global', sender, gift });
      setTimeout(() => setGiftEffect(null), 5000);
    });

    socket.on('live:score_update', ({ scores: s, currentManche: m }) => {
      setScores(s);
      setCurrentManche(m);
    });

    socket.on('live:manche_start', ({ manche, type }) => {
      setCurrentManche(manche);
    });

    socket.on('live:vote_update', ({ votes: v }) => setVotes(v));

    socket.on('live:pause', ({ reason, duration }) => {
      Alert.alert('⏸️ Pause', `${reason} (${duration}s)`);
    });
  };

  const showGiftEffect = (gift, sender) => {
    setGiftEffect({ gift, sender });
    Animated.sequence([
      Animated.timing(giftAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(giftAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setGiftEffect(null));
  };

  const sendMessage = () => {
    if (!msgText.trim()) return;
    const socket = getLiveSocket();
    socket.emit('live:chat_message', { matchId, userId: user._id, username: user.username, message: msgText.trim() });
    setMsgText('');
  };

  const sendGift = async (gift, recipientClanId) => {
    if (user.ryu_coins < gift.ryu) return Alert.alert('', 'Ryū Coins insuffisants');
    try {
      const result = await liveAPI.gift(matchId, {
        giftType: gift.key,
        recipientClanId
      });

      const socket = getLiveSocket();
      socket.emit('live:gift_sent', {
        matchId,
        gift,
        sender: { username: user.username },
        recipient: null,
        globalNotif: gift.globalNotif
      });

      Alert.alert(`${gift.emoji} Cadeau envoyé !`, `+${gift.ki} KI au clan`);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const castVote = (category) => {
    if (myVote) return;
    setMyVote(category);
    const socket = getLiveSocket();
    socket.emit('live:vote_cast', { matchId, category, votes });
  };

  const predict = async (winnerId) => {
    const ki = parseInt(kiStake);
    if (!ki || ki <= 0) return Alert.alert('', 'KI invalide');
    if (ki > user.ki) return Alert.alert('', 'KI insuffisant');
    try {
      await liveAPI.predict(matchId, { predictedWinner: winnerId, kiStaked: ki });
      Alert.alert('✅', `Pari de ${ki} KI placé !`);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const c1 = live?.clan1;
  const c2 = live?.clan2;
  const totalScore = (scores.clan1 || 0) + (scores.clan2 || 0);

  return (
    <LinearGradient colors={['#0A0A0F','#12121A']} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={s.liveIndicator}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>🔴 LIVE</Text>
          <Text style={s.spectators}>👁️ {spectators.toLocaleString()}</Text>
        </View>
        <Text style={s.mancheLabel}>M{currentManche}/5</Text>
      </View>

      {/* Score board */}
      <View style={s.scoreboard}>
        <View style={s.clanScore}>
          <Text style={s.clanTag}>[{c1?.tag || '???'}]</Text>
          <Text style={s.scoreNum}>{scores.clan1 || 0}</Text>
        </View>
        <View style={s.vsBox}>
          <Text style={s.vsText}>VS</Text>
          <Text style={s.mancheText}>Manche {currentManche}</Text>
        </View>
        <View style={[s.clanScore, { alignItems: 'flex-end' }]}>
          <Text style={s.clanTag}>[{c2?.tag || '???'}]</Text>
          <Text style={s.scoreNum}>{scores.clan2 || 0}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {totalScore > 0 && (
        <View style={s.progressBar}>
          <View style={[s.progressLeft, { flex: scores.clan1 || 1 }]} />
          <View style={[s.progressRight, { flex: scores.clan2 || 1 }]} />
        </View>
      )}

      {/* Gift effect overlay */}
      {giftEffect && (
        <Animated.View style={[s.giftOverlay, { opacity: giftAnim }]}>
          <Text style={s.giftEffectEmoji}>{giftEffect.gift?.emoji || '🎁'}</Text>
          <Text style={s.giftEffectText}>{giftEffect.sender?.username} → {giftEffect.gift?.label}</Text>
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {['chat','gifts','vote'].map(tabKey => (
          <TouchableOpacity key={tabKey} style={[s.tab, tab === tabKey && s.tabActive]} onPress={() => setTab(tabKey)}>
            <Text style={[s.tabText, tab === tabKey && s.tabTextActive]}>
              {tabKey === 'chat' ? `💬 ${t('live.chat')}` : tabKey === 'gifts' ? `🎁 ${t('live.gifts')}` : `🗳️ ${t('live.vote')}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.content}>
        {tab === 'chat' && (
          <>
            <FlatList
              ref={chatRef}
              data={messages}
              keyExtractor={(_, i) => i.toString()}
              style={s.chatList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={s.message}>
                  <Text style={s.msgUsername}>{item.username}: </Text>
                  <Text style={s.msgText}>{item.message}</Text>
                </View>
              )}
            />
            <View style={s.chatInput}>
              <TextInput
                style={s.input}
                value={msgText}
                onChangeText={setMsgText}
                placeholder="Message..."
                placeholderTextColor={COLORS.textDim}
                maxLength={100}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
                <Ionicons name="send" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {tab === 'gifts' && (
          <ScrollView style={s.giftsScroll} showsVerticalScrollIndicator={false}>
            <Text style={s.giftsBalance}>💎 {user?.ryu_coins || 0} Ryū Coins</Text>
            <Text style={s.giftsSubtitle}>Envoyer à quel clan ?</Text>

            {GIFTS.map(gift => (
              <View key={gift.key} style={s.giftRow}>
                <Text style={s.giftEmoji}>{gift.emoji}</Text>
                <View style={s.giftInfo}>
                  <Text style={s.giftName}>{gift.label}</Text>
                  <Text style={s.giftDesc}>{gift.description[lang]}</Text>
                  {gift.ki > 0 && <Text style={s.giftKI}>+{gift.ki} KI</Text>}
                </View>
                <View style={s.giftBtns}>
                  <TouchableOpacity style={[s.giftBtn, { borderColor: c1?.colors?.primary || COLORS.primary }]}
                    onPress={() => sendGift(gift, live?.clan1)}>
                    <Text style={s.giftBtnText}>{gift.ryu}RC</Text>
                    <Text style={s.giftBtnSub}>[{c1?.tag || 'C1'}]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.giftBtn, { borderColor: c2?.colors?.primary || COLORS.secondary }]}
                    onPress={() => sendGift(gift, live?.clan2)}>
                    <Text style={s.giftBtnText}>{gift.ryu}RC</Text>
                    <Text style={s.giftBtnSub}>[{c2?.tag || 'C2'}]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {tab === 'vote' && (
          <ScrollView style={s.voteScroll} showsVerticalScrollIndicator={false}>
            {/* Category vote */}
            <Text style={s.voteTitle}>🗳️ Catégorie Wildcard</Text>
            <Text style={s.voteSub}>Ta sélection influence la Manche 4</Text>
            <View style={s.voteGrid}>
              {SOULS.slice(0, 6).map(soul => {
                const count = votes[soul.key] || 0;
                const isVoted = myVote === soul.key;
                return (
                  <TouchableOpacity key={soul.key} style={[s.voteCard, isVoted && s.voteCardActive, myVote && !isVoted && s.voteCardDone]}
                    onPress={() => castVote(soul.key)} disabled={!!myVote}>
                    <Text style={s.voteEmoji}>{soul.icon}</Text>
                    <Text style={[s.voteLabel, isVoted && { color: COLORS.primary }]}>{soul.label}</Text>
                    <Text style={s.voteCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Predictions */}
            <Text style={s.voteTitle}>🎯 Prédictions</Text>
            <Text style={s.voteSub}>Mise du KI sur le vainqueur · x2 si correct</Text>
            <TextInput style={s.kiInput} value={kiStake} onChangeText={setKiStake}
              placeholder="KI à miser..." placeholderTextColor={COLORS.textDim}
              keyboardType="numeric" maxLength={6} />
            <View style={s.predictBtns}>
              <TouchableOpacity style={[s.predictBtn, { borderColor: COLORS.primary }]}
                onPress={() => predict(live?.clan1)}>
                <Text style={[s.predictText, { color: COLORS.primary }]}>{c1?.name || 'Clan 1'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.predictBtn, { borderColor: COLORS.secondary }]}
                onPress={() => predict(live?.clan2)}>
                <Text style={[s.predictText, { color: COLORS.secondary }]}>{c2?.name || 'Clan 2'}</Text>
              </TouchableOpacity>
            </View>

            {/* Top donators */}
            {live?.topDonators?.length > 0 && (
              <>
                <Text style={s.voteTitle}>👑 Top Mécènes</Text>
                {live.topDonators.slice(0, 3).map((d, i) => (
                  <View key={i} style={s.donatorRow}>
                    <Text style={s.donatorRank}>{['🥇','🥈','🥉'][i]}</Text>
                    <Text style={s.donatorName}>{d.username}</Text>
                    <Text style={s.donatorRC}>💎 {d.totalRC} RC</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  liveText: { color: COLORS.danger, fontWeight: '900', fontSize: FONTS.sizes.sm },
  spectators: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  mancheLabel: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
  scoreboard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface },
  clanScore: { flex: 1 },
  clanTag: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 2 },
  scoreNum: { color: COLORS.text, fontSize: 48, fontWeight: '900' },
  vsBox: { alignItems: 'center', paddingHorizontal: SPACING.md },
  vsText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  mancheText: { color: COLORS.textDim, fontSize: FONTS.sizes.xs },
  progressBar: { height: 4, flexDirection: 'row', marginBottom: SPACING.sm },
  progressLeft: { backgroundColor: COLORS.primary },
  progressRight: { backgroundColor: COLORS.secondary },
  giftOverlay: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 99 },
  giftEffectEmoji: { fontSize: 60 },
  giftEffectText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  content: { flex: 1 },
  chatList: { flex: 1, paddingHorizontal: SPACING.lg },
  message: { flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' },
  msgUsername: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  msgText: { color: COLORS.text, fontSize: FONTS.sizes.sm, flex: 1 },
  chatInput: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.sm, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  giftsScroll: { flex: 1, paddingHorizontal: SPACING.lg },
  giftsBalance: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  giftsSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center', marginBottom: SPACING.md },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  giftEmoji: { fontSize: 28, width: 36 },
  giftInfo: { flex: 1 },
  giftName: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm },
  giftDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  giftKI: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  giftBtns: { flexDirection: 'row', gap: SPACING.xs },
  giftBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center' },
  giftBtnText: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '900' },
  giftBtnSub: { color: COLORS.textMuted, fontSize: 9 },
  voteScroll: { flex: 1, paddingHorizontal: SPACING.lg },
  voteTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '900', marginTop: SPACING.md, marginBottom: 4 },
  voteSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.md },
  voteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  voteCard: { width: '30%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  voteCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  voteCardDone: { opacity: 0.5 },
  voteEmoji: { fontSize: 24, marginBottom: 4 },
  voteLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textAlign: 'center' },
  voteCount: { color: COLORS.textDim, fontSize: 10, marginTop: 2 },
  kiInput: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  predictBtns: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  predictBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, alignItems: 'center' },
  predictText: { fontWeight: '900', fontSize: FONTS.sizes.sm },
  donatorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  donatorRank: { fontSize: 20 },
  donatorName: { flex: 1, color: COLORS.text, fontWeight: '700' },
  donatorRC: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm },
});
