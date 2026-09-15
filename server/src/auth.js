import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

export function checkPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    pole: u.pole,
    isAdmin: u.isAdmin
  };
}

export async function requireAuth(req, res, next) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Non authentifié.' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session invalide.' });
  }
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Réservé aux administrateurs.' });
  next();
}

export function requireRD(req, res, next) {
  if (req.user.pole !== 'RD' && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Réservé au pôle R&D.' });
  }
  next();
}

export function requireBuyer(req, res, next) {
  if (req.user.pole !== 'ACHATS' && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Réservé au pôle Achats.' });
  }
  next();
}
