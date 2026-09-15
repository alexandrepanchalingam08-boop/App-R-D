// Local/dev entrypoint — Vercel imports src/app.js directly (see /api/index.js)
// and never calls .listen(), since it runs the Express app as a function.
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Dégustathèque listening on http://localhost:${PORT}`);
});
