import 'dotenv/config';
import { runSeed } from '../src/seedData.js';
import { prisma } from '../src/db.js';

runSeed()
  .then((log) => console.log(log))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
