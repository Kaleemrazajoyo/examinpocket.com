# ExamInPocket — MERN Stack

This is the MERN rebuild of the original single-file `index.html` portal (CSS/PMS/PCS/CCE exam prep).

## Structure

```
mern/
├── client/   # React + Vite + Tailwind
├── server/   # Express + MongoDB + Mongoose
└── legacy/   # Original index.html kept for reference
```

## Quick start (local)

1. Install dependencies from the monorepo root:
   ```bash
   npm install
   ```
   *(If npm is blocked by PowerShell policy, use `npm.cmd`.)*

2. Configure the server:
   ```bash
   cp server/.env.example server/.env
   # edit server/.env — set MONGO_URI, JWT_SECRET, and optionally GEMINI_API_KEY
   ```

3. Start MongoDB (local `mongod`) or use MongoDB Atlas.

4. Create an admin account:
   ```bash
   npm run create-admin -w server
   ```

5. (Optional) Seed sample data:
   ```bash
   npm run seed -w server
   ```

6. Run both apps in development:
   ```bash
   npm run dev
   ```
   - Client: http://localhost:5173
   - API: http://localhost:5000

## Features

- **MCQ Bank** — browse, search, filter by category, instant answer checking with explanations
- **Mock Test** — timed test, auto-grading, weak-subject analysis, results saved per account
- **Dawn** — vocabulary cards + headlines
- **Articles** — editorial content reader
- **Library** — books added by pasting **OneDrive/SharePoint** share links (no file uploads). Reader shows embedded view with "Open in OneDrive" and "Download" fallbacks
- **Saved** — per-user bookmarks across MCQs, vocab, articles, books
- **AI Tutor** — Gemini proxy on the server (API key never reaches the browser). Falls back to a Roman Urdu tip if the key is missing
- **Admin Panel** (`/admin`) — CRUD for content, OneDrive link resolver with live preview, JSON backup/export

## OneDrive links

1. In OneDrive/SharePoint, share the PDF as **"Anyone with the link can view"**.
2. Copy the share URL (supports `1drv.ms`, `onedrive.live.com`, `*.sharepoint.com`).
3. In Admin → Library → paste the link → **Resolve Link** → **Save to Library**.
4. The server normalizes it into `embedUrl` and `downloadUrl` automatically.

## Import legacy data

Export from the old app via Admin → Export Database, then:

```bash
npm run import-legacy -w server -- ../path/to/exam-legacy-export.json --email=student@example.com
# dry run
npm run import-legacy -w server -- ../path/to/export.json --dry-run
```

## Environment variables

See `server/.env.example` for all options.

## Production notes

- Put `JWT_SECRET` behind a real secret manager.
- Set `CLIENT_ORIGIN` to your frontend domain and use `Secure` cookies (`NODE_ENV=production`).
- Serve the built client from the same origin as the API to avoid cookie/CORS friction, or configure CORS + `SameSite=None; Secure`.
- The admin credentials from the old single-file app are **not** used — create a new admin via `create-admin.js`.
- Gemini key must stay in `server/.env` only.
- Delete or do not host `legacy/index.html` publicly.
