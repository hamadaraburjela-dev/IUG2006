/**
 * Simple migration helper: import a CSV into Firestore collection `students`.
 * Usage:
 *   node migrate_from_csv.js /path/to/file.csv
 *
 * CSV expected columns (header row): name,phone,year,score
 * score is optional; if missing the document will be created with score: 0
 *
 * Authentication:
 * - Locally set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 * - Or run this inside a GCP VM with proper scopes.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node migrate_from_csv.js /path/to/file.csv');
    process.exit(2);
  }

  if (!fs.existsSync(file)) {
    console.error('file not found:', file);
    process.exit(2);
  }

  // Initialize admin
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(h => h.trim());

  const nameIdx = header.indexOf('name');
  const phoneIdx = header.indexOf('phone');
  const yearIdx = header.indexOf('year');
  const scoreIdx = header.indexOf('score');

  if (nameIdx === -1 || phoneIdx === -1) {
    console.error('CSV must contain header columns: name,phone (optional: year,score)');
    process.exit(2);
  }

  console.log(`Found ${lines.length} rows, beginning import...`);

  let count = 0;
  for (const row of lines) {
    const cols = row.split(',').map(c => c.trim());
    const name = cols[nameIdx] || '';
    const phone = cols[phoneIdx] || '';
    const year = yearIdx >= 0 ? (cols[yearIdx] || null) : null;
    const score = scoreIdx >= 0 && cols[scoreIdx] !== '' ? Number(cols[scoreIdx]) : 0;

    if (!name || !phone) {
      console.warn('skip row missing name/phone:', row);
      continue;
    }

    const docRef = db.collection('students').doc();
    await docRef.set({
      name,
      phone,
      year,
      score,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;
    if (count % 50 === 0) console.log(`Imported ${count}`);
  }

  console.log(`Done. Imported ${count} documents.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
