import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin, hashPassword, publicUser } from '../auth.js';
import { POLES } from '../constants.js';

const router = Router();

router.use(requireAuth);

// All authenticated users can see the account roster (needed for taster-name
// suggestions, buyer assignment pickers, composition "rattacher" menus, etc.)
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: [{ pole: 'asc' }, { lastName: 'asc' }] });
  res.json({ users: users.map(publicUser) });
});

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

router.post('/', requireAdmin, async (req, res) => {
  const { firstName, lastName, pole, username, password } = req.body || {};
  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ error: 'Nom et prénom sont obligatoires.' });
  }
  if (!POLES.includes(pole)) return res.status(400).json({ error: 'Pôle invalide.' });
  const normalizedUsername = (username || '').toLowerCase().trim();
  if (!USERNAME_RE.test(normalizedUsername)) {
    return res.status(400).json({
      error: "Nom d'utilisateur invalide (3 à 32 caractères : lettres, chiffres, points, tirets, underscores)."
    });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe (8 caractères min.) requis.' });
  }
  const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existing) return res.status(409).json({ error: 'Ce compte existe déjà.' });

  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pole,
      username: normalizedUsername,
      passwordHash: hashPassword(password)
    }
  });
  res.status(201).json({ user: publicUser(user) });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: 'Compte introuvable.' });
  if (target.isAdmin) return res.status(400).json({ error: 'Impossible de retirer un compte administrateur.' });
  // Grades already entered stay: submittedById is left dangling via SetNull-like manual clear.
  await prisma.grade.updateMany({ where: { submittedById: target.id }, data: { submittedById: null } });
  await prisma.photo.updateMany({ where: { uploadedById: target.id }, data: { uploadedById: null } });
  await prisma.price.updateMany({ where: { byUserId: target.id }, data: { byUserId: null } });
  await prisma.tastingSession.updateMany({ where: { buyerId: target.id }, data: { buyerId: null } });
  await prisma.tastingSession.updateMany({ where: { createdById: target.id }, data: { createdById: null } });
  await prisma.user.delete({ where: { id: target.id } });
  res.json({ ok: true });
});

export default router;
