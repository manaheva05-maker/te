require('./setup');
const User = require('../src/models/User');

describe('Auth - User Model', () => {
  test('créer un utilisateur valide', async () => {
    const user = new User({
      uid: 'firebase_uid_001',
      email: 'test@shinken.app',
      username: 'TestUser',
      aura: 'shonen'
    });
    await user.save();
    expect(user._id).toBeDefined();
    expect(user.ki).toBe(0);
    expect(user.rank).toBe('munou');
    expect(user.language).toBe('fr');
  });

  test('rang auto munou → genin à 500 KI', async () => {
    const user = new User({
      uid: 'uid_rank_test',
      email: 'rank@shinken.app',
      username: 'RankUser',
      ki: 600
    });
    await user.save();
    expect(user.rank).toBe('genin');
  });

  test('rang shinken à 75000 KI', async () => {
    const user = new User({
      uid: 'uid_shinken',
      email: 'shinken@shinken.app',
      username: 'ShinkenUser',
      ki: 80000
    });
    await user.save();
    expect(user.rank).toBe('shinken');
  });

  test('email unique — doublon rejeté', async () => {
    await new User({ uid: 'uid1', email: 'dup@test.com', username: 'User1' }).save();
    const dup = new User({ uid: 'uid2', email: 'dup@test.com', username: 'User2' });
    await expect(dup.save()).rejects.toThrow();
  });

  test('username unique — doublon rejeté', async () => {
    await new User({ uid: 'uid3', email: 'a@test.com', username: 'SameName' }).save();
    const dup = new User({ uid: 'uid4', email: 'b@test.com', username: 'SameName' });
    await expect(dup.save()).rejects.toThrow();
  });

  test('admin flag email', async () => {
    const admin = new User({
      uid: 'admin_uid',
      email: 'inconnuboy39@gmail.com',
      username: 'AdminUser',
      isAdmin: true
    });
    await admin.save();
    expect(admin.isAdmin).toBe(true);
  });
});
