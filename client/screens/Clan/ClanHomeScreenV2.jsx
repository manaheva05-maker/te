import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, Alert, ActivityIndicator, RefreshControl, Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { clanAPI } from '../../services/clanApi';
import { getClanSocket } from '../../services/clanSocket';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/colors';
import { getRankInfo, getSoulInfo, CLAN_RANKS } from '../../constants/ranks';

const ROLE_ICONS = { shogun: '👑', samurai: '⚔️', ronin: '🥋' };
const QUICK_REACTIONS = ['🔥', '💯', '⚔️', '🐉', '👑', '⚡'];

export default function ClanHomeScreenV2({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { t, lang } = useLang();
  const [tab, setTab] = useState(user?.clan ? 'chat' : 'explore');
  const [clan, setClan] = useState(null);
  const [clanList, setClanList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const chatRef = useRef(null);
  const typingTimer = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => { socketRef.current?.off(); };
  }, []);

  useEffect(() => {
    if (clan && tab === 'chat') setupSocket();
  }, [clan?._id, tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.clan) {
        const [clanData, msgData] = await Promise.all([
          clanAPI.get(user.clan),
          clanAPI.getMessages(user.clan, { limit: 50 })
        ]);
        setClan(clanData.clan);
        setMessages(msgData.messages || []);
        if (['shogun', 'samurai'].includes(user?.clanRole)) {
          const reqData = await clanAPI.getRequests(user.clan);
          setRequests(reqData.requests || []);
          setPendingCount(reqData.requests?.length || 0);
        }
      }
      const listData = await clanAPI.list({ limit: 30 });
      setClanList(listData.clans || []);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupSocket = () => {
    if (!clan?._id) return;
    const socket = getClanSocket();
    socketRef.current = socket;

    socket.emit('clan:join', { clanId: clan._id, userId: user._id });

    socket.on('clan:history', ({ messages: msgs }) => setMessages(msgs));

    socket.on('clan:message', ({ message }) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('clan:typing', ({ username }) => {
      if (username !== user.username) {
        setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      }
    });

    socket.on('clan:stop_typing', ({ username }) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    });

    socket.on('clan:new_request', () => {
      setPendingCount(c => c + 1);
    });

    socket.on('clan:react_update', ({ msgId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions } : m));
    });

    socket.on('clan:pinned', ({ message }) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    });
  };

  const sendMessage = () => {
    if (!msgText.trim() || !clan) return;
    socketRef.current?.emit('clan:message', {
      clanId: clan._id, userId: user._id, content: msgText.trim()
    });
    setMsgText('');
    socketRef.current?.emit('clan:stop_typing', {
      clanId: clan._id, userId: user._id, username: user.username
    });
  };

  const handleTyping = (text) => {
    setMsgText(text);
    socketRef.current?.emit('clan:typing', {
      clanId: clan._id, userId: user._id, username: user.username
    });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('clan:stop_typing', {
        clanId: clan._id, userId: user._id, username: user.username
      });
    }, 1500);
  };

  const reactToMessage = (msgId, emoji) => {
    socketRef.current?.emit('clan:react', {
      clanId: clan._id, msgId, userId: user._id, emoji
    });
  };

  const reviewRequest = async (reqId, action) => {
    try {
      await clanAPI.reviewRequest(user.clan, reqId, { action });
      setRequests(prev => prev.filter(r => r._id !== reqId));
      setPendingCount(c => Math.max(0, c - 1));
      if (action === 'approve') {
        Alert.alert('✅', lang === 'fr' ? 'Membre accepté !' : 'Member approved!');
        fetchData();
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const generateInvite = async () => {
    try {
      const data = await clanAPI.generateCode(clan._id);
      await Share.share({
        message: lang === 'fr'
          ? `Rejoins mon clan [${clan.tag}] sur SHINKEN !\nCode: ${data.inviteCode}\n${data.deepLink}`
          : `Join my clan [${clan.tag}] on SHINKEN!\nCode: ${data.inviteCode}\n${data.deepLink}`
      });
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const joinClan = async (clanId) => {
    try {
      const data = await clanAPI.requestJoin(clanId, { message: '' });
      if (data.joined) {
        await refreshUser(); fetchData(); setTab('chat');
        Alert.alert('✅', lang === 'fr' ? 'Clan rejoint !' : 'Joined!');
      } else {
        Alert.alert('📨', lang === 'fr' ? 'Demande envoyée !' : 'Request sent!');
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const clanRankInfo = (elo) =>
    CLAN_RANKS.slice().reverse().find(r => (elo || 0) >= r.elo) || CLAN_RANKS[0];

  // ─── TABS CONFIG ─────────────────────────────────────────────
  const tabConfig = user?.clan ? [
    { key: 'chat', label: '💬 Chat' },
    { key: 'members', label: '👥 Membres' },
    { key: 'requests', label: `📨${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'explore', label: '🔍' },
  ] : [
    { key: 'explore', label: '🔍 Explorer' }
  ];

  if (loading) return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        {tabConfig.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tab, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CHAT ── */}
      {tab === 'chat' && clan && (
        <View style={{ flex: 1 }}>
          <LinearGradient colors={['#1A1A2E', '#12121A']} style={s.chatHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.chatClanTag}>[{clan.tag}] {clan.name}</Text>
              <Text style={s.chatClanSub}>
                {clanRankInfo(clan.elo).icon} ELO {clan.elo} ·{' '}
                {(clan.members?.length || 0) + (clan.samurai?.length || 0) + 1}/30 membres
              </Text>
            </View>
            {['shogun', 'samurai'].includes(user?.clanRole) && (
              <TouchableOpacity onPress={generateInvite} style={s.inviteBtn}>
                <Ionicons name="link-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </LinearGradient>

          <FlatList
            ref={chatRef}
            data={messages}
            keyExtractor={(item, i) => item._id || String(i)}
            style={s.messageList}
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyChat}>
                <Text style={s.emptyChatText}>
                  💬 {lang === 'fr' ? 'Aucun message — sois le premier !' : 'No messages yet — be the first!'}
                </Text>
              </View>
            }
            renderItem={({ item: msg }) => {
              const isMe = String(msg.sender) === String(user?._id) || String(msg.sender?._id) === String(user?._id);
              const isSystem = msg.type === 'system';

              if (isSystem) return (
                <View style={s.systemMsg}>
                  <Text style={s.systemMsgText}>{msg.content}</Text>
                </View>
              );

              return (
                <View style={[s.msgRow, isMe && s.msgRowMe]}>
                  <View style={[s.bubble, isMe && s.bubbleMe]}>
                    {!isMe && (
                      <Text style={[s.bubbleSender, {
                        color: msg.senderRole === 'shogun' ? COLORS.gold
                          : msg.senderRole === 'samurai' ? COLORS.primary
                            : COLORS.textMuted
                      }]}>
                        {ROLE_ICONS[msg.senderRole]} {msg.senderUsername}
                      </Text>
                    )}
                    {msg.isPinned && <Text style={s.pinnedLabel}>📌 Épinglé</Text>}
                    <Text style={s.bubbleText}>{msg.content}</Text>
                    <Text style={s.bubbleTime}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {/* Reactions */}
                    {msg.reactions?.filter(r => r.users?.length > 0).length > 0 && (
                      <View style={s.reactionsRow}>
                        {msg.reactions.filter(r => r.users?.length > 0).map((r, i) => (
                          <TouchableOpacity
                            key={i}
                            style={s.reactionChip}
                            onPress={() => reactToMessage(msg._id, r.emoji)}
                          >
                            <Text style={{ fontSize: 12 }}>{r.emoji}</Text>
                            <Text style={s.reactionCount}>{r.users.length}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Quick react row */}
                    {!isMe && (
                      <View style={s.quickReacts}>
                        {QUICK_REACTIONS.map(emoji => (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() => reactToMessage(msg._id, emoji)}
                            style={s.quickReactBtn}
                          >
                            <Text style={{ fontSize: 13 }}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {typingUsers.length > 0 && (
            <View style={s.typingRow}>
              <Text style={s.typingText}>
                {typingUsers.join(', ')} {lang === 'fr' ? 'écrit...' : 'typing...'}
              </Text>
            </View>
          )}

          {clan.chatEnabled ? (
            <View style={s.inputRow}>
              <TextInput
                style={s.chatInput}
                value={msgText}
                onChangeText={handleTyping}
                placeholder={lang === 'fr' ? 'Message au clan...' : 'Message to clan...'}
                placeholderTextColor={COLORS.textDim}
                maxLength={500}
                onSubmitEditing={sendMessage}
                multiline
              />
              <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
                <Ionicons name="send" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.chatDisabled}>
              <Text style={s.chatDisabledText}>
                🔒 {lang === 'fr' ? 'Chat désactivé par le Shogun' : 'Chat disabled by Shogun'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── MEMBERS ── */}
      {tab === 'members' && clan && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />
          }
        >
          <LinearGradient colors={['#1A1A2E', '#12121A']} style={s.clanCard}>
            <Text style={s.clanCardTag}>[{clan.tag}] {clan.name}</Text>
            <View style={s.clanCardStats}>
              {[
                { val: clan.elo, label: 'ELO' },
                { val: `${(clan.members?.length || 0) + (clan.samurai?.length || 0) + 1}/30`, label: lang === 'fr' ? 'Membres' : 'Members' },
                { val: `💰 ${clan.treasury}`, label: lang === 'fr' ? 'Trésorerie' : 'Treasury' },
              ].map((st, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 15 }}>{st.val}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>{st.label}</Text>
                </View>
              ))}
            </View>
            {clan.description ? <Text style={s.clanCardDesc}>{clan.description}</Text> : null}
          </LinearGradient>

          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('ClanWar')}>
              <LinearGradient colors={[COLORS.secondary, '#5A0000']} style={s.actionBtnGrad}>
                <Text style={s.actionBtnText}>⚔️ Clan War</Text>
              </LinearGradient>
            </TouchableOpacity>
            {['shogun', 'samurai'].includes(user?.clanRole) && (
              <TouchableOpacity style={s.actionBtn} onPress={generateInvite}>
                <LinearGradient colors={['#1A2A1A', '#0A1A0A']} style={s.actionBtnGrad}>
                  <Text style={s.actionBtnText}>🔗 {lang === 'fr' ? 'Inviter' : 'Invite'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.sectionLabel}>👑 SHOGUN</Text>
          {clan.shogun && (
            <MemberRow member={clan.shogun} role="shogun" isMe={String(clan.shogun._id) === String(user?._id)} />
          )}

          {clan.samurai?.length > 0 && (
            <>
              <Text style={s.sectionLabel}>⚔️ SAMURAI ({clan.samurai.length}/3)</Text>
              {clan.samurai.map(m => (
                <MemberRow key={m._id} member={m} role="samurai"
                  isMe={String(m._id) === String(user?._id)}
                  canManage={user?.clanRole === 'shogun'}
                  onDemote={() => Alert.alert(lang === 'fr' ? 'Rétrograder ?' : 'Demote?', m.username, [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: 'OK', onPress: async () => { await clanAPI.promote(clan._id, m._id, 'ronin'); fetchData(); } }
                  ])}
                  onKick={() => Alert.alert('🚫', m.username, [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: lang === 'fr' ? 'Expulser' : 'Kick', style: 'destructive', onPress: async () => { await clanAPI.kick(clan._id, m._id); fetchData(); } }
                  ])}
                />
              ))}
            </>
          )}

          <Text style={s.sectionLabel}>🥋 RONIN ({clan.members?.length || 0})</Text>
          {clan.members?.map(m => (
            <MemberRow key={m._id} member={m} role="ronin"
              isMe={String(m._id) === String(user?._id)}
              canManage={['shogun', 'samurai'].includes(user?.clanRole)}
              onPromote={user?.clanRole === 'shogun' ? () => Alert.alert(lang === 'fr' ? 'Promouvoir Samurai ?' : 'Promote to Samurai?', m.username, [
                { text: t('common.cancel'), style: 'cancel' },
                { text: 'OK', onPress: async () => { await clanAPI.promote(clan._id, m._id, 'samurai'); fetchData(); } }
              ]) : null}
              onKick={() => Alert.alert('🚫', m.username, [
                { text: t('common.cancel'), style: 'cancel' },
                { text: lang === 'fr' ? 'Expulser' : 'Kick', style: 'destructive', onPress: async () => { await clanAPI.kick(clan._id, m._id); fetchData(); } }
              ])}
            />
          ))}

          {user?.clanRole !== 'shogun' && (
            <TouchableOpacity style={s.leaveBtn} onPress={() =>
              Alert.alert(t('clan.leave'), '', [
                { text: t('common.cancel'), style: 'cancel' },
                { text: lang === 'fr' ? 'Quitter' : 'Leave', style: 'destructive', onPress: async () => {
                  await clanAPI.leave(); await refreshUser(); fetchData(); setTab('explore');
                }}
              ])
            }>
              <Text style={s.leaveBtnText}>{t('clan.leave')}</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── REQUESTS ── */}
      {tab === 'requests' && (
        <ScrollView style={{ flex: 1, padding: SPACING.lg }}>
          <Text style={s.requestsTitle}>
            📨 {lang === 'fr' ? 'Demandes en attente' : 'Pending Requests'} ({requests.length})
          </Text>
          {requests.length === 0 ? (
            <Text style={s.noRequests}>
              {lang === 'fr' ? 'Aucune demande ✅' : 'No pending requests ✅'}
            </Text>
          ) : requests.map(req => (
            <View key={req._id} style={s.reqCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.reqName}>{req.username}</Text>
                <Text style={s.reqMeta}>
                  {getRankInfo(req.userRank)?.icon} {req.userRank?.toUpperCase()}
                  {' · '}{(req.userKI || 0).toLocaleString()} KI
                  {' · '}{getSoulInfo(req.userAura)?.icon}
                </Text>
                {req.message ? <Text style={s.reqMsg}>"{req.message}"</Text> : null}
                <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <View style={s.reqActions}>
                <TouchableOpacity style={s.approveBtn} onPress={() => reviewRequest(req._id, 'approve')}>
                  <Text style={{ fontSize: 18 }}>✅</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => reviewRequest(req._id, 'reject')}>
                  <Text style={{ fontSize: 18 }}>❌</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── EXPLORE ── */}
      {tab === 'explore' && (
        <View style={{ flex: 1 }}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, color: COLORS.text, fontSize: 13 }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={lang === 'fr' ? 'Rechercher un clan...' : 'Search clan...'}
              placeholderTextColor={COLORS.textDim}
            />
          </View>

          {!user?.clan && (
            <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('ClanCreate')}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={s.createBtnGrad}>
                <Text style={s.createBtnText}>+ {t('clan.create')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <FlatList
            data={clanList.filter(c =>
              !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.tag.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={c => c._id}
            contentContainerStyle={{ padding: SPACING.md }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={<Text style={s.noRequests}>{lang === 'fr' ? 'Aucun clan trouvé' : 'No clans found'}</Text>}
            renderItem={({ item: c, index: i }) => (
              <TouchableOpacity
                style={s.exploreCard}
                onPress={() => navigation.navigate('ClanDetail', { clanId: c._id })}
              >
                <Text style={[s.exploreRank, { color: i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : COLORS.textMuted }]}>
                  #{i + 1}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.exploreName}>[{c.tag}] {c.name}</Text>
                  <Text style={s.exploreSub}>
                    {clanRankInfo(c.elo).icon} ELO {c.elo} · 👑 {c.shogun?.username}
                    {' · '}{c.requiresApproval ? '🔒' : '🔓'}
                    {c.recruitmentOpen ? (lang === 'fr' ? ' Ouvert' : ' Open') : (lang === 'fr' ? ' Fermé' : ' Closed')}
                  </Text>
                </View>
                {!user?.clan && c.recruitmentOpen && (
                  <TouchableOpacity
                    style={s.joinChip}
                    onPress={() => navigation.navigate('ClanDetail', { clanId: c._id })}
                  >
                    <Text style={s.joinChipText}>{c.requiresApproval ? '📨' : '+'}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </LinearGradient>
  );
}

function MemberRow({ member, role, isMe, canManage, onPromote, onDemote, onKick }) {
  const rankInfo = getRankInfo(member?.rank);
  return (
    <View style={[s.memberRow, isMe && s.memberRowMe]}>
      <Text style={s.memberRoleIcon}>{ROLE_ICONS[role]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.memberName, isMe && { color: COLORS.primary }]}>{member?.username}</Text>
        <Text style={s.memberMeta}>
          <Text style={{ color: rankInfo?.color }}>{rankInfo?.icon} {rankInfo?.label}</Text>
          {'  '}{(member?.ki || 0).toLocaleString()} KI
        </Text>
      </View>
      {canManage && !isMe && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {onPromote && <TouchableOpacity onPress={onPromote} style={s.memberActionBtn}><Text>⬆️</Text></TouchableOpacity>}
          {onDemote && <TouchableOpacity onPress={onDemote} style={s.memberActionBtn}><Text>⬇️</Text></TouchableOpacity>}
          {onKick && <TouchableOpacity onPress={onKick} style={s.memberActionBtn}><Text>🚫</Text></TouchableOpacity>}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.sm, paddingTop: SPACING.sm, gap: 5 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },

  chatHeader: { padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatClanTag: { color: COLORS.primary, fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  chatClanSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  inviteBtn: { padding: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  messageList: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  emptyChat: { padding: SPACING.xl, alignItems: 'center' },
  emptyChatText: { color: COLORS.textMuted, fontSize: 12 },

  msgRow: { marginBottom: 6, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  bubbleMe: { backgroundColor: '#1A1A2E', borderColor: COLORS.primary + '44', borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  bubbleSender: { fontSize: 10, fontWeight: '700', marginBottom: 3 },
  pinnedLabel: { color: COLORS.primary, fontSize: 9, fontWeight: '700', marginBottom: 3 },
  bubbleText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  bubbleTime: { color: COLORS.textDim, fontSize: 9, marginTop: 3, textAlign: 'right' },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, gap: 3, borderWidth: 1, borderColor: COLORS.border },
  reactionCount: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  quickReacts: { flexDirection: 'row', gap: 3, marginTop: 4 },
  quickReactBtn: { padding: 2 },

  typingRow: { paddingHorizontal: SPACING.md, paddingVertical: 3 },
  typingText: { color: COLORS.textMuted, fontSize: 10, fontStyle: 'italic' },
  systemMsg: { alignItems: 'center', marginVertical: 4, paddingHorizontal: SPACING.md },
  systemMsgText: { color: COLORS.textDim, fontSize: 10, fontStyle: 'italic', textAlign: 'center' },
  inputRow: { flexDirection: 'row', padding: SPACING.sm, paddingHorizontal: SPACING.md, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatInput: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  chatDisabled: { padding: SPACING.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  chatDisabledText: { color: COLORS.textMuted, fontSize: 12 },

  clanCard: { margin: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '44' },
  clanCardTag: { color: COLORS.primary, fontWeight: '900', fontSize: 18, textAlign: 'center', marginBottom: SPACING.md },
  clanCardStats: { flexDirection: 'row', justifyContent: 'space-around' },
  clanCardDesc: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  actionBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  actionBtnGrad: { paddingVertical: SPACING.sm, alignItems: 'center' },
  actionBtnText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  memberRowMe: { backgroundColor: COLORS.surfaceLight + '88' },
  memberRoleIcon: { fontSize: 20, width: 28 },
  memberName: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  memberMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  memberActionBtn: { padding: 4, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.sm },
  leaveBtn: { margin: SPACING.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.md },
  leaveBtnText: { color: COLORS.danger, fontWeight: '700' },

  requestsTitle: { color: COLORS.text, fontWeight: '900', fontSize: 15, marginBottom: SPACING.md },
  noRequests: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl, fontSize: 12 },
  reqCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  reqName: { color: COLORS.text, fontWeight: '900', fontSize: 14 },
  reqMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  reqMsg: { color: COLORS.primary, fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  reqDate: { color: COLORS.textDim, fontSize: 10, marginTop: 4 },
  reqActions: { gap: 8, justifyContent: 'center' },
  approveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.success + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.success },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.danger + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.danger },

  searchBar: { flexDirection: 'row', alignItems: 'center', margin: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  createBtn: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.md, overflow: 'hidden' },
  createBtnGrad: { paddingVertical: SPACING.sm, alignItems: 'center' },
  createBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  exploreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  exploreRank: { fontWeight: '900', fontSize: 14, width: 30 },
  exploreName: { color: COLORS.text, fontWeight: '900', fontSize: 13 },
  exploreSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  joinChip: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  joinChipText: { fontSize: 16, color: COLORS.background, fontWeight: '900' },
});
