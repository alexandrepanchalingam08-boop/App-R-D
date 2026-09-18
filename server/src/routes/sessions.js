import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRD } from '../auth.js';
import { SESSION_KINDS, UNITS, GRILLE, PRIX_VENTE_UNITES } from '../constants.js';
import { serializeSession, serializeVersion, serializeGrade, sessionInclude } from '../serialize.js';

const router = Router();
router.use(requireAuth);

function parseComposition(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r, i) => ({
      name: String(r.name || '').trim(),
      dose: r.dose != null && String(r.dose).trim() !== '' ? String(r.dose).trim() : null,
      unit: UNITS.includes(r.unit) ? r.unit : 'g',
      refSessionId: r.refSessionId || r.ref || null,
      order: i
    }))
    .filter((r) => r.name);
}

function compositionToIngredients(rows) {
  return rows.map((r) => r.name + (r.dose ? ' ' + r.dose + ' ' + r.unit : ''));
}

function parseFreeIngredients(text) {
  return String(text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function loadSession(id) {
  return prisma.tastingSession.findUnique({ where: { id }, include: sessionInclude });
}

router.get('/', async (req, res) => {
  const sessions = await prisma.tastingSession.findMany({
    include: sessionInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json({ sessions: sessions.map(serializeSession) });
});

router.get('/:id', async (req, res) => {
  const s = await prisma.tastingSession.findUnique({ where: { id: req.params.id }, include: sessionInclude });
  if (!s) return res.status(404).json({ error: 'Session introuvable.' });
  res.json({ session: serializeSession(s) });
});

router.post('/', async (req, res) => {
  const { kind, name, project, supplier, date, ver, code, ingredients, composition, procede, prixVenteResto, prixVenteUber, prixVenteUnite } = req.body || {};
  if (!SESSION_KINDS.includes(kind)) return res.status(400).json({ error: 'Nature de fiche invalide.' });
  if (!name?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire.' });

  const isFull = kind === 'PRODUIT_COMPLET';
  const compRows = isFull ? parseComposition(composition) : [];
  if (isFull && !compRows.length) {
    return res.status(400).json({ error: 'Ajoutez au moins un ingrédient à la composition.' });
  }
  const freeIng = !isFull ? parseFreeIngredients(ingredients) : [];
  if (!isFull && !freeIng.length) {
    return res
      .status(400)
      .json({ error: "Renseignez au moins un ingrédient — c'est ce qui rend la session cherchable." });
  }

  const ingList = isFull ? compositionToIngredients(compRows) : freeIng;

  const session = await prisma.tastingSession.create({
    data: {
      kind,
      name: name.trim(),
      project: project?.trim() || 'Projet non renseigné',
      supplier: supplier?.trim() || 'Fournisseur non renseigné',
      prixVenteResto: kind === 'BENCHMARK' ? prixVenteResto?.trim() || null : null,
      prixVenteUber: kind === 'BENCHMARK' ? prixVenteUber?.trim() || null : null,
      prixVenteUnite: kind === 'BENCHMARK' && PRIX_VENTE_UNITES.includes(prixVenteUnite) ? prixVenteUnite : null,
      createdById: req.user.id,
      versions: {
        create: [
          {
            ver: ver?.trim() || 'V1',
            code: code?.trim() || null,
            date: date || new Date().toISOString().slice(0, 10),
            closed: false,
            ingredients: JSON.stringify(ingList),
            procede: procede?.trim() || null,
            composition: isFull
              ? { create: compRows.map((r) => ({ name: r.name, dose: r.dose, unit: r.unit, refSessionId: r.refSessionId, order: r.order })) }
              : undefined
          }
        ]
      }
    },
    include: sessionInclude
  });
  res.status(201).json({ session: serializeSession(session) });
});

router.delete('/:id', async (req, res) => {
  const s = await prisma.tastingSession.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: 'Session introuvable.' });
  await prisma.tastingSession.delete({ where: { id: s.id } });
  res.json({ ok: true });
});

router.post('/:id/versions', async (req, res) => {
  const session = await prisma.tastingSession.findUnique({ where: { id: req.params.id }, include: { versions: true } });
  if (!session) return res.status(404).json({ error: 'Session introuvable.' });

  const { ver, code, date, ingredients, composition, procede } = req.body || {};
  const isFull = session.kind === 'PRODUIT_COMPLET';
  const compRows = isFull ? parseComposition(composition) : [];
  const freeIng = !isFull ? parseFreeIngredients(ingredients) : [];
  const ingList = isFull ? compositionToIngredients(compRows) : freeIng;

  const version = await prisma.version.create({
    data: {
      sessionId: session.id,
      ver: ver?.trim() || 'V' + (session.versions.length + 1),
      code: code?.trim() || null,
      date: date || new Date().toISOString().slice(0, 10),
      closed: false,
      ingredients: JSON.stringify(ingList),
      procede: procede?.trim() || null,
      composition: isFull
        ? { create: compRows.map((r) => ({ name: r.name, dose: r.dose, unit: r.unit, refSessionId: r.refSessionId, order: r.order })) }
        : undefined
    },
    include: { composition: true, grades: true }
  });
  const full = await loadSession(session.id);
  res.status(201).json({ version: serializeVersion(version), session: serializeSession(full) });
});

router.patch('/:id/versions/:versionId/close', async (req, res) => {
  const version = await prisma.version.findFirst({ where: { id: req.params.versionId, sessionId: req.params.id } });
  if (!version) return res.status(404).json({ error: 'Version introuvable.' });
  const updated = await prisma.version.update({
    where: { id: version.id },
    data: { closed: true },
    include: { composition: true, grades: true }
  });
  const full = await loadSession(req.params.id);
  res.json({ version: serializeVersion(updated), session: serializeSession(full) });
});

router.delete('/:id/versions/:versionId', async (req, res) => {
  const version = await prisma.version.findFirst({ where: { id: req.params.versionId, sessionId: req.params.id } });
  if (!version) return res.status(404).json({ error: 'Version introuvable.' });
  await prisma.version.delete({ where: { id: version.id } });

  const remaining = await prisma.version.count({ where: { sessionId: req.params.id } });
  if (remaining === 0) {
    await prisma.tastingSession.delete({ where: { id: req.params.id } });
    return res.json({ ok: true, sessionDeleted: true });
  }
  const full = await loadSession(req.params.id);
  res.json({ ok: true, sessionDeleted: false, session: serializeSession(full) });
});

router.post('/:id/versions/:versionId/grades', async (req, res) => {
  const version = await prisma.version.findFirst({ where: { id: req.params.versionId, sessionId: req.params.id } });
  if (!version) return res.status(404).json({ error: 'Version introuvable.' });

  const { tasterName, hedonicRaw, profile, comment } = req.body || {};
  if (!tasterName?.trim()) return res.status(400).json({ error: "Indiquez votre nom avant d'enregistrer." });
  const h = Number(hedonicRaw);
  if (!Number.isFinite(h) || h < 1 || h > 9) return res.status(400).json({ error: 'Note hédonique invalide.' });

  const cleanProfile = {};
  GRILLE.forEach((c) => {
    const v = Number(profile?.[c.k]);
    cleanProfile[c.k] = Number.isFinite(v) ? Math.max(0, Math.min(10, v)) : 5;
  });

  const grade = await prisma.grade.create({
    data: {
      versionId: version.id,
      tasterName: tasterName.trim(),
      submittedById: req.user.id,
      hedonicRaw: h,
      note: (h * 10) / 9,
      profile: JSON.stringify(cleanProfile),
      jar: '{}',
      comment: comment?.trim() || 'Grille saisie sans commentaire.'
    }
  });
  const full = await loadSession(req.params.id);
  res.status(201).json({ grade: serializeGrade(grade), session: serializeSession(full) });
});

router.patch('/:id/buyer', requireRD, async (req, res) => {
  const { buyerId } = req.body || {};
  if (buyerId) {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer || (buyer.pole !== 'ACHATS' && !buyer.isAdmin)) {
      return res.status(400).json({ error: "L'acheteur doit appartenir au pôle Achats." });
    }
  }
  const session = await prisma.tastingSession.update({
    where: { id: req.params.id },
    data: { buyerId: buyerId || null },
    include: sessionInclude
  });
  res.json({ session: serializeSession(session) });
});

router.patch('/:id/fr', requireRD, async (req, res) => {
  const s = await prisma.tastingSession.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: 'Session introuvable.' });
  const session = await prisma.tastingSession.update({
    where: { id: s.id },
    data: { frPassed: !s.frPassed },
    include: sessionInclude
  });
  res.json({ session: serializeSession(session) });
});

router.patch('/:id/comite', requireRD, async (req, res) => {
  const { comiteDate } = req.body || {};
  const session = await prisma.tastingSession.update({
    where: { id: req.params.id },
    data: { comiteDate: comiteDate || null },
    include: sessionInclude
  });
  res.json({ session: serializeSession(session) });
});

router.put('/:id/price', async (req, res) => {
  const session = await prisma.tastingSession.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ error: 'Session introuvable.' });
  if (session.kind !== 'INGREDIENT') return res.status(400).json({ error: 'Réservé aux fiches Ingrédient.' });
  if (!session.frPassed) return res.status(403).json({ error: "Le passage en FR n'a pas encore été fait." });
  const isOwner = session.buyerId === req.user.id;
  if (!isOwner && !req.user.isAdmin) return res.status(403).json({ error: "Réservé à l'acheteur rattaché." });

  const { amount, dose, unit, date } = req.body || {};
  if (!amount?.toString().trim() || !dose?.toString().trim()) {
    return res.status(400).json({ error: 'Prix et dosage sont obligatoires.' });
  }
  const price = await prisma.price.upsert({
    where: { sessionId: session.id },
    create: {
      sessionId: session.id,
      amount: String(amount).trim(),
      dose: String(dose).trim(),
      unit: UNITS.includes(unit) ? unit : 'kg',
      date: date || new Date().toISOString().slice(0, 10),
      byUserId: req.user.id
    },
    update: {
      amount: String(amount).trim(),
      dose: String(dose).trim(),
      unit: UNITS.includes(unit) ? unit : 'kg',
      date: date || new Date().toISOString().slice(0, 10),
      byUserId: req.user.id
    }
  });
  const full = await loadSession(session.id);
  res.json({ price, session: serializeSession(full) });
});

export default router;
