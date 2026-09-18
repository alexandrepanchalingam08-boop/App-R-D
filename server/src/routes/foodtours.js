import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { ENSEIGNE_PHOTO_LABELS, ENSEIGNE_PHOTO_LABEL_TEXT } from '../constants.js';
import { serializeFoodTour, foodTourInclude } from '../serialize.js';
import { uploadPhoto } from '../storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUICK_RED = 'C00000';

// Logo et photo de couverture extraits du template PowerPoint Quick fourni —
// lus au premier export (pas au chargement du module : une erreur ici ne doit
// jamais empêcher le démarrage du serveur ni casser les autres routes).
let pptxAssetsCache = null;
function getPptxAssets() {
  if (!pptxAssetsCache) {
    pptxAssetsCache = {
      logo: 'image/png;base64,' + fs.readFileSync(path.join(__dirname, '../../assets/pptx-logo.png')).toString('base64'),
      cover: 'image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, '../../assets/pptx-cover.jpg')).toString('base64')
    };
  }
  return pptxAssetsCache;
}

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

function collectPhotoUrls(tour) {
  const urls = [];
  for (const enseigne of tour.enseignes) {
    for (const photo of enseigne.photos) urls.push(photo.url);
    for (const product of enseigne.products) for (const photo of product.photos) urls.push(photo.url);
  }
  return urls;
}

// Récupère toutes les photos d'un food tour en parallèle avant de construire
// le document — un fetch par photo en série pouvait, sur un food tour avec
// beaucoup de photos, dépasser le temps d'exécution alloué à la fonction
// serverless. Une photo indisponible ne doit pas faire échouer tout l'export,
// mais on journalise la vraie cause (visible dans les logs Vercel) plutôt que
// de la masquer.
async function fetchPhotoBuffers(urls) {
  const buffers = new Map();
  await Promise.all(
    urls.map(async (url) => {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!resp.ok) {
          console.error('Export food tour : réponse non-ok pour la photo', url, resp.status);
          return;
        }
        const buf = Buffer.from(await resp.arrayBuffer());
        const ext = (path.extname(new URL(url).pathname) || '.jpg').replace('.', '').toLowerCase();
        const extension = ext === 'jpg' ? 'jpeg' : ['png', 'jpeg', 'gif'].includes(ext) ? ext : 'jpeg';
        buffers.set(url, { buffer: buf, extension });
      } catch (err) {
        console.error('Export food tour : échec de récupération de la photo', url, err);
      }
    })
  );
  return buffers;
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
    const buffers = await fetchPhotoBuffers(collectPhotoUrls(tour));

    function addImageCell(rowIndex, url) {
      const img = buffers.get(url);
      if (!img) return;
      const imageId = workbook.addImage(img);
      sheet.addImage(imageId, { tl: { col: 4, row: rowIndex - 1 }, ext: { width: IMG_SIZE, height: IMG_SIZE } });
      sheet.getRow(rowIndex).height = IMG_SIZE * 0.75;
    }

    for (const enseigne of tour.enseignes) {
      for (const photo of enseigne.photos) {
        const row = sheet.addRow({ enseigne: enseigne.name, section: ENSEIGNE_PHOTO_LABEL_TEXT[photo.label] || photo.label, produit: '', commentaire: '' });
        addImageCell(row.number, photo.url);
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
            addImageCell(row.number, photo.url);
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

function truncate(text, max) {
  const t = (text || '').trim();
  return t.length > max ? t.slice(0, max - 1).trim() + '…' : t;
}

router.get('/:id/export.pptx', async (req, res, next) => {
  try {
    const tour = await loadFoodTour(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Food tour introuvable.' });

    const pptxAssets = getPptxAssets();
    const buffers = await fetchPhotoBuffers(collectPhotoUrls(tour));
    function imgData(url) {
      const img = buffers.get(url);
      return img ? `image/${img.extension};base64,` + img.buffer.toString('base64') : null;
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5"
    const SLIDE_W = 13.333;
    const SLIDE_H = 7.5;

    // Slide de couverture — reprend la mise en page "Titre" du template Quick :
    // photo pleine page + bandeau translucide + titre centré.
    const cover = pptx.addSlide();
    cover.background = { color: 'FFFFFF' };
    cover.addImage({ data: pptxAssets.cover, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H, sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H } });
    cover.addShape('rect', { x: 0, y: 4.3, w: SLIDE_W, h: 1.35, fill: { color: 'FFFFFF', transparency: 50 } });
    cover.addText(tour.lieu, {
      x: 0,
      y: 4.35,
      w: SLIDE_W,
      h: 0.9,
      align: 'center',
      valign: 'middle',
      fontFace: 'Impact',
      fontSize: 40,
      color: 'FFFFFF',
      isTextBox: true
    });
    cover.addText('Food tour du ' + tour.date, {
      x: 0,
      y: 5.2,
      w: SLIDE_W,
      h: 0.4,
      align: 'center',
      valign: 'middle',
      fontFace: 'Calibri',
      fontSize: 16,
      color: 'FFFFFF',
      isTextBox: true
    });

    const MAX_PRODUCTS = 6;
    const COLS = 3;
    const GRID_X = 0.5;
    const GRID_Y = 2.4;
    const GRID_W = SLIDE_W - 2 * GRID_X;
    const GAP = 0.25;
    const COL_W = (GRID_W - GAP * (COLS - 1)) / COLS;
    const IMG_H = 1.5;
    const CAP_H = 0.6;
    const ROW_H = IMG_H + CAP_H + 0.2;

    for (const enseigne of tour.enseignes) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };
      slide.addShape('rect', { x: 0, y: 0.14, w: SLIDE_W, h: 0.95, fill: { color: QUICK_RED } });
      slide.addImage({ data: pptxAssets.logo, x: 0.15, y: 0.07, w: 0.5, h: 0.845 });
      slide.addText(enseigne.name, {
        x: 0,
        y: 0.14,
        w: SLIDE_W,
        h: 0.95,
        align: 'center',
        valign: 'middle',
        fontFace: 'Impact',
        fontSize: 30,
        color: 'FFFFFF',
        isTextBox: true
      });

      let contentY = GRID_Y;
      if (enseigne.keyLearnings) {
        slide.addShape('rect', { x: GRID_X, y: 1.3, w: GRID_W, h: 0.9, fill: { color: 'FDE9E9' }, line: { type: 'none' } });
        slide.addText(
          [
            { text: 'Key learnings\n', options: { bold: true, color: QUICK_RED, fontSize: 13, breakLine: true } },
            { text: truncate(enseigne.keyLearnings, 220), options: { color: '3A3A3A', fontSize: 12 } }
          ],
          { x: GRID_X + 0.2, y: 1.4, w: GRID_W - 0.4, h: 0.7, valign: 'top', fontFace: 'Calibri', isTextBox: true, margin: 0 }
        );
      } else {
        contentY = 1.3;
      }

      const products = enseigne.products.slice(0, MAX_PRODUCTS);
      products.forEach((product, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = GRID_X + col * (COL_W + GAP);
        const y = contentY + row * ROW_H;
        const photoUrl = product.photos[0] && imgData(product.photos[0].url);
        if (photoUrl) {
          slide.addImage({ data: photoUrl, x, y, w: COL_W, h: IMG_H, sizing: { type: 'cover', w: COL_W, h: IMG_H } });
        } else {
          slide.addShape('rect', { x, y, w: COL_W, h: IMG_H, fill: { color: 'F2F2F2' }, line: { color: 'DDDDDD' } });
        }
        slide.addText(
          [
            { text: truncate(product.name, 40) + '\n', options: { bold: true, breakLine: true } },
            { text: truncate(product.comment, 90), options: { italic: true, color: '5A5A5A' } }
          ],
          { x, y: y + IMG_H + 0.05, w: COL_W, h: CAP_H, fontFace: 'Calibri', fontSize: 10, valign: 'top', isTextBox: true, margin: 0 }
        );
      });
    }

    const buf = await pptx.write({ outputType: 'nodebuffer' });
    const filename = `food-tour-${(tour.lieu || 'export').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pptx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buf);
  } catch (err) {
    next(err);
  }
});

export default router;
