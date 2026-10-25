# ExamInPocket — MERN Migration Plan

> **Status:** Plan only. No code has been changed yet.
> **Source app:** single-file `index.html` (2,153 lines) — client-only, `localStorage` storage.
> **Target:** MERN — **M**ongoDB + **E**xpress + **R**eact + **N**ode.js.
> **Last updated:** 2026-10-24

---

## 1. Goal

Rebuild ExamInPocket as a real multi-user web app with a shared database, real authentication,
a secure admin panel, and **OneDrive links** (instead of file uploads) for all PDFs/books.

The UI/UX, feature set, and Tailwind look stay the same. What changes is **where the data lives**
and **how the app talks to it**.

### What "done" means

- [ ] Content (MCQs, articles, books, vocab, headlines) is stored in MongoDB, not `localStorage`.
- [ ] Any admin edit is visible to every student on every device immediately.
- [ ] Students create accounts; bookmarks and mock-test history follow the account.
- [ ] Admin panel is protected by a real server-side role check.
- [ ] Gemini API key never reaches the browser.
- [ ] Books/PDFs are added by pasting a OneDrive link; the reader embeds it with an "Open / Download" fallback.
- [ ] Deployed, HTTPS, custom domain (optional), with a JSON backup/restore path.

### Explicit non-goals (for v1)

- No native mobile app.
- No payments / subscriptions.
- No file storage (S3/Cloudinary) — **OneDrive links only**.
- No PDF text extraction or full-text search inside PDFs.
- No real-time collaboration.

---

## 2. Current state audit (why we are migrating)

| Item | Now | Problem |
|---|---|---|
| Structure | One `index.html` (HTML + CSS + JS) | Hard to maintain, no build, no modules |
| Files | `style.css` and `data.js` are 0 bytes, unused | Dead code to delete |
| Data | `localStorage` keys `eip_mcqs`, `eip_articles`, `eip_library`, `eip_dawn_words`, `eip_dawn_headlines`, `eip_saved_*` | Per-browser, no sharing, ~5 MB limit |
| Admin auth | Hardcoded user/pass in the client + `state.isAdminLoggedIn` | Anyone can bypass it |
| API key | Gemini key stored in `localStorage` (`eip_api_key`) and used in the browser | Key is public; quota theft |
| PDFs | Local upload → `blob:` URL, stripped on save | Files vanish after refresh |
| Rendering | `innerHTML +=` with user/AI/article text | XSS risk |
| Styling | Tailwind CDN + Font Awesome CDN | CDN Tailwind is not for production |
| Routing | `switchTab()` + `.tab-content.active` | No deep links, no back button |

Feature inventory to preserve (nothing gets dropped):

`homeTab` (MCQ bank, search, categories, bookmarks) · `testTab` (mock test, timer, result, weak subjects) ·
`dawnTab` (vocabulary + headlines) · `articlesTab` (article list + reader) · `libraryTab` (books + PDF reader) ·
`savedTab` (unified bookmarks) · `aiTab` (Gemini tutor) · `adminTab` (login, content CRUD, JSON import/export) ·
auth modal · toast + confirm dialogs · print / external / download reader actions.

---

## 3. Target architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (React + Vite)                       │
│  Pages: Home · Mock Test · Dawn · Articles · Library · Saved · AI     │
│  Admin: guarded routes           Shared: Reader, Toast, Dialog        │
│  State: TanStack Query (server data) + AuthContext (session)          │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTPS · JSON · httpOnly JWT cookie
┌───────────────────────────▼──────────────────────────────────────────┐
│                       Express API (Node.js)                          │
│  /api/auth   /api/mcqs   /api/vocab   /api/headlines                 │
│  /api/articles  /api/books  /api/bookmarks  /api/attempts            │
│  /api/ai/chat   /api/links/resolve   /api/admin/import|export        │
│  Layers: routes → controllers → services → Mongoose models           │
│  Middleware: helmet, cors(credentials), rate-limit, zod validation,  │
│              requireAuth, requireAdmin, error handler                │
└──────────┬───────────────────────────────┬───────────────────────────┘
           │                               │
   ┌───────▼────────┐              ┌───────▼────────────────┐
   │ MongoDB Atlas  │              │ External services      │
   │ (all app data) │              │ Gemini API (server key)│
   └────────────────┘              │ OneDrive (embed links) │
                                   └────────────────────────┘
```

### Request lifecycle (example: student opens the MCQ bank)

1. React renders `HomePage` and calls `GET /api/mcqs?page=1&limit=20&search=...`.
2. Express validates the query with zod, calls `mcqService.list()`, which queries MongoDB.
3. Response: `{ items: [...], page, totalPages, total }`.
4. TanStack Query caches it and re-renders the list. Search is debounced and re-fetches.
5. Bookmark buttons call `POST /api/bookmarks` (auth required) and invalidate the bookmarks cache.

### Auth flow

```
Register/Login ──► POST /api/auth/login ──► verify bcrypt hash
                                        └─► sign JWT { sub, role }
                                            set httpOnly cookie (SameSite=Lax, Secure)
Browser ──► GET /api/auth/me ──► AuthContext hydrates user
Admin route ──► requireAuth ──► requireAdmin ──► controller
```

No token in `localStorage`. The cookie is invisible to JavaScript, so XSS cannot steal the session.
Admin status is checked **on the server** for every write request.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev, standard MERN, easy Vercel/Netlify deploy |
| Routing | React Router v6 | Replaces `switchTab`, gives real URLs |
| Styling | Tailwind CSS (build, not CDN) | Same design, production-safe |
| Icons | Font Awesome (keep) or `lucide-react` | Reuse existing `fa-*` markup initially |
| Data fetching | TanStack Query v5 | Caching, loading/error states, cache invalidation |
| Forms | React Hook Form + zod | Shared validation rules with the server |
| Backend | Express 4 + Node 20 | MERN standard, minimal |
| DB | MongoDB Atlas + Mongoose 8 | Document shape matches current JSON records |
| Auth | JWT in httpOnly cookie + bcrypt | Simple, secure enough for this app |
| Validation | zod (server + client) | One schema, two uses |
| Security | helmet, cors, express-rate-limit, mongo-sanitize | Baseline hardening |
| AI | Server proxy to Gemini API | Hides the key |
| Files | **None.** OneDrive URLs only | Per requirement |
| Tests | Vitest + Supertest, Playwright smoke | Confidence during migration |
| Deploy | Render (API) + Vercel (client), or one Render service | Simple, free tier available |

---

## 5. Repository structure

Convert the current folder into a monorepo (current `index.html` is kept as `legacy/index.html`
for reference until parity is reached).

```
EIP/
├─ PLAN.md                      ← this file
├─ package.json                 ← npm workspaces + dev scripts (concurrently)
├─ .gitignore
├─ README.md
├─ legacy/
│  └─ index.html                ← current app, read-only reference
├─ client/
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx                ← routes
│     ├─ index.css              ← Tailwind + old <style> block moved here
│     ├─ lib/
│     │  ├─ api.js              ← fetch wrapper, credentials: 'include'
│     │  ├─ queryClient.js
│     │  └─ onedrive.js         ← normalizer + fallback links
│     ├─ context/AuthContext.jsx
│     ├─ components/
│     │  ├─ layout/{Header,Footer,Nav,TabBar}.jsx
│     │  ├─ ui/{Toast,ConfirmDialog,Modal,Spinner,EmptyState,Pagination,SearchBar}.jsx
│     │  ├─ mcq/{McqCard,CategoryPills,McqList,ExplanationBox}.jsx
│     │  ├─ test/{TestConfig,TestRunner,ResultSummary}.jsx
│     │  ├─ dawn/{VocabCard,HeadlineCard}.jsx
│     │  ├─ article/{ArticleCard,ArticleReader}.jsx
│     │  ├─ book/{BookCard,BookReader}.jsx
│     │  ├─ saved/SavedTabs.jsx
│     │  ├─ ai/AiChat.jsx
│     │  └─ admin/{AdminLayout,McqForm,ArticleForm,BookForm,VocabForm,ImportExport}.jsx
│     └─ pages/
│        ├─ HomePage.jsx  TestPage.jsx  DawnPage.jsx  ArticlesPage.jsx
│        ├─ LibraryPage.jsx  SavedPage.jsx  AiPage.jsx
│        ├─ LoginPage.jsx  SignupPage.jsx
│        └─ admin/{AdminDashboard,AdminMcqs,AdminArticles,AdminBooks,AdminVocab}.jsx
└─ server/
   ├─ src/
   │  ├─ index.js               ← app bootstrap, listen
   │  ├─ app.js                 ← express app (testable, no listen)
   │  ├─ config/{env.js,db.js}
   │  ├─ middleware/{auth.js,admin.js,validate.js,error.js,rateLimit.js}
   │  ├─ models/{User,Mcq,Vocab,Headline,Article,Book,Bookmark,TestAttempt}.js
   │  ├─ routes/{auth,mcqs,vocab,headlines,articles,books,bookmarks,attempts,ai,links,admin}.js
   │  ├─ controllers/           ← thin, call services
   │  ├─ services/{exams,ai,onedrive,seed}.js
   │  └─ utils/{jwt.js,errors.js,logger.js}
   ├─ scripts/{seed.js,import-legacy.js,create-admin.js}
   └─ tests/{auth.test.js,mcqs.test.js,bookmarks.test.js}
```

---

## 6. Database design

National IDs from `localStorage` are numeric (`Date.now()` based). Mongo will assign `ObjectId`s,
and every imported document keeps a **`legacyId`** field so bookmarks can be re-linked during migration.

```js
// User
{
  name: String,
  email: { type: String, unique: true, lowercase: true },
  passwordHash: String,
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  createdAt, updatedAt
}

// Mcq
{
  question: String,
  options: [String],        // exactly 4
  answerIndex: Number,      // 0..3
  explanation: String,
  category: String,         // indexed
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  legacyId: Number,
  createdBy: ObjectId,      // ref User
  timestamps
}
// indexes: { category: 1 }, text index on { question: 'text' }

// Vocab (Dawn words)
{
  word: String, meaning: String, sentence: String, source: String,
  legacyId: Number, createdBy: ObjectId, timestamps
}

// Headline
{ title: String, source: String, url: String, publishedAt: Date, legacyId: Number, timestamps }

// Article
{
  title: String, category: String, author: String, content: String,
  coverUrl: String, legacyId: Number, createdBy: ObjectId, timestamps
}

// Book
{
  title: String, category: String,
  sizeLabel: String,        // free text: "PDF Book", "12 MB" — metadata only
  provider: { type: String, enum: ['onedrive', 'external'], default: 'onedrive' },
  url: String,              // canonical share link the admin pasted
  embedUrl: String,         // resolved by server for <iframe>
  downloadUrl: String,      // resolved direct-download link when available
  description: String,
  legacyId: Number, createdBy: ObjectId, timestamps
}

// Bookmark — unified replacement for savedMcqs/savedVocab/savedArticles/savedBooks
{
  user: ObjectId,
  itemType: { type: String, enum: ['mcq','vocab','article','book'] },
  item: ObjectId,
  createdAt
}
// unique compound index: { user: 1, itemType: 1, item: 1 }

// TestAttempt — enables history after refresh (new, server-backed)
{
  user: ObjectId,
  category: String,                        // 'ALL' or a category
  total: Number, correct: Number, wrong: Number, unattempted: Number,
  percentage: Number,
  weakSubjects: [{ category: String, wrong: Number }],
  answers: [{ mcq: ObjectId, selectedIndex: Number, correct: Boolean }],
  startedAt: Date, submittedAt: Date
}
```

### Mapping: old `localStorage` → new collection

| localStorage key | Collection | Notes |
|---|---|---|
| `eip_mcqs` | `mcqs` | `id` → `legacyId` |
| `eip_dawn_words` | `vocabs` | `id` → `legacyId` |
| `eip_dawn_headlines` | `headlines` | |
| `eip_articles` | `articles` | |
| `eip_library` | `books` | `url` → `url`; run OneDrive normalizer; `isNew` is dropped |
| `eip_saved_mcqs` | `bookmarks` (`itemType: 'mcq'`) | resolve via `legacyId` |
| `eip_saved_vocab` | `bookmarks` (`itemType: 'vocab'`) | resolve via `legacyId` |
| `eip_saved_articles` | `bookmarks` (`itemType: 'article'`) | resolve via `legacyId` |
| `eip_saved_books` | `bookmarks` (`itemType: 'book'`) | resolve via `legacyId` |
| `eip_api_key` | **deleted** | moves to server `.env` |
| `eip_admin_user` / `eip_admin_pass` | `users` (1 admin) | password re-hashed with bcrypt |

---

## 7. API design

Base URL: `/api`. All responses: `{ data }` on success, `{ error: { code, message, details? } }` on failure.
Pagination: `?page=1&limit=20` → `{ items, page, limit, total, totalPages }`.

### Public / student endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | — | Create student account |
| POST | `/auth/login` | — | Set session cookie |
| POST | `/auth/logout` | user | Clear cookie |
| GET | `/auth/me` | user | Current user (for page refresh) |
| GET | `/mcqs` | — | List + `search`, `category`, pagination |
| GET | `/mcqs/categories` | — | Distinct categories for pills |
| GET | `/mcqs/:id` | — | Single MCQ |
| GET | `/vocab` | — | Dawn vocabulary |
| GET | `/headlines` | — | Dawn headlines |
| GET | `/articles` | — | Article list (no heavy `content`) |
| GET | `/articles/:id` | — | Full article |
| GET | `/books` | — | Library list |
| GET | `/books/:id` | — | Book + embed/download links |
| GET | `/bookmarks` | user | `?type=` optional filter |
| POST | `/bookmarks` | user | `{ itemType, itemId }` (idempotent) |
| DELETE | `/bookmarks/:itemType/:itemId` | user | Remove bookmark |
| POST | `/attempts` | user | Save mock-test result |
| GET | `/attempts/me` | user | History + weak subjects |
| POST | `/ai/chat` | user (rate-limited) | Gemini proxy |
| POST | `/ai/explain-mcq` | user | `{ mcqId }` → explanation |

### Admin endpoints (all `requireAuth` + `requireAdmin`)

| Method | Route | Purpose |
|---|---|---|
| POST / PATCH / DELETE | `/mcqs`, `/mcqs/:id` | CRUD |
| POST / PATCH / DELETE | `/vocab`, `/vocab/:id` | CRUD |
| POST / PATCH / DELETE | `/headlines`, `/headlines/:id` | CRUD |
| POST / PATCH / DELETE | `/articles`, `/articles/:id` | CRUD |
| POST / PATCH / DELETE | `/books`, `/books/:id` | CRUD |
| POST | `/links/resolve` | Resolve + normalize a OneDrive link |
| GET | `/admin/stats` | Counts for dashboard |
| GET | `/admin/export` | Full JSON backup |
| POST | `/admin/import` | Bulk restore (dry-run flag supported) |
| GET | `/admin/users` | (optional) student list |

Auth rules: content **reads are public** (keeps the site usable without login, like today);
**bookmarks, attempts, and AI** require login; **all writes require admin**.
Admin accounts are created only by `scripts/create-admin.js` (no public admin signup route).

---

## 8. OneDrive PDF strategy (replaces uploads)

No `multer`, no S3, no `blob:`. The admin pastes a share link; the backend normalizes it and stores
`url`, `embedUrl`, `downloadUrl`. The reader always renders **three things**:

1. `<iframe>` with `embedUrl` (best effort),
2. an **"Open in OneDrive"** button (`url`) — always works,
3. a **"Download"** button (`downloadUrl`, falls back to `url`).

This guarantees the reader never dead-ends if a tenant blocks embedding.

### Supported link shapes and how they are converted

| Pasted link | Type | Embed | Download |
|---|---|---|---|
| `https://1drv.ms/b/s!AbCdEf...` | Personal short link | Resolve redirect → extract `resid`/`authkey` → `https://onedrive.live.com/embed?resid=...&authkey=...&em=2` | `https://onedrive.live.com/download?resid=...&authkey=...` |
| `https://onedrive.live.com/?cid=X&id=Y&authkey=Z` | Personal | `https://onedrive.live.com/embed?cid=X&resid=Y&authkey=Z&em=2` | `https://onedrive.live.com/download?cid=X&resid=Y&authkey=Z` |
| `https://<tenant>-my.sharepoint.com/:b:/g/personal/.../EaBc?e=xyz` | Business / work | same URL (optionally `&web=1`) | same URL + `&download=1` |
| Any non-OneDrive `https://...pdf` | External | direct URL | direct URL |

### Flow

```
Admin pastes link
   └─► POST /api/links/resolve { url }
         ├─ validate host (1drv.ms, onedrive.live.com, *.sharepoint.com, *.office.com)
         ├─ follow redirects to canonical URL (5s timeout, max 3 hops)
         ├─ extract cid / resid / authkey / tenant path
         ├─ build embedUrl + downloadUrl
         └─ return { provider, url, embedUrl, downloadUrl, warning? }
   └─► Admin sees a live iframe preview, then saves the book
   └─► Download/Embed URLs are cached in Mongo (no resolving at read time)
```

**Important caveats to design around:**

- The file **must be shared as "Anyone with the link can view"** — otherwise embedding fails for students.
- For work/school accounts, org policy may block iframe embedding (`X-Frame-Options`). The fallback buttons are mandatory, not optional.
- Link resolve can fail transiently → the admin form keeps manual `embedUrl` / `downloadUrl` override fields.
- OneDrive does not reliably expose file size → keep `sizeLabel` as a free-text label (as today).
- OneDrive links can be revoked at any time → this is a content-management risk, not a code bug; the admin export includes all links so they can be audited.

Frontend helper (`client/src/lib/onedrive.js`) mirrors the same rules so the admin preview works instantly;
the server remains the source of truth.

---

## 9. AI proxy design

Today: browser → Gemini with the key in `localStorage`. New:

```
POST /api/ai/chat { prompt, history? }
  requireAuth + rate limit (e.g. 20 requests / 10 min / user)
  server builds the system prompt ("friendly CSS/PMS mentor, Roman Urdu...")
  server calls Gemini with process.env.GEMINI_API_KEY
  returns { reply }
```

- Key lives only in `.env` / host secrets. It is removed from the admin UI, from `localStorage`, and from exports.
- Model name moves to `GEMINI_MODEL` env var (no code change to switch models).
- If the key is missing or the call fails, return the same offline "Roman Urdu / Hinglish tip" fallback text used today.
- Optional later: daily token budget per user, response streaming.

---

## 10. Frontend migration map

| Current | New |
|---|---|
| `switchTab(tabId)` + `.tab-content` | React Router routes (`/`, `/test`, `/dawn`, `/articles`, `/library`, `/saved`, `/ai`) |
| `renderMcqs`, `filterMcqs`, `filterCategory` | `HomePage` + `McqList` + `useMcqs({ search, category, page })` |
| `checkAnswer` | `McqCard` local state + `ExplanationBox` |
| `toggleBookmark*` (4 functions) | one `useBookmark(itemType, id)` hook → `POST/DELETE /api/bookmarks` |
| `renderSaved` | `SavedPage` with type tabs, backed by `GET /api/bookmarks` |
| `startMockTest`, `startTimer`, `submitMockTest` | `TestRunner` (interval in `useEffect`) + `POST /api/attempts` |
| `askAiToExplainMcq`, `sendAiChatMessage` | `AiChat` + `POST /api/ai/*` |
| `openReaderModal`, `formatGoogleDriveUrl` | `BookReader` + `lib/onedrive.js` (no blob map) |
| `openArticleReader` | `ArticleReader` (text or linked PDF) |
| `openEdit*Modal`, `save*Edits`, `delete*FromAdmin` | React forms with `useMutation` → admin endpoints |
| `exportDatabase`, `importDatabase` | `/api/admin/export` + `/api/admin/import` |
| `showToast`, `showConfirmModal` | `ToastProvider` + `ConfirmDialog` |
| `handleLogoClick` secret admin gate | **Removed** — `/admin` route with server-side role guard |
| Auth modal (UI only) | `LoginPage` / `SignupPage` + `AuthContext` |
| `localPdfBlobMap` | **Deleted** |

### State rules

- **Server data** → TanStack Query. Never copied into local state; mutations invalidate the right keys.
- **Session** → `AuthContext` (`user`, `isLoading`, `login`, `logout`).
- **Ephemeral UI** (reader open/closed, active saved filter) → local state or URL search params.
- **No business data in `localStorage`.** Only a non-sensitive UI preference may stay.

### Styling

- Move the `<style>` block (lines ~19–240 of the current file: `.tab-content`, `.opt-correct`,
  `.opt-wrong`, `.nav-link.active-link`, print rules, scrollbar) into `client/src/index.css`.
- Replace `cdn.tailwindcss.com` with the Tailwind build (`tailwind.config.js` + `@tailwind` directives).
- Copy the existing `tailwind.config` theme colors (indigo/amber/slate palette) so the look is identical.
- Keep Font Awesome initially to avoid rewriting hundreds of `fa-*` classes.

---

## 11. Phases, tasks, and time estimates

Assumes one developer, part-time. Estimates are for **working** time, not calendar time.

### Phase 0 — Freeze, backup, repo hygiene (0.5 day)

- [ ] `git init`, commit the current state as `baseline`.
- [ ] Export the live data: open the app → Admin → **Export Database** → save the JSON.
- [ ] Copy `index.html` → `legacy/index.html` (read-only reference).
- [ ] Delete the empty `data.js` and `style.css`.
- [ ] Create `.gitignore` (`node_modules`, `.env`, `dist`).
- [ ] Rotate the Gemini API key and **change the admin password** before anything goes public.

**Exit criteria:** backup JSON exists in two places; baseline commit tagged.

---

### Phase 1 — Backend foundation (4–5 days)

- [ ] `server/` scaffold: Express, `app.js` / `index.js` split, env config, Mongo connection.
- [ ] Models: `User`, `Mcq`, `Vocab`, `Headline`, `Article`, `Book`, `Bookmark`, `TestAttempt`.
- [ ] Auth: register / login / logout / me; bcrypt; JWT httpOnly cookie; `requireAuth`, `requireAdmin`.
- [ ] CRUD for all five content resources with zod validation and pagination/search.
- [ ] Bookmarks (create/delete/list) with the unique compound index.
- [ ] Attempts (create/list) for mock-test history.
- [ ] Seed script with sample content + `create-admin.js`.
- [ ] Middleware: helmet, cors with credentials, rate limit, centralized error handler.
- [ ] Supertest coverage for auth, MCQ listing, bookmarks (happy path + 401/403).

**Exit criteria:** full CRUD works through Postman/`curl`; `npm test` green; no secrets in the repo.

---

### Phase 2 — OneDrive link module (1 day)

- [ ] `services/onedrive.js`: host allow-list, redirect resolution, embed/download URL builder.
- [ ] `POST /api/links/resolve` (admin only) + unit tests for every link shape in the table above.
- [ ] `Book` model stores `url`, `embedUrl`, `downloadUrl`, `provider`.
- [ ] Manual override fields in the admin book form (for edge cases).
- [ ] Backend returns a `warning` when a link is not public/embeddable.

**Exit criteria:** all four link shapes from §8 resolve correctly; unit tests pass.

---

### Phase 3 — AI proxy (0.5 day)

- [ ] `services/ai.js` with the existing system prompt.
- [ ] `POST /api/ai/chat` and `POST /api/ai/explain-mcq`, auth + per-user rate limit.
- [ ] Offline fallback reply when the key is missing or the call fails.
- [ ] Remove every reference to the key from the client and from admin UI/export.

**Exit criteria:** AI works with the key only in `.env`; the key is not present in any response or client bundle.

---

### Phase 4 — React frontend (7–10 days)

Suggested order (each step leaves a working screen):

1. Vite + React + Tailwind + Router + Query + AuthContext; port the `<style>` block; header/nav/footer.
2. `HomePage`: MCQ list, search (debounced), category pills, MCQ card, answer check, bookmark.
3. `SavedPage`: type tabs, remove bookmarks.
4. `TestPage`: config → runner → timer → result → save attempt.
5. `DawnPage`: vocab + headlines.
6. `ArticlesPage` + reader.
7. `LibraryPage` + `BookReader` (OneDrive embed + Open/Download fallbacks).
8. `AiPage`: chat + "explain this MCQ", typing indicator, clear chat.
9. `LoginPage` / `SignupPage` + protected routes.
10. Admin: dashboard stats, MCQ/article/book/vocab CRUD, OneDrive link resolver with live preview,
    import/export, logout.
11. Polish: toasts, confirm dialogs, empty/loading/error states, mobile nav, print CSS.

**Exit criteria:** every feature from §2 is reachable and functional against the real API; no `localStorage` data access remains.

---

### Phase 5 — Data migration + QA (1.5–2 days)

- [ ] `scripts/import-legacy.js <export.json>`:
  - validate + de-duplicate, assign `legacyId`, insert content,
  - build `legacyId → ObjectId` maps,
  - convert the four `saved*` arrays into `bookmarks` **only if** a target user is supplied
    (bookmarks are per-user; anonymous saved items cannot be attributed — document this),
  - run the OneDrive normalizer over every library URL,
  - `--dry-run` mode prints counts before writing.
- [ ] `scripts/verify-import.js`: compare counts (JSON vs Mongo) and spot-check 5 records per type.
- [ ] Manual QA checklist: search, categories, bookmark add/remove, mock test scoring + weak subjects,
      reader embed/fallback/download, admin CRUD, import/export, login/logout, mobile widths.
- [ ] Playwright smoke: login → bookmark → mock test → admin create MCQ.

**Exit criteria:** record counts match; QA checklist fully ticked; no console errors.

---

### Phase 6 — Deploy + harden (1–2 days)

- [ ] MongoDB Atlas cluster + IP allow-list + DB user.
- [ ] Deploy API (Render/Railway) with env vars; deploy client (Vercel) or serve the built client from Express (single origin — simplest cookies/CORS).
- [ ] HTTPS, `Secure` + `SameSite=Lax` cookies, exact `CLIENT_ORIGIN` in CORS.
- [ ] Backup job: weekly `GET /api/admin/export` saved off-site (or Atlas snapshot).
- [ ] Uptime check; basic log review; verify no secrets in the built JS bundle.
- [ ] Write `README.md`: setup, env vars, scripts, deploy steps.

**Exit criteria:** public URL works end-to-end on desktop and mobile; admin is reachable only by the seeded account.

---

### Total estimate

| Phase | Time |
|---|---|
| 0 · Backup & hygiene | 0.5 day |
| 1 · Backend foundation | 4–5 days |
| 2 · OneDrive module | 1 day |
| 3 · AI proxy | 0.5 day |
| 4 · React frontend | 7–10 days |
| 5 · Migration & QA | 1.5–2 days |
| 6 · Deploy & harden | 1–2 days |
| **Total** | **~16–21 working days (≈3–4 weeks part-time)** |

---

## 12. Environment variables

```ini
# server/.env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/eip
JWT_SECRET=<64+ random chars>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-domain.com
GEMINI_API_KEY=<server-only key>
GEMINI_MODEL=gemini-3-flash-preview
AI_RATE_LIMIT=20/10m
```

```ini
# client/.env
VITE_API_URL=/api        # or https://api.your-domain.com/api
```

`.env` files are git-ignored and never bundled. The client holds **no secrets**.

---

## 13. Definition of done

- [ ] No content lives in `localStorage`; refresh and a second device show the same data.
- [ ] Admin actions are refused by the API for non-admins (verified with a student token).
- [ ] Gemini key appears nowhere in the client bundle or network responses.
- [ ] OneDrive books render with a working embed **or** a working Open/Download fallback.
- [ ] All old features exist; the visual design is unchanged.
- [ ] `npm test` passes; smoke test passes; `README.md` lets a new developer run the project.
- [ ] `legacy/index.html` is kept for reference, no longer served.

---

## 14. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| OneDrive blocks iframe embedding | High | Always show Open/Download; admin preview flags it |
| OneDrive short-link resolution fails | Medium | Manual `embedUrl` override + clear admin error |
| Shared OneDrive file is deleted/revoked | Medium | Export includes all links; periodic link audit |
| Scope creep during React rewrite | High | Phase gates + the feature list in §2 is the scope |
| Data loss during migration | Medium | Export JSON twice, `--dry-run`, counts verification, keep baseline |
| Refresh cookies blocked across origins | Medium | Single-origin deploy (Express serves the built client) |
| Free-tier sleep/cold start | Low | Uptime ping or paid instance |
| Public exposure of the old admin password | High if the old file is still hosted | Rotate now; never deploy `legacy/index.html` |

---

## 15. Open decisions (confirm before Phase 1)

1. **Do students need an account to read content?** Plan assumes: reading is public, bookmarks/tests/AI need login.
2. **OneDrive account type** — personal (consumer) or work/school? This affects embed reliability and testing.
3. **Email features** — is "forgot password" / email verification needed in v1? If yes, add SMTP + a mail provider (~+1 day).
4. **Deploy target** — one Render service (recommended, simplest) or separate Vercel + Render?
5. **Public signup or invite-only?** Open signup is assumed.

---

## 16. Recommended build order (summary)

```
Phase 0  backup + git + rotate secrets        ── do first, no exceptions
Phase 1  API + models + auth                  ── the real foundation
Phase 2  OneDrive resolver                    ── blocks library feature
Phase 3  AI proxy                             ── removes the key leak
Phase 4  React UI screen-by-screen            ── biggest chunk
Phase 5  import real data + QA                ── verify parity
Phase 6  deploy + harden                      ── go live
```

Keep the current `index.html` working while Phases 1–3 are built, and only switch traffic to the
React app after Phase 4 + Phase 5 pass. That way there is never a moment where the site is "half broken".
