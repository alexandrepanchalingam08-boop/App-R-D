// Vercel convention: any file under /api becomes a serverless function.
// An Express app is itself a valid (req, res) handler, so re-exporting it
// here is all that's needed — vercel.json rewrites /api/* to this file.
import app from '../server/src/app.js';

export default app;
