# PMO Orchestrator — Database & Persistence Design (v1.0)

**Status:** Design (implementation deferred per CLAUDE.md)
**Decision:** Server-side **SQLite + Node API**. Data is shared across all PMO users on the internal network server; full CRUD; real audit trail.
**Date:** 2026-06-16

---

## 1. Goal

Replace the in-memory `export const` arrays in `src/data/mock-data.js` with a persistent, shared store so that edits made in the UI (e.g. editing `start_date` / `end_date` in the milestone drawer) **survive page reload** and are **visible to every user** on the internal server.

Today every mutation funnels through **`src/core/mutations.js`** (`updateMilestone`, `insertMilestone`, `removeMilestone`, `reorderMilestones`, `appendComment`). That single write-path is the seam we swap onto the database — views and selectors do not change.

### Non-goals (v1.0)
- Authentication / per-user identity (author is hardcoded `"PMO Admin"`, per locked decision Q2).
- Real-time push / websockets (poll-on-focus is enough for a PMO cockpit).
- Horizontal scaling (single internal server, file-based DB is sufficient).

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Browser  (existing ES-module frontend, unchanged views)   │
│                                                            │
│  views/* ─► core/mutations.js ─► core/data-store.js (NEW)  │
│                                     │  fetch() JSON         │
└─────────────────────────────────────┼──────────────────────┘
                                       │  HTTP (internal LAN)
┌──────────────────────────────────────┼──────────────────────┐
│  Node + Express  (NEW — server/)     ▼                       │
│   routes/  ─►  repositories/  ─►  better-sqlite3            │
│   (REST)       (DAO + tx)         (synchronous)             │
└──────────────────────────────────────┬──────────────────────┘
                                        ▼
                              pmo.sqlite  (single file on server)
```

**Three tiers, one new backend folder (`server/`) plus one new frontend module (`core/data-store.js`).**

### Tech choices & rationale

| Concern | Choice | Why |
|---|---|---|
| DB engine | **SQLite** (file `data/pmo.sqlite`) | Zero-admin, single file, trivial backup (copy the file), perfect for one internal server. |
| DB driver | **better-sqlite3** | Synchronous API → simple transactions, no async ceremony in the DAO; fastest embedded option. |
| HTTP server | **Express** (or Fastify) | Minimal, well-known, serves both the static frontend and the `/api` routes from one process. |
| Migrations | Plain numbered `.sql` files run on boot | No ORM needed for ~5 tables; keeps the stack legible. |
| Static hosting | Same Node process serves `index.html` + `src/` | One thing to deploy on the internal box. |

> SQLite is a single-writer engine. For a PMO cockpit (a handful of concurrent editors) this is a non-issue — `better-sqlite3` serializes writes in-process and each write is sub-millisecond. If write contention ever appears, the migration path to Postgres is mechanical because all SQL lives in the repository layer.

---

## 3. Schema (DDL)

Column names are `snake_case` in SQL; the repository layer maps each row back to the **exact object shape the frontend already uses** (e.g. `planned_start_date`, `projectId`, `sortOrder`, `owner: {name, avatar}`), so no view/selector code changes.

```sql
-- ── projects ────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                 TEXT PRIMARY KEY,          -- "P-2401" (human-readable, preserved)
  code               TEXT,
  category           TEXT,
  dept               TEXT,
  biz                TEXT,
  family             TEXT,
  name               TEXT NOT NULL,
  summary            TEXT,
  owner_name         TEXT,                      -- flattened from owner:{name,avatar}
  owner_avatar       TEXT,
  program_group      TEXT,
  planned_start_date TEXT,                      -- 'YYYY-MM-DD' (ISO date string)
  planned_end_date   TEXT,
  health             TEXT,                      -- 'R' | 'Y' | 'G'
  override_health    TEXT,                      -- manual health override ('' = none)
  override_note      TEXT,
  override_by        TEXT,                      -- audit: who set the override
  override_at        TEXT,                      -- ISO timestamp
  gate               TEXT,
  complexity         INTEGER,
  status             TEXT,
  init               TEXT,
  level              TEXT,
  pm                 TEXT,
  product            TEXT,
  tech               TEXT,
  batch              TEXT,
  archived           INTEGER NOT NULL DEFAULT 0, -- 0/1 boolean
  rev                INTEGER NOT NULL DEFAULT 1, -- optimistic-concurrency counter
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- ── milestones ──────────────────────────────────────────────────────────
CREATE TABLE milestones (
  id                 TEXT PRIMARY KEY,          -- "P-2401-M1"
  project_id         TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  sort_order         INTEGER NOT NULL,
  planned_start_date TEXT,
  planned_end_date   TEXT NOT NULL,
  actual_start_date  TEXT,                      -- nullable
  actual_end_date    TEXT,                      -- nullable
  rev                INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX idx_milestones_project ON milestones(project_id, sort_order);

-- ── milestone_change_logs (audit trail — append only) ───────────────────
CREATE TABLE milestone_change_logs (
  id           TEXT PRIMARY KEY,                -- "CL-001"
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  field        TEXT NOT NULL,                   -- 'planned_end_date', 'actual_start_date', ...
  old_value    TEXT,                            -- stored as string (nullable)
  new_value    TEXT,
  reason       TEXT,                            -- required for planned_* changes
  changed_at   TEXT NOT NULL
);
CREATE INDEX idx_changelog_milestone ON milestone_change_logs(milestone_id, changed_at);

-- ── comments ────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id          TEXT PRIMARY KEY,                 -- "CM-001"
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'PMO Admin',
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_comments_project ON comments(project_id, created_at);

-- ── allocations (resource view; raw rows, derived fields computed in app) ─
CREATE TABLE allocations (
  id           TEXT PRIMARY KEY,                -- "R2-001"
  cat          TEXT,
  dept         TEXT,
  biz          TEXT,
  system       TEXT,
  project_key  TEXT,                            -- the resource-view "projectId" string
  project_name TEXT,
  complexity   INTEGER,
  status       TEXT,
  role         TEXT,
  person       TEXT,
  outsourced   INTEGER NOT NULL DEFAULT 0,
  time_ratio   REAL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_alloc_person ON allocations(person);
CREATE INDEX idx_alloc_project ON allocations(project_key);

-- ── import_batches (provenance for each Excel upload) ───────────────────
CREATE TABLE import_batches (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,                    -- 'project' | 'milestone' | 'override' | 'resource'
  filename    TEXT,
  row_count   INTEGER,
  imported_by TEXT,
  imported_at TEXT NOT NULL
);
```

**Notes**
- **IDs stay human-readable strings** (`P-2401`, `P-2401-M1`, `CL-001`). New rows created via the UI keep using the existing `uid()` generator from `mutations.js`. No surrogate auto-increment keys → seed data migrates 1:1.
- `statusWeight` / `roleWeight` / `load` on allocations are **derived** (computed today in `importers.js`). They stay computed in `core/selectors.js`, not stored, so weight-table changes don't require a data migration.
- `rev` enables optimistic concurrency (see §6). Ignorable in v1.0 if we accept last-write-wins.
- `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` set at connection open (WAL = concurrent readers during a write).

---

## 4. REST API contract

One resource group per table. Every endpoint maps onto an existing `mutations.js` function so server-side validation mirrors today's rules (reason required for `planned_*`, `actual_end_date` ordering, delete blocked when actuals exist, reorder dry-run).

| Method & path | Maps to | Body / notes |
|---|---|---|
| `GET /api/bootstrap` | initial load | Returns `{projects, milestones, changeLogs, comments, allocations}` in one round-trip (replaces the static import). |
| `GET /api/projects` | list | filters via query string |
| `PATCH /api/projects/:id` | set health override / archive | `{override_health, override_note}` etc. |
| `GET /api/projects/:id/milestones` | list | ordered by `sort_order` |
| `POST /api/milestones` | `insertMilestone` | `{projectId, afterId, name, planned_start_date, planned_end_date}` |
| `PATCH /api/milestones/:id` | `updateMilestone` | `{patch, reason}` → **reason required when patch touches `planned_*`** (409/422 otherwise) |
| `DELETE /api/milestones/:id` | `removeMilestone` | 409 if actual dates present |
| `PUT /api/projects/:id/milestone-order` | `reorderMilestones` | `{order: [ids]}` → dry-run, 409 on chain violation |
| `GET /api/milestones/:id/changelog` | history tab | append-only |
| `GET /api/projects/:id/comments` | comments tab | |
| `POST /api/projects/:id/comments` | `appendComment` | `{body, authorName?}` |
| `POST /api/import/:kind` | bulk Excel import | validated rows → single transaction upsert (see §7) |

**Error convention:** validation failures return `409 Conflict` (business rule, e.g. reason missing, ordering violation) or `422` (malformed) with `{error: "<message>"}`. The UI already surfaces `err.message` via `toast()` — so server messages flow straight to the existing toast.

---

## 5. Frontend integration — minimal change

The current code mutates module-level arrays synchronously. To persist, `mutations.js` becomes the **client of a new `core/data-store.js` adapter** that calls the API. Two-step rollout keeps the UI responsive:

1. **`core/data-store.js` (NEW)** — thin `fetch` wrapper: `getBootstrap()`, `patchMilestone(id, patch, reason)`, `insertMilestone(...)`, `appendComment(...)`, etc. Holds the in-memory cache (the same arrays the views read).
2. **`mutations.js`** — each function does an **optimistic local update** (mutate the cached array exactly as today, so the UI re-renders instantly), then `await`s the matching `data-store` call. On failure it **rolls back** the local change and rethrows so the existing `try/catch → toast` in `shell.js` shows the error. Handlers in `shell.js` are already `async` (the planned-date flow already `await`s `openReasonModal`), so this is a localized change.
3. **App boot** — `app.js` calls `GET /api/bootstrap` once and populates the caches before first `render()`, replacing the static `import { projects, ... } from mock-data.js`.

Net effect: **views, selectors, milestone algorithm, drawer — untouched.** Only the write-path and boot change.

```
edit date in drawer
  └► shell.js change handler
       └► mutations.updateMilestone(id, {actual_end_date}, reason)
            ├─ optimistic: cache[m].actual_end_date = newValue; refreshDrawerTab()
            └─ await dataStore.patchMilestone(...)   ──HTTP──► PATCH /api/milestones/:id
                 server: validate → UPDATE milestones + INSERT change_log (one tx)
                 ◄── 200 {milestone, changeLog}      (or 409 → rollback + toast)
```

---

## 6. Transactions, audit & concurrency

- **Atomic writes.** Every mutating endpoint runs inside a `better-sqlite3` transaction. A planned-date edit is **one transaction**: `UPDATE milestones … ; INSERT INTO milestone_change_logs …`. Either both land or neither — the audit trail can never drift from the data. (Mirrors the current in-memory logic in `mutations.js`.)
- **Audit trail is server-enforced.** `milestone_change_logs` rows are written by the repository, not the client, so the audit cannot be bypassed (closes the `TODO(audit)` concern at the top of `mutations.js`).
- **Concurrency (optimistic).** Each `PATCH` may send the `rev` it read; the `UPDATE … WHERE id=? AND rev=?` bumps `rev`. Zero rows affected → `409 Conflict` ("数据已被他人修改，请刷新"). v1.0 may skip this and accept last-write-wins; the column is in the schema so enabling it later needs no migration.
- **Refresh strategy.** Re-fetch the affected project's data on drawer open and on window `focus`. Sufficient for a cockpit; no websockets.

---

## 7. Excel import → DB

The existing `core/importers.js` (CSV/Excel parse + validate + normalize) is reused **as-is on the server**. Import flow:

1. Client posts the parsed/validated rows (or the file) to `POST /api/import/:kind`.
2. Server re-validates with the same schema (`template-schemas.js`) — never trust the client.
3. **One transaction** per import: `INSERT … ON CONFLICT(id) DO UPDATE` (upsert) for every row, plus one `import_batches` provenance row.
4. Milestone import enforces `requireProjectMatch` (FK + existing validator).

Upsert-by-id means re-uploading a corrected sheet updates in place instead of duplicating — matches the current `id`-keyed model.

---

## 8. Seeding & migration from mock-data

`mock-data.js` becomes the **seed source**, not the runtime store:

- `server/seed.js` reads the current arrays and bulk-inserts them on first boot (only if `projects` is empty). Because IDs are preserved verbatim, the seeded DB is byte-for-byte equivalent to today's mock state — the app looks identical on day one, then diverges as users edit.
- `roleWeights` / `statusWeights` stay as **static config** in code (they're algorithm constants, not user data) — no table needed.

---

## 9. Deployment (internal server)

- One Node process: `node server/index.js` serves static `src/` + `index.html` **and** `/api/*`.
- DB is a single file `data/pmo.sqlite`. **Backup = copy the file** (cron `sqlite3 .backup`, or filesystem snapshot). WAL checkpoint on shutdown.
- Run under `pm2` or a systemd unit for restart-on-crash.
- No external network dependency — fully self-contained on the LAN box, matching the "internal network server" constraint.

---

## 10. Phased rollout (maps onto existing T-task plan)

| Phase | Deliverable | Touches |
|---|---|---|
| **D1** | `server/` skeleton: Express, better-sqlite3, schema migration, `GET /api/bootstrap` | new `server/` |
| **D2** | Seed from `mock-data.js`; frontend boots from `/api/bootstrap` | `app.js`, `server/seed.js` |
| **D3** | `core/data-store.js` + make `mutations.js` async w/ optimistic update + rollback | `core/mutations.js`, `core/data-store.js` |
| **D4** | Milestone CRUD endpoints + server-side validation parity | `server/routes`, `server/repositories` |
| **D5** | Comments + project override (health) endpoints | `server/*` |
| **D6** | Excel import endpoint (`POST /api/import/:kind`) + `import_batches` | `server/*`, reuse `importers.js` |
| **D7** | Optimistic-concurrency (`rev`) + focus-refresh | both tiers |

After D3, the original question is answered: **editing `start_date` / `end_date` in the milestone view persists across reloads and is shared across users.**

---

## 11. Open assumptions (marked per CLAUDE.md)

1. **Author identity** stays hardcoded `"PMO Admin"` (locked Q2). When auth arrives (v1.1), add `users` + `author_id` FK; `change_logs` already has the shape to absorb `changed_by`.
2. **Single internal server**, low write concurrency → SQLite. Postgres path is mechanical (SQL isolated in repositories) if scale changes — that's why the question offered it.
3. **`allocations` are read-mostly** (refreshed by Excel import, not edited row-by-row in the UI), so no per-row allocation CRUD endpoints in v1.0.
4. Derived resource weights remain computed in `selectors.js`, not persisted.
