const router = require('express').Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    if (targetId === myId.toString()) return res.status(400).json({ error: 'Tu ne peux pas te suivre toi-même' });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const alreadyFollowing = req.user.following.includes(targetId);
    if (alreadyFollowing) return res.status(409).json({ error: 'Déjà suivi' });

    await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });

    res.json({ following: true, followersCount: target.followers.length + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });

    const target = await User.findById(targetId);
    res.json({ following: false, followersCount: target?.followers.length ?? 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/followers', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username rank ki aura avatarUrl');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ followers: user.followers, count: user.followers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/following', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username rank ki aura avatarUrl');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ following: user.following, count: user.following.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const me = req.user;
    const suggestions = await User.find({
      _id: { $nin: [...me.following, me._id] },
      isBanned: false,
      aura: me.aura,
    })
      .select('username rank ki aura avatarUrl followers')
      .sort({ ki: -1 })
      .limit(10);

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
