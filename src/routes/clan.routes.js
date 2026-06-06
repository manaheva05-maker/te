const router = require('express').Router();
const Clan = require('../models/Clan');
const User = require('../models/User');
const ClanMessage = require('../models/ClanMessage');
const ClanJoinRequest = require('../models/ClanJoinRequest');
const authMiddleware = require('../middleware/auth.middleware');

const RANK_ORDER = ['munou','genin','chunin','jonin','kage','akatsuki','ryuken','shinken'];

// ─── CREATE ───────────────────────────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, tag, description, rules, colors, requiresApproval, minRankRequired, isPublic } = req.body;
    if (!['chunin','jonin','kage','akatsuki','ryuken','shinken'].includes(req.user.rank)) {
      return res.status(403).json({ error: 'Rang minimum CHUNIN requis' });
    }
    if (req.user.clan) return res.status(400).json({ error: 'Déjà dans un clan' });

    const clan = new Clan({
      name, tag: tag.toUpperCase(), shogun: req.user._id,
      description: description || '', rules: rules || '',
      colors: colors || {}, requiresApproval: requiresApproval !== false,
      minRankRequired: minRankRequired || 'munou', isPublic: isPublic !== false
    });
    await clan.save();

    req.user.clan = clan._id; req.user.clanRole = 'shogun';
    await req.user.save();

    await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: 'shogun', type: 'system', content: `⛩️ Clan "${clan.name}" créé par ${req.user.username}. Bienvenue !` });
    res.status(201).json({ clan });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Nom ou tag déjà pris' });
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST ─────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { isPublic: true };
    if (search) filter.name = new RegExp(search, 'i');
    const clans = await Clan.find(filter).sort({ elo: -1 }).skip((page-1)*limit).limit(parseInt(limit)).populate('shogun', 'username rank ki');
    const total = await Clan.countDocuments(filter);
    res.json({ clans, total, pages: Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DETAIL ───────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id)
      .populate('shogun', 'username rank ki avatar aura stats')
      .populate('samurai', 'username rank ki avatar aura')
      .populate('members', 'username rank ki avatar aura');
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const myRequest = await ClanJoinRequest.findOne({ clan: clan._id, user: req.user._id, status: 'pending' });
    const allMembers = [clan.shogun, ...clan.samurai, ...clan.members].filter(Boolean).sort((a,b)=>(b.ki||0)-(a.ki||0));
    res.json({ clan, myRequest: myRequest||null, leaderboard: allMembers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── REQUEST TO JOIN ──────────────────────────────────────────
router.post('/:id/request', authMiddleware, async (req, res) => {
  try {
    if (req.user.clan) return res.status(400).json({ error: 'Déjà dans un clan' });
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    if (!clan.recruitmentOpen) return res.status(400).json({ error: 'Recrutement fermé' });
    if (RANK_ORDER.indexOf(req.user.rank) < RANK_ORDER.indexOf(clan.minRankRequired)) {
      return res.status(403).json({ error: `Rang minimum: ${clan.minRankRequired.toUpperCase()}` });
    }
    if (clan.members.length + clan.samurai.length + 1 >= 30) return res.status(400).json({ error: 'Clan complet' });
    const existing = await ClanJoinRequest.findOne({ clan: clan._id, user: req.user._id, status: 'pending' });
    if (existing) return res.status(409).json({ error: 'Demande déjà envoyée' });

    if (!clan.requiresApproval) {
      clan.members.push(req.user._id); clan.lastActive = new Date(); await clan.save();
      req.user.clan = clan._id; req.user.clanRole = 'ronin'; await req.user.save();
      await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: 'ronin', type: 'system', content: `🥋 ${req.user.username} a rejoint le clan !` });
      return res.json({ joined: true, clan });
    }

    const request = await ClanJoinRequest.create({ clan: clan._id, user: req.user._id, username: req.user.username, userRank: req.user.rank, userKI: req.user.ki, userAura: req.user.aura, message: req.body.message || '' });
    res.status(201).json({ request, joined: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── JOIN VIA CODE ────────────────────────────────────────────
router.post('/invite/:code/join', authMiddleware, async (req, res) => {
  try {
    if (req.user.clan) return res.status(400).json({ error: 'Déjà dans un clan' });
    const clan = await Clan.findOne({ inviteCode: req.params.code.toUpperCase(), inviteCodeExpiry: { $gt: new Date() } });
    if (!clan) return res.status(404).json({ error: 'Code invalide ou expiré' });
    if (clan.members.length + clan.samurai.length + 1 >= 30) return res.status(400).json({ error: 'Clan complet' });
    clan.members.push(req.user._id); clan.lastActive = new Date(); await clan.save();
    req.user.clan = clan._id; req.user.clanRole = 'ronin'; await req.user.save();
    await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: 'ronin', type: 'system', content: `🔗 ${req.user.username} a rejoint via lien d'invitation !` });
    res.json({ clan, joined: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LIST REQUESTS (Shogun/Samurai) ──────────────────────────
router.get('/:id/requests', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const canReview = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString());
    if (!canReview) return res.status(403).json({ error: 'Accès refusé' });
    const requests = await ClanJoinRequest.find({ clan: clan._id, status: 'pending' }).populate('user', 'username rank ki aura avatar').sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── REVIEW REQUEST ───────────────────────────────────────────
router.patch('/:id/requests/:reqId', authMiddleware, async (req, res) => {
  try {
    const { action, rejectReason } = req.body;
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const canReview = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString());
    if (!canReview) return res.status(403).json({ error: 'Accès refusé' });
    const request = await ClanJoinRequest.findById(req.params.reqId).populate('user');
    if (!request || request.status !== 'pending') return res.status(404).json({ error: 'Demande introuvable' });
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user._id; request.reviewedAt = new Date();
    if (rejectReason) request.rejectReason = rejectReason;
    await request.save();
    if (action === 'approve') {
      if (clan.members.length + clan.samurai.length + 1 >= 30) return res.status(400).json({ error: 'Clan complet' });
      clan.members.push(request.user._id); clan.lastActive = new Date(); await clan.save();
      request.user.clan = clan._id; request.user.clanRole = 'ronin'; await request.user.save();
      await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: req.user.clanRole, type: 'system', content: `✅ ${request.username} a été accepté par ${req.user.username} !` });
    }
    res.json({ request, action });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GENERATE INVITE CODE ─────────────────────────────────────
router.post('/:id/invite-code', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const canGen = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString());
    if (!canGen) return res.status(403).json({ error: 'Accès refusé' });
    const code = clan.generateInviteCode(); await clan.save();
    res.json({ inviteCode: code, expiresAt: clan.inviteCodeExpiry, deepLink: `shinken://clan/invite/${code}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LEAVE ────────────────────────────────────────────────────
router.post('/leave', authMiddleware, async (req, res) => {
  try {
    if (!req.user.clan) return res.status(400).json({ error: 'Pas dans un clan' });
    if (req.user.clanRole === 'shogun') return res.status(400).json({ error: 'Transfère le titre avant de quitter' });
    const clan = await Clan.findById(req.user.clan);
    if (clan) {
      clan.members = clan.members.filter(m=>m.toString()!==req.user._id.toString());
      clan.samurai = clan.samurai.filter(s=>s.toString()!==req.user._id.toString());
      await clan.save();
      await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: req.user.clanRole, type: 'system', content: `👋 ${req.user.username} a quitté le clan.` });
    }
    req.user.clan = null; req.user.clanRole = 'ronin'; await req.user.save();
    res.json({ message: 'Clan quitté' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PROMOTE/DEMOTE ───────────────────────────────────────────
router.patch('/:id/members/:userId/role', authMiddleware, async (req, res) => {
  try {
    const { newRole } = req.body;
    const clan = await Clan.findById(req.params.id);
    if (!clan || clan.shogun.toString()!==req.user._id.toString()) return res.status(403).json({ error: 'Shogun uniquement' });
    const target = await User.findById(req.params.userId);
    if (!target || target.clan?.toString()!==clan._id.toString()) return res.status(404).json({ error: 'Membre introuvable' });
    if (newRole === 'samurai') {
      clan.members = clan.members.filter(m=>m.toString()!==target._id.toString());
      if (!clan.samurai.some(s=>s.toString()===target._id.toString())) {
        if (clan.samurai.length >= 3) return res.status(400).json({ error: 'Max 3 Samurai' });
        clan.samurai.push(target._id);
      }
    } else {
      clan.samurai = clan.samurai.filter(s=>s.toString()!==target._id.toString());
      if (!clan.members.some(m=>m.toString()===target._id.toString())) clan.members.push(target._id);
    }
    await clan.save(); target.clanRole = newRole; await target.save();
    await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: 'shogun', type: 'system', content: `⚡ ${target.username} est maintenant ${newRole.toUpperCase()} !` });
    res.json({ message: `${target.username} → ${newRole}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── KICK ─────────────────────────────────────────────────────
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const isShogun = clan.shogun.toString()===req.user._id.toString();
    const isSamurai = clan.samurai.some(s=>s.toString()===req.user._id.toString());
    if (!isShogun && !isSamurai) return res.status(403).json({ error: 'Accès refusé' });
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });
    clan.members = clan.members.filter(m=>m.toString()!==target._id.toString());
    clan.samurai = clan.samurai.filter(s=>s.toString()!==target._id.toString());
    await clan.save(); target.clan = null; target.clanRole = 'ronin'; await target.save();
    await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: req.user.clanRole, type: 'system', content: `🚫 ${target.username} a été expulsé.` });
    res.json({ message: `${target.username} expulsé` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── MESSAGES ─────────────────────────────────────────────────
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const isMember = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString()) || clan.members.some(m=>m.toString()===req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Membres uniquement' });
    const { before, limit = 50 } = req.query;
    const query = { clan: clan._id, deletedAt: null };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await ClanMessage.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ messages: messages.reverse() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, type } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message vide' });
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const isMember = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString()) || clan.members.some(m=>m.toString()===req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'Membres uniquement' });
    if (clan.announcementOnly) {
      const canWrite = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString());
      if (!canWrite) return res.status(403).json({ error: 'Mode annonce actif' });
    }
    const message = await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: req.user.clanRole, type: type||'text', content: content.trim() });
    res.status(201).json({ message });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages/:msgId/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const msg = await ClanMessage.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    const ex = msg.reactions.find(r=>r.emoji===emoji);
    if (ex) { const idx = ex.users.findIndex(u=>u.toString()===req.user._id.toString()); idx>=0?ex.users.splice(idx,1):ex.users.push(req.user._id); }
    else msg.reactions.push({ emoji, users: [req.user._id] });
    await msg.save(); res.json({ message: msg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/messages/:msgId/pin', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ error: 'Clan introuvable' });
    const canPin = clan.shogun.toString()===req.user._id.toString() || clan.samurai.some(s=>s.toString()===req.user._id.toString());
    if (!canPin) return res.status(403).json({ error: 'Accès refusé' });
    const msg = await ClanMessage.findByIdAndUpdate(req.params.msgId, { isPinned: req.body.pinned !== false }, { new: true });
    res.json({ message: msg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SETTINGS ─────────────────────────────────────────────────
router.patch('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan || clan.shogun.toString()!==req.user._id.toString()) return res.status(403).json({ error: 'Shogun uniquement' });
    ['description','rules','requiresApproval','recruitmentOpen','minRankRequired','isPublic','chatEnabled','announcementOnly','colors'].forEach(f => {
      if (req.body[f] !== undefined) clan[f] = req.body[f];
    });
    await clan.save(); res.json({ clan });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── TREASURY ─────────────────────────────────────────────────
router.post('/treasury/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!req.user.clan) return res.status(400).json({ error: 'Pas dans un clan' });
    if (req.user.ryu_coins < amount) return res.status(400).json({ error: 'RC insuffisants' });
    const clan = await Clan.findById(req.user.clan);
    clan.treasury += amount; clan.stats.total_ki_donated += amount; await clan.save();
    req.user.ryu_coins -= amount; await req.user.save();
    await ClanMessage.create({ clan: clan._id, sender: req.user._id, senderUsername: req.user.username, senderRole: req.user.clanRole, type: 'system', content: `💰 ${req.user.username} a contribué ${amount} RC à la trésorerie !` });
    res.json({ treasury: clan.treasury, ryu_coins: req.user.ryu_coins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
