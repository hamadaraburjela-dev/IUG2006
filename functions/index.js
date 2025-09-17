const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize admin if not already initialized (helps local testing)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Optional API key middleware - use functions config or environment variable
let DEPLOY_API_KEY = null;
try {
  const cfg = functions.config && functions.config();
  DEPLOY_API_KEY = (cfg && cfg.api && cfg.api.key) ? cfg.api.key : process.env.API_KEY || null;
} catch (e) {
  DEPLOY_API_KEY = process.env.API_KEY || null;
}

function requireApiKey(req, res, next) {
  if (!DEPLOY_API_KEY) return next(); // not configured -> allow
  const headerKey = req.get('x-api-key') || '';
  const qsKey = req.query && req.query.key ? String(req.query.key) : '';
  const authBearer = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const provided = headerKey || qsKey || authBearer;
  if (provided === DEPLOY_API_KEY) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.use(requireApiKey);

// Simple health check
app.get('/_health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// POST /register
// body: { name, phone, year, metadata? }
// returns: { id, createdAt }
app.post('/register', async (req, res) => {
  try {
    const { name, phone, year, metadata } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: 'missing name or phone' });
    }

    const id = uuidv4();
    const docRef = db.collection('students').doc(id);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const payload = {
      name,
      phone,
      year: year || null,
      score: 0,
      metadata: metadata || null,
      createdAt: now,
      updatedAt: now
    };

    await docRef.set(payload, { merge: true });

    return res.status(201).json({ id, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

// POST /updateScore
// body: { id, delta }  OR { id, score }
// delta => increment (can be negative). score => set absolute value.
// Returns updated doc snapshot (minimal fields)
app.post('/updateScore', async (req, res) => {
  try {
    const { id, delta, score } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const docRef = db.collection('students').doc(id);

    // If delta provided, prefer FieldValue.increment for better concurrency
    if (typeof delta === 'number' && typeof score !== 'number') {
      // perform increment without transaction
      await docRef.update({
        score: admin.firestore.FieldValue.increment(delta),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(err => {
        // If doc doesn't exist, return not_found
        throw new Error(err.message || 'update_failed');
      });

      // Read final value to clamp and return
      const snap = await docRef.get();
      if (!snap.exists) throw new Error('not_found');
      let final = snap.get('score') || 0;
      // clamp
      final = Math.max(0, Math.min(10000, final));
      // if clamp changed value, write it back
      if (final !== snap.get('score')) {
        await docRef.update({ score: final, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      return res.json({ ok: true, id, score: final });
    }

    // Otherwise handle absolute score via transaction
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) {
        throw new Error('not_found');
      }

      if (typeof score !== 'number') {
        throw new Error('missing_delta_or_score');
      }

      let next = Math.max(0, Math.min(10000, score));

      tx.update(docRef, {
        score: next,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { id, score: next };
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('updateScore error', err);
    if (err.message === 'not_found') return res.status(404).json({ error: 'not_found' });
    if (err.message === 'missing_delta_or_score') return res.status(400).json({ error: 'missing_delta_or_score' });
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

// Export as a single function for Firebase Functions
exports.api = functions.https.onRequest(app);

// For local debugging, you can run `node index.js` which will start a small server when invoked directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Local server listening on http://localhost:${PORT}`));
}
