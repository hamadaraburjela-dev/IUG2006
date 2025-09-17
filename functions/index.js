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

    // Use transaction to ensure atomic update
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) {
        throw new Error('not_found');
      }

      let current = doc.get('score') || 0;
      let next;
      if (typeof score === 'number') {
        next = score;
      } else if (typeof delta === 'number') {
        next = current + delta;
      } else {
        throw new Error('missing_delta_or_score');
      }

      // clamp between 0 and a reasonable max (e.g., 10000)
      next = Math.max(0, Math.min(10000, next));

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
