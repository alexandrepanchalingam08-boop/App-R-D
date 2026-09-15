import { Store } from 'express-session';
import { prisma } from './db.js';

// A minimal express-session Store backed by the same Prisma/SQLite database
// as the rest of the app — avoids both the default MemoryStore (leaks,
// doesn't survive restarts) and pulling in a separate session-store package.
export class PrismaSessionStore extends Store {
  constructor({ ttlMs = 1000 * 60 * 60 * 24 * 14 } = {}) {
    super();
    this.ttlMs = ttlMs;
    // Best-effort periodic sweep of expired rows; failures are non-fatal.
    this._sweep = setInterval(() => this._cleanup(), 1000 * 60 * 60).unref();
  }

  async _cleanup() {
    try {
      await prisma.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    } catch (err) {
      console.error('Session cleanup failed:', err);
    }
  }

  async get(sid, cb) {
    try {
      const row = await prisma.authSession.findUnique({ where: { sid } });
      if (!row || row.expiresAt < new Date()) return cb(null, null);
      cb(null, JSON.parse(row.data));
    } catch (err) {
      cb(err);
    }
  }

  async set(sid, session, cb) {
    try {
      const expiresAt = session.cookie?.expires ? new Date(session.cookie.expires) : new Date(Date.now() + this.ttlMs);
      const data = JSON.stringify(session);
      await prisma.authSession.upsert({
        where: { sid },
        create: { sid, data, expiresAt },
        update: { data, expiresAt }
      });
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  async destroy(sid, cb) {
    try {
      await prisma.authSession.delete({ where: { sid } }).catch(() => {});
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  async touch(sid, session, cb) {
    try {
      const expiresAt = session.cookie?.expires ? new Date(session.cookie.expires) : new Date(Date.now() + this.ttlMs);
      await prisma.authSession.update({ where: { sid }, data: { expiresAt } }).catch(() => {});
      cb(null);
    } catch (err) {
      cb(err);
    }
  }
}
