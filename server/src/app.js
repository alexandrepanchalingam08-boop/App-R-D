import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import photoRoutes from './routes/photos.js';
import adminRoutes from './routes/admin.js';
import foodTourRoutes from './routes/foodtours.js';
import { PrismaSessionStore } from './sessionStore.js';

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

// Behind a reverse proxy (Vercel, Render, ...), req.secure only reflects
// reality once Express trusts X-Forwarded-Proto — required for secure
// session cookies.
if (isProd) app.set('trust proxy', 1);

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    name: 'degustatheque.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret',
    store: new PrismaSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 14
    }
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', photoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/foodtours', foodTourRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Route API introuvable.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

export default app;
