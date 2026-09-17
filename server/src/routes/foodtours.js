import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { ENSEIGNE_PHOTO_LABELS, ENSEIGNE_PHOTO_LABEL_TEXT } from '../constants.js';
import { serializeFoodTour, foodTourInclude } from '../serialize.js';
import { uploadPhoto } from '../storage.js';

// Kept under Vercel serverless functions' ~4.5MB request body ceiling
// (client already compresses photos before upload — see web/src/lib/image.js).
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

async function loadFoodTour(id) {
  return prisma.foodTour.findUnique({ where: { id }, include: foodTourInclude });
}

async function findEnseigne(foodTourId, enseigneId) {
  return prisma.enseigne.findFirst({ where: { id: enseigneId, foodTourId } });
}

router.get('/', async (req, res) => {
  const tours = await prisma.foodTour.findMany({
    include: foodTourInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json({ foodTours: tours.map(serializeFoodTour) });
});

router.post('/', async (req, res) => {
  const { lieu, date } = req.body || {};
  if (!lieu?.trim()) return res.status(400).json({ error: 'Le lieu est obligatoire.' });
  const tour = await prisma.foodTour.create({
    data: {
      lieu: lieu.trim(),
      date: date || new Date().toISOString().slice(0, 10),
      createdById: req.user.id
    },
    include: foodTourInclude
  });
  res.status(201).json({ foodTour: serializeFoodTour(tour) });
});

router.get('/:id', async (req, res) => {
  const tour = await loadFoodTour(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Food tour introuvable.' });
  res.json({ foodTour: serializeFoodTour(tour) });
});

router.delete('/:id', async (req, res) => {
  const tour = await prisma.foodTour.findUnique({ where: { id: req.params.id } });
  if (!tour) return res.status(404).json({ error: 'Food tour introuvable.' });
  await prisma.foodTour.delete({ where: { id: tour.id } });
  res.json({ ok: true });
});

router.post('/:id/enseignes', async (req, res) => {
  const tour = await prisma.foodTour.findUnique({ where: { id: req.params.id } });
  if (!tour) return res.status(404).json({ error: 'Food tour introuvable.' });
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Le nom de l'enseigne est obligatoire." });
  const count = await prisma.enseigne.count({ where: { foodTourId: tour.id } });
  await prisma.enseigne.create({
    data: { foodTourId: tour.id, name: name.trim(), order: count }
  });
  const full = await loadFoodTour(tour.id);
  res.status(201).json({ foodTour: serializeFoodTour(full) });
});

router.patch('/:id/enseignes/:eid', async (req, res) => {
  const enseigne = await findEnseigne(req.params.id, req.params.eid);
  if (!enseigne) return res.status(404).json({ error: 'Enseigne introuvable.' });
  const { name, keyLearnings } = req.body || {};
  await prisma.enseigne.update({
    where: { id: enseigne.id },
    data: {
      name: name != null ? name.trim() || enseigne.name : undefined,
      keyLearnings: keyLearnings != null ? keyLearnings.trim() || null : undefined
    }
  });
  const full = await loadFoodTour(req.params.id);
  res.json({ foodTour: serializeFoodTour(full) });
});

router.delete('/:id/enseignes/:eid', async (req, res) => {
  const enseigne = await findEnseigne(req.params.id, req.params.eid);
  if (!enseigne) return res.status(404).json({ error: 'Enseigne introuvable.' });
  await prisma.enseigne.delete({ where: { id: enseigne.id } });
  const full = await loadFoodTour(req.params.id);
  res.json({ foodTour: serializeFoodTour(full) });
});

router.post('/:id/enseignes/:eid/photos', upload.single('photo'), async (req, res, next) => {
  try {
    const enseigne = await findEnseigne(req.params.id, req.params.eid);
    if (!enseigne) return res.status(404).json({ error: 'Enseigne introuvable.' });
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });
    const label = ENSEIGNE_PHOTO_LABELS.includes(req.body.label) ? req.body.label : 'LIEU';

    const ext = path.extname(req.file.originalname || '') || '.jpg';
    const url = await uploadPhoto(req.file.buffer, `photo${ext}`, req.file.mimetype);

    await prisma.enseignePhoto.create({ data: { enseigneId: enseigne.id, url, label } });
    const full = await loadFoodTour(req.params.id);
    res.status(201).json({ foodTour: serializeFoodTour(full) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/enseignes/:eid/products', async (req, res) => {
  const enseigne = await findEnseigne(req.params.id, req.params.eid);
  if (!enseigne) return res.status(404).json({ error: 'Enseigne introuvable.' });
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Le nom du produit est obligatoire.' });
  const count = await prisma.product.count({ where: { enseigneId: enseigne.id } });
  await prisma.product.create({ data: { enseigneId: enseigne.id, name: name.trim(), order: count } });
  const full = await loadFoodTour(req.params.id);
  res.status(201).json({ foodTour: serializeFoodTour(full) });
});

router.patch('/:id/enseignes/:eid/products/:pid', async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.pid, enseigneId: req.params.eid } });
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  const { name, comment } = req.body || {};
  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: name != null ? name.trim() || product.name : undefined,
      comment: comment != null ? comment.trim() || null : undefined
    }
  });
  const full = await loadFoodTour(req.params.id);
  res.json({ foodTour: serializeFoodTour(full) });
});

router.delete('/:id/enseignes/:eid/products/:pid', async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.pid, enseigneId: req.params.eid } });
  if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
  await prisma.product.delete({ where: { id: product.id } });
  const full = await loadFoodTour(req.params.id);
  res.json({ foodTour: serializeFoodTour(full) });
});

router.post('/:id/enseignes/:eid/products/:pid/photos', upload.single('photo'), async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.pid, enseigneId: req.params.eid } });
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });

    const ext = path.extname(req.file.originalname || '') || '.jpg';
    const url = await uploadPhoto(req.file.buffer, `photo${ext}`, req.file.mimetype);

    await prisma.productPhoto.create({ data: { productId: product.id, url } });
    const full = await loadFoodTour(req.params.id);
    res.status(201).json({ foodTour: serializeFoodTour(full) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/export.xlsx', async (req, res, next) => {
  try {
    const tour = await loadFoodTour(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Food tour introuvable.' });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Food tour');
    sheet.columns = [
      { header: 'Enseigne', key: 'enseigne', width: 24 },
      { header: 'Section', key: 'section', width: 16 },
      { header: 'Produit', key: 'produit', width: 22 },
      { header: 'Commentaire', key: 'commentaire', width: 44 },
      { header: 'Photo', key: 'photo', width: 20 }
    ];
    sheet.getRow(1).font = { bold: true };

    const IMG_SIZE = 110;

    async function addImageCell(rowIndex, url) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return;
        const buf = Buffer.from(await resp.arrayBuffer());
        const ext = (path.extname(new URL(url).pathname) || '.jpg').replace('.', '').toLowerCase();
        const imageId = workbook.addImage({ buffer: buf, extension: ['png', 'jpg', 'jpeg', 'gif'].includes(ext) ? (ext === 'jpg' ? 'jpeg' : ext) : 'jpeg' });
        sheet.addImage(imageId, { tl: { col: 4, row: rowIndex - 1 }, ext: { width: IMG_SIZE, height: IMG_SIZE } });
        sheet.getRow(rowIndex).height = IMG_SIZE * 0.75;
      } catch {
        // Une photo indisponible ne doit pas faire échouer tout l'export.
      }
    }

    for (const enseigne of tour.enseignes) {
      for (const photo of enseigne.photos) {
        const row = sheet.addRow({ enseigne: enseigne.name, section: ENSEIGNE_PHOTO_LABEL_TEXT[photo.label] || photo.label, produit: '', commentaire: '' });
        await addImageCell(row.number, photo.url);
      }
      if (enseigne.keyLearnings) {
        sheet.addRow({ enseigne: enseigne.name, section: 'Key learnings', produit: '', commentaire: enseigne.keyLearnings });
      }
      for (const product of enseigne.products) {
        if (product.photos.length) {
          let first = true;
          for (const photo of product.photos) {
            const row = sheet.addRow({
              enseigne: enseigne.name,
              section: 'Produit',
              produit: product.name,
              commentaire: first ? product.comment : ''
            });
            first = false;
            await addImageCell(row.number, photo.url);
          }
        } else {
          sheet.addRow({ enseigne: enseigne.name, section: 'Produit', produit: product.name, commentaire: product.comment });
        }
      }
    }

    const filename = `food-tour-${(tour.lieu || 'export').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
