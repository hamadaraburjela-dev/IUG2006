// Cloud Function: Express API for register & updateScore (uses Firestore)
// Deploy under functions/ with firebase-tools
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const COLLECTION = 'students'; // collection name in Firestore
const API_KEY = functions.config().api ? functions.config().api.key : null; // set with: firebase functions:config:set api.key="YOUR_KEY"

// simple middleware for API key (you can replace with Firebase Auth)
app.use((req, res, next) => {
  if (API_KEY) {
    const provided = req.get('x-api-key') || req.query.apiKey || (req.body && req.body.apiKey);
    if (!provided || provided !== API_KEY) {
      return res.status(401).json({ result: 'error', message: 'Unauthorized: invalid api key' });
    }
  }
  next();
});

// Register user
// POST /register
// body: { name, phone, year }
app.post('/register', async (req, res) => {
  try {
    const name = (req.body.name || '').toString();
    const phone = (req.body.phone || '').toString();
    const year = (req.body.year || '').toString();

    const uniqueId = uuidv4();
    const timestamp = admin.firestore.Timestamp.now();

    // Use uniqueId as document ID to allow O(1) lookup later
    const docRef = db.collection(COLLECTION).doc(uniqueId);
    await docRef.set({
      timestamp,
      fullName: name,
      phone: phone,
      year: year,
      score: null,
      uniqueId: uniqueId
    });

    return res.json({ result: 'success', uniqueId });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ result: 'error', message: err.message || err.toString() });
  }
});

// Update score
// POST /updateScore
// body: { uniqueId, score }
app.post('/updateScore', async (req, res) => {
  try {
    const uniqueId = (req.body.uniqueId || '').toString();
    const score = req.body.score;

    if (!uniqueId) {
      return res.status(400).json({ result: 'error', message: 'Unique ID is required' });
    }

    const docRef = db.collection(COLLECTION).doc(uniqueId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ result: 'error', message: 'User not found' });
    }

    // Optionally validate/parse score (e.g., numeric)
    const parsedScore = (score === null || score === undefined) ? null : Number(score);
    await docRef.update({ score: parsedScore });

    return res.json({ result: 'success', message: 'Score updated.' });
  } catch (err) {
    console.error('updateScore error', err);
    return res.status(500).json({ result: 'error', message: err.message || err.toString() });
  }
});

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({ result: 'ok' });
});

// Export function
exports.api = functions.https.onRequest(app);
