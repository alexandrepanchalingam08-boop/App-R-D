import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
  { first: 'Amélie', last: 'Rouvier', pole: 'RD', admin: true, email: 'amelie.rouvier@quick.fr' },
  { first: 'Karim', last: 'Benali', pole: 'RD', email: 'karim.benali@quick.fr' },
  { first: 'Sophie', last: 'Lemoine', pole: 'QUALITE', email: 'sophie.lemoine@quick.fr' },
  { first: 'Thomas', last: 'Vasseur', pole: 'MARKETING', email: 'thomas.vasseur@quick.fr' },
  { first: 'Inès', last: 'Maréchal', pole: 'ACHATS', email: 'ines.marechal@quick.fr' },
  { first: 'Julien', last: 'Perrot', pole: 'RD', email: 'julien.perrot@quick.fr' }
];
const DEFAULT_PASSWORD = 'Degustation2026!';

const GRILLE_KEYS = [
  'couleur', 'homog', 'odeur', 'fermete', 'fondant', 'sucre', 'sale', 'acide', 'amer', 'arome', 'persist', 'arriere'
];

const PANEL = ['Amélie R.', 'Karim B.', 'Sophie L.', 'Thomas V.', 'Inès M.', 'Julien P.'];

const QUOTES = [
  'Attaque franche, cacao bien présent mais finale un peu courte.',
  'Trop sucré à mon goût, masque les arômes de torréfaction.',
  'Texture très agréable, rien à redire sur la tenue.',
  'Léger arrière-goût amer qui reste après déglutition.',
  'Belle rondeur, la fleur de sel apporte du relief.',
  "Manque de fondant, on sent l'amidon.",
  'La meilleure des versions, nette préférence.',
  'Acidité bien dosée, équilibrée par le sucre.'
];

const SEED = [
  {
    id: 's1', kind: 'PRODUIT_COMPLET', name: 'Crème dessert chocolat', project: 'Dessert 2026', supplier: 'Cacao Nord',
    prof: { couleur: 7, homog: 6.5, odeur: 6, fermete: 5, fondant: 6.5, sucre: 6.5, sale: 1.5, acide: 1.5, amer: 3, arome: 6, persist: 6, arriere: 3 },
    versions: [
      { ver: 'V1', code: 'CDC-221', date: '2026-02-11', base: 5.3, n: 4, closed: true, ing: ['cacao 22%', 'lait entier', 'amidon de maïs', 'sucre'] },
      { ver: 'V2', code: 'CDC-228', date: '2026-04-23', base: 6.7, n: 5, closed: true, ing: ['cacao 28%', 'lait entier', 'amidon de maïs', 'sucre'] },
      { ver: 'V3', code: 'CDC-284', date: '2026-07-09', base: 7.8, n: 5, closed: true, ing: ['cacao 28%', 'crème', 'amidon de maïs', 'sucre de canne', 'fleur de sel'] },
      { ver: 'V4', code: 'CDC-291', date: '2026-09-12', base: 7.4, n: 3, closed: false, ing: ['cacao 28%', 'crème', 'sucre de canne', 'fleur de sel'] }
    ]
  },
  {
    id: 's2', kind: 'PRODUIT_COMPLET', name: 'Barre céréales noisette', project: 'Snack protéiné', supplier: 'Nutsco',
    prof: { couleur: 5.5, homog: 5, odeur: 6, fermete: 7.5, fondant: 3.5, sucre: 5.5, sale: 2.5, acide: 1, amer: 4, arome: 6, persist: 5.5, arriere: 4 },
    versions: [
      { ver: 'R4', code: 'BCN-104', date: '2026-03-05', base: 6.1, n: 5, closed: true, ing: ['noisette 18%', 'sirop de glucose', 'protéine de pois', 'sucre de canne'] },
      { ver: 'R5', code: 'BCN-115', date: '2026-06-18', base: 7.1, n: 4, closed: true, ing: ['noisette 24%', 'sirop de riz', 'protéine de pois', 'fleur de sel'] }
    ]
  },
  {
    id: 's3', kind: 'BENCHMARK', name: 'Yaourt brassé mangue', project: 'Fruits 2026', supplier: 'Fruival',
    prof: { couleur: 7, homog: 6.5, odeur: 6.5, fermete: 3, fondant: 7.5, sucre: 6.5, sale: 0.5, acide: 5, amer: 1, arome: 7, persist: 5, arriere: 2 },
    versions: [
      { ver: 'V1', code: 'YBM-011', date: '2026-05-14', base: 6.4, n: 5, closed: true, ing: ['purée de mangue 14%', 'lait fermenté', 'sucre', 'amidon'] },
      { ver: 'V2', code: 'YBM-020', date: '2026-08-27', base: 7.4, n: 5, closed: true, ing: ['purée de mangue 20%', 'lait fermenté', 'sucre de canne', 'amidon'] },
      { ver: 'V3', code: 'YBM-024', date: '2026-09-14', base: 6.9, n: 1, closed: false, ing: ['purée de mangue 20%', 'lait fermenté', 'sucre de canne'] }
    ]
  },
  {
    id: 's4', kind: 'INGREDIENT', name: 'Beurre de baratte 82%', project: 'Goûter', supplier: 'Laiterie Ouest', buyer: 'Inès Maréchal', fr: false,
    prof: { couleur: 6, homog: 7, odeur: 7.5, fermete: 7, fondant: 4.5, sucre: 6, sale: 3, acide: 0.5, amer: 1.5, arome: 7.5, persist: 6.5, arriere: 1.5 },
    versions: [
      { ver: 'V1', code: 'BEU-082', date: '2026-06-02', base: 7.9, n: 5, closed: true, ing: ['beurre 26%', 'farine T55', 'sucre', 'fleur de sel'] },
      { ver: 'V2', code: 'BEU-090', date: '2026-09-08', base: 7.7, n: 0, closed: false, ing: ['beurre 28%', 'farine T55', 'sucre', 'fleur de sel'] }
    ]
  }
];

let seed = 20260915;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

async function main() {
  console.log('Seeding users...');
  const userByFullName = {};
  for (const u of USERS) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
        firstName: u.first,
        lastName: u.last,
        pole: u.pole,
        isAdmin: !!u.admin
      }
    });
    userByFullName[u.first + ' ' + u.last] = created;
  }

  const existingCount = await prisma.tastingSession.count();
  if (existingCount > 0) {
    console.log('Tasting sessions already present — skipping session seed (users still upserted).');
    console.log('Default password for every seeded account: ' + DEFAULT_PASSWORD);
    return;
  }

  console.log('Seeding tasting sessions...');
  for (let si = 0; si < SEED.length; si++) {
    const s = SEED[si];
    const buyer = s.buyer ? userByFullName[s.buyer] : null;
    const session = await prisma.tastingSession.create({
      data: {
        kind: s.kind,
        name: s.name,
        project: s.project,
        supplier: s.supplier,
        buyerId: buyer ? buyer.id : null,
        frPassed: !!s.fr,
        createdById: userByFullName['Amélie Rouvier'].id
      }
    });

    for (let vi = 0; vi < s.versions.length; vi++) {
      const v = s.versions[vi];
      const isFull = s.kind === 'PRODUIT_COMPLET';
      const compRows = isFull
        ? v.ing.map((x) => {
            const m = x.match(/([\d.]+)\s*%/);
            return { name: m ? x.replace(/\s*[\d.]+\s*%/, '').trim() : x, dose: m ? m[1] : null, unit: 'g' };
          })
        : [];

      const version = await prisma.version.create({
        data: {
          sessionId: session.id,
          ver: v.ver,
          code: v.code,
          date: v.date,
          closed: v.closed,
          ingredients: JSON.stringify(v.ing),
          composition: isFull
            ? { create: compRows.map((r, i) => ({ name: r.name, dose: r.dose, unit: r.unit, order: i })) }
            : undefined
        }
      });

      for (let i = 0; i < v.n; i++) {
        const profile = {};
        GRILLE_KEYS.forEach((k) => {
          profile[k] = clamp((s.prof[k] || 5) + (vi - 1) * 0.3 + (rnd() - 0.5) * 2.2, 0, 10);
        });
        const note10 = clamp(v.base + (rnd() - 0.5) * 2.1, 1, 10);
        const tasterName = PANEL[(si * 2 + vi + i) % PANEL.length];
        await prisma.grade.create({
          data: {
            versionId: version.id,
            tasterName,
            hedonicRaw: Math.round((note10 * 9) / 10),
            note: note10,
            profile: JSON.stringify(profile),
            jar: JSON.stringify({ sucre: 'Juste bien', fermete: 'Juste bien' }),
            comment: QUOTES[(si + vi + i) % QUOTES.length]
          }
        });
      }
    }
  }

  console.log('Done. Default password for every seeded account: ' + DEFAULT_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
