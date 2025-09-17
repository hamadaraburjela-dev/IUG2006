Cloud Functions for IUG Advisor - minimal API

This folder contains a minimal Node.js Express app wrapped as a Firebase Cloud Function exposing two endpoints:

POST /register
- Body: { name, phone, year?, metadata? }
- Creates a new document in `students/{id}` with score=0
- Returns: { id, createdAt }

POST /updateScore
- Body: { id, delta? , score? }
- If `score` provided, sets absolute score. If `delta` provided, increments the current score by delta.
- Uses Firestore transaction for atomic updates. Returns { ok: true, id, score }

Quick local test (requires firebase-tools and initialized project):
1) Install deps
   npm install

2) Start local server (for quick manual test without Firebase emulator)
   node index.js
   -> then POST to http://localhost:5000/register

3) Using Firebase Functions emulator + Firestore emulator (recommended for full testing):
   firebase emulators:start --only functions,firestore

Deploy to Firebase Functions:
1) Ensure you have initialized Firebase in the parent project (firebase init functions + firestore) and set the correct project.
2) From this `functions/` folder run:
   npm install
   firebase deploy --only functions

Security notes:
- This minimal API has no authentication. In production, protect endpoints using Firebase Auth, App Check, or an API key + IAM rules.
- Add rate-limiting or Cloud Endpoints if the public will call these directly.

Migration from Sheets (optional):
- If you need a migration script, I can provide a small Node script that reads a CSV export of your sheet and writes documents into Firestore.
