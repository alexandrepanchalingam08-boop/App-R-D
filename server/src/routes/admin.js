import { Router } from 'express';
import { prisma } from '../db.js';
import { runSeed } from '../seedData.js';

const router = Router();

// One-time bootstrap: create the demo accounts + sample sessions. Guarded by
// a shared-secret query param rather than login, since there's nothing to
// log into yet on a freshly migrated, empty database. Safe to hit more than
// once — runSeed() skips re-seeding sessions if any already exist.
router.get('/seed', async (req, res) => {
  if (!process.env.SEED_TOKEN || req.query.token !== process.env.SEED_TOKEN) {
    return res.status(403).json({ error: 'Jeton invalide ou SEED_TOKEN non configuré.' });
  }
  try {
    const log = await runSeed();
    res.type('text/plain').send(log);
  } catch (err) {
    res.status(500).type('text/plain').send('Échec du seed : ' + err.message);
  }
});

router.get('/status', async (req, res) => {
  if (!process.env.SEED_TOKEN || req.query.token !== process.env.SEED_TOKEN) {
    return res.status(403).json({ error: 'Jeton invalide.' });
  }
  const [users, sessions] = await Promise.all([prisma.user.count(), prisma.tastingSession.count()]);
  res.json({ users, sessions });
});

export default router;
