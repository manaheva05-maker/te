require('./setup');
const User = require('../src/models/User');
const Clan = require('../src/models/Clan');
const ClanMessage = require('../src/models/ClanMessage');
const ClanJoinRequest = require('../src/models/ClanJoinRequest');

const makeUser = async (suffix, ki = 2500) => new User({
  uid: `uid_${suffix}_${Date.now()}`,
  email: `${suffix}${Date.now()}@test.com`,
  username: `User_${suffix}_${Date.now()}`,
  ki
}).save();

const makeClan = async (shogun) => new Clan({
  name: `TestClan_${Date.now()}`,
  tag: `T${Math.floor(Math.random()*999)}`,
  shogun: shogun._id
}).save();

describe('Clan Chat + Recruitment', () => {

  test('créer un clan avec rang chunin', async () => {
    const user = await makeUser('shogun1', 2500);
    user.rank = 'chunin'; await user.save();
    const clan = await makeClan(user);
    expect(clan._id).toBeDefined();
    expect(clan.requiresApproval).toBe(true);
    expect(clan.chatEnabled).toBe(true);
    expect(clan.recruitmentOpen).toBe(true);
  });

  test('inviteCode généré correctement', async () => {
    const user = await makeUser('shogun2', 3000);
    const clan = await makeClan(user);
    const code = clan.generateInviteCode();
    await clan.save();
    expect(code).toHaveLength(8);
    expect(clan.inviteCode).toBe(code);
    expect(clan.inviteCodeExpiry).toBeDefined();
    expect(clan.inviteCodeExpiry > new Date()).toBe(true);
  });

  test('créer message de chat', async () => {
    const user = await makeUser('chat1', 2500);
    const clan = await makeClan(user);
    const msg = await ClanMessage.create({
      clan: clan._id,
      sender: user._id,
      senderUsername: user.username,
      senderRole: 'shogun',
      type: 'text',
      content: 'Bienvenue dans le clan !'
    });
    expect(msg._id).toBeDefined();
    expect(msg.content).toBe('Bienvenue dans le clan !');
    expect(msg.type).toBe('text');
    expect(msg.isPinned).toBe(false);
    expect(msg.deletedAt).toBeNull();
  });

  test('message système créé à la création du clan', async () => {
    const user = await makeUser('chat2', 3000);
    const clan = await makeClan(user);
    const sysMsg = await ClanMessage.create({
      clan: clan._id,
      sender: user._id,
      senderUsername: user.username,
      senderRole: 'shogun',
      type: 'system',
      content: `⛩️ Clan créé par ${user.username}`
    });
    expect(sysMsg.type).toBe('system');
  });

  test('épingler un message', async () => {
    const user = await makeUser('pin1', 2500);
    const clan = await makeClan(user);
    const msg = await ClanMessage.create({
      clan: clan._id, sender: user._id,
      senderUsername: user.username, senderRole: 'shogun',
      content: 'Message important'
    });
    msg.isPinned = true; await msg.save();
    const found = await ClanMessage.findById(msg._id);
    expect(found.isPinned).toBe(true);
  });

  test('réaction à un message', async () => {
    const user = await makeUser('react1', 2500);
    const clan = await makeClan(user);
    const msg = await ClanMessage.create({
      clan: clan._id, sender: user._id,
      senderUsername: user.username, senderRole: 'shogun', content: 'GG !'
    });
    msg.reactions.push({ emoji: '🔥', users: [user._id] });
    await msg.save();
    const found = await ClanMessage.findById(msg._id);
    expect(found.reactions.length).toBe(1);
    expect(found.reactions[0].emoji).toBe('🔥');
  });

  test('demande de rejoindre le clan', async () => {
    const shogun = await makeUser('req_sh', 3000);
    const applicant = await makeUser('req_ap', 1000);
    const clan = await makeClan(shogun);
    const req = await ClanJoinRequest.create({
      clan: clan._id,
      user: applicant._id,
      username: applicant.username,
      userRank: applicant.rank,
      userKI: applicant.ki,
      message: 'Je veux rejoindre !'
    });
    expect(req.status).toBe('pending');
    expect(req.clan.toString()).toBe(clan._id.toString());
  });

  test('approuver une demande', async () => {
    const shogun = await makeUser('appr_sh', 3000);
    const applicant = await makeUser('appr_ap', 1000);
    const clan = await makeClan(shogun);
    const req = await ClanJoinRequest.create({
      clan: clan._id, user: applicant._id,
      username: applicant.username, userRank: 'munou', userKI: 500
    });
    req.status = 'approved'; req.reviewedBy = shogun._id; req.reviewedAt = new Date();
    await req.save();
    clan.members.push(applicant._id); await clan.save();
    applicant.clan = clan._id; applicant.clanRole = 'ronin'; await applicant.save();
    const updated = await User.findById(applicant._id);
    expect(updated.clanRole).toBe('ronin');
    expect(updated.clan.toString()).toBe(clan._id.toString());
    const updatedReq = await ClanJoinRequest.findById(req._id);
    expect(updatedReq.status).toBe('approved');
  });

  test('rejeter une demande', async () => {
    const shogun = await makeUser('rej_sh', 3000);
    const applicant = await makeUser('rej_ap', 500);
    const clan = await makeClan(shogun);
    const req = await ClanJoinRequest.create({
      clan: clan._id, user: applicant._id,
      username: applicant.username, userRank: 'munou', userKI: 100
    });
    req.status = 'rejected'; req.rejectReason = 'Rang trop bas'; req.reviewedAt = new Date();
    await req.save();
    const found = await ClanJoinRequest.findById(req._id);
    expect(found.status).toBe('rejected');
    expect(found.rejectReason).toBe('Rang trop bas');
    // User still has no clan
    const u = await User.findById(applicant._id);
    expect(u.clan).toBeNull();
  });

  test('expiration des demandes', async () => {
    const shogun = await makeUser('exp_sh', 3000);
    const applicant = await makeUser('exp_ap', 500);
    const clan = await makeClan(shogun);
    const req = await ClanJoinRequest.create({
      clan: clan._id, user: applicant._id,
      username: applicant.username, userRank: 'munou', userKI: 100,
      expiresAt: new Date(Date.now() - 1000) // already expired
    });
    expect(req.expiresAt < new Date()).toBe(true);
  });

  test('récupérer messages du clan par ordre chronologique', async () => {
    const user = await makeUser('hist1', 2500);
    const clan = await makeClan(user);
    await ClanMessage.create({ clan: clan._id, sender: user._id, senderUsername: user.username, senderRole: 'shogun', content: 'Message 1' });
    await ClanMessage.create({ clan: clan._id, sender: user._id, senderUsername: user.username, senderRole: 'shogun', content: 'Message 2' });
    await ClanMessage.create({ clan: clan._id, sender: user._id, senderUsername: user.username, senderRole: 'shogun', content: 'Message 3' });
    const msgs = await ClanMessage.find({ clan: clan._id }).sort({ createdAt: 1 });
    expect(msgs.length).toBe(3);
    expect(msgs[0].content).toBe('Message 1');
    expect(msgs[2].content).toBe('Message 3');
  });
});
