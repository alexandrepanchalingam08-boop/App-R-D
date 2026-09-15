import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { PHOTO_LABELS } from '../constants.js';
import { serializePhoto, sessionInclude } from '../serialize.js';
import { serializeSession } from '../serialize.js';
import { uploadPhoto } from '../storage.js';

// Kept under Vercel serverless functions' ~4.5MB request body ceiling.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Fichier non image refusé.'));
    cb(null, true);
  }
});

const router = Router();
router.use(requireAuth);

router.post('/:id/photos', upload.single('photo'), async (req, res, next) => {
  try {
    const session = await prisma.tastingSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ error: 'Session introuvable.' });
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });
    const label = PHOTO_LABELS.includes(req.body.label) ? req.body.label : 'ASPECT';

    const ext = path.extname(req.file.originalname || '') || '.jpg';
    const url = await uploadPhoto(req.file.buffer, `photo${ext}`, req.file.mimetype);

    const photo = await prisma.photo.create({
      data: { sessionId: session.id, url, label, uploadedById: req.user.id }
    });
    const full = await prisma.tastingSession.findUnique({ where: { id: session.id }, include: sessionInclude });
    res.status(201).json({ photo: serializePhoto(photo), session: serializeSession(full) });
  } catch (err) {
    next(err);
  }
});

export default router;
