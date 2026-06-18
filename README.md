# PMO Orchestrator

An internal PMO (Project Management Office) cockpit for tracking project
milestone health and people-to-project resource allocation. Data comes from
Excel/CSV uploads; the app renders a milestone Gantt with planned-vs-actual
red/yellow/green status, a resource allocation board, and PMO manual health
overrides — all backed by a shared SQLite store so edits persist across
reloads and are visible to every user on the internal network.

> Status: v1.0. Author identity is hardcoded to `PMO Admin` (no auth yet).

---

## Quick start

```bash
npm install          # installs express + better-sqlite3
npm start            # serves the app + API at http://localhost:3000
# or, with auto-restart on file changes:
npm run dev
```

On first boot the server creates `data/pmo.sqlite` and seeds it from
`src/data/mock-data.js` (6 projects, 14 milestones, ~267 allocations). Open
<http://localhost:3000> in a browser. Set `PORT` to change the port.

To reset to a clean seed, stop the server and delete the DB files:

```bash
rm -f data/pmo.sqlite data/pmo.sqlite-shm data/pmo.sqlite-wal
```

---

## Architecture

One Node process serves both the static ES-module frontend and the `/api`
routes. There is no build step — the browser loads the `src/` modules directly.

```
Browser (ES modules, no bundler)
  views/* ─► core/mutations.js ─► core/data-store.js ──fetch JSON──┐
                                                                   │ HTTP (LAN)
Node + Express (server/)                                           ▼
  routes/  ─►  repositories/ (DAO + tx)  ─►  better-sqlite3 ─► data/pmo.sqlite
```

The single write-path is `core/mutations.js`: every UI edit funnels through it,
updates the in-memory cache optimistically for an instant re-render, then
`await`s the matching REST call and **rolls back on failure** (the error
surfaces as a toast). Views, selectors, and the milestone algorithm never talk
to the network directly.

### Layout

| Path | Responsibility |
|---|---|
| `index.html`, `app.js`, `styles.css` | Shell, boot, styling |
| `src/ui/shell.js` | Routing, event delegation, render loop, multi-user re-sync |
| `src/views/*` | `projects` (Gantt + drawer), `resource` (board/matrix/workload/busfactor/people), `admin` (upload/settings) |
| `src/core/milestones.js` | `computeSegments()` — planned-vs-actual segment + RAG algorithm |
| `src/core/selectors.js` | Derived metrics (project RAG, resource load, dashboard rollups) |
| `src/core/mutations.js` | Single async write-path with optimistic update + rollback |
| `src/core/data-store.js` | In-memory cache + `fetch` adapter to the API |
| `src/core/importers.js`, `template-schemas.js` | CSV parse / validate / normalize |
| `server/index.js` | Express app: static hosting + `/api`, seeds on boot |
| `server/db.js` | SQLite connection (WAL, FK on), `revConflict()` helper |
| `server/migrations/001_init.sql` | Schema (DDL) |
| `server/repositories/*` | DAO layer; maps rows to the exact shapes the frontend uses |
| `server/routes/*` | REST endpoints |
| `server/seed.js` | One-time seed from `mock-data.js` |
| `docs/` | PRD, architecture notes, DB/persistence design |

---

## Data model

Six tables, all with human-readable string IDs preserved from the seed
(`P-2401`, `P-2401-M1`, `CL-001`): `projects`, `milestones`,
`milestone_change_logs` (append-only audit), `comments`, `allocations`,
`import_batches` (upload provenance). Full DDL and rationale live in
[`docs/db-persistence-design.md`](docs/db-persistence-design.md).

Backups are a file copy: `data/pmo.sqlite` is the whole database.

---

## REST API

| Method & path | Purpose |
|---|---|
| `GET /api/bootstrap` | Initial load — all tables in one round-trip |
| `GET /api/projects` · `PATCH /api/projects/:id` | List / set health override / archive |
| `GET /api/projects/:id/milestones` | Milestones ordered by `sort_order` |
| `POST /api/milestones` · `PATCH /api/milestones/:id` · `DELETE /api/milestones/:id` | Insert / edit / remove |
| `PUT /api/projects/:id/milestone-order` | Reorder (dry-run validated) |
| `GET /api/milestones/:id/changelog` | Audit history |
| `GET /api/projects/:id/comments` · `POST /api/projects/:id/comments` | Comments |
| `POST /api/import/projects` · `POST /api/import/allocations` | Bulk CSV import |

**Validation parity:** the server re-enforces the same rules as the client —
`planned_*` edits require a reason, `actual_end_date` cannot precede the prior
milestone, delete is blocked when actual dates exist, reorder is dry-run
validated. Business-rule failures return `409` with `{ error }`; the UI shows
`error` as a toast.

---

## Excel / CSV import

The Data Upload screen accepts the templates it can also export (Project sheet,
Milestone sheet, Resource Allocation sheet). On upload the client parses and
validates with `core/importers.js`, then posts the rows:

- **Projects** — upsert by `id` (re-uploading a corrected sheet updates in
  place; new IDs are inserted; existing milestones/comments are preserved).
- **Allocations** — full table replace (allocations have no child rows), since
  the resource view is refreshed wholesale from the source-of-truth sheet.

Each import records a row in `import_batches` for provenance, and the client
re-pulls `bootstrap` so every view reflects the new data immediately.

---

## Concurrency (shared multi-user store)

Because the DB is shared, two PMO users can edit at once. The app uses
**optimistic concurrency** via a `rev` counter per row:

1. Each project/milestone carries a `rev`. The client echoes the `rev` it last
   read on every `PATCH`.
2. The server rejects the write if the row's `rev` has moved on (someone saved
   first), returning `409 { code: "REV_CONFLICT" }`.
3. The client rolls back its optimistic change, toasts
   *"数据已被他人修改，请刷新后重试"*, and **automatically re-syncs** the whole
   cache from the DB (via a `pmo:stale` window event).

The cache also **re-syncs on window focus / tab visibility**, so a tab left
open picks up other users' changes without a manual refresh. (`rev` is bumped
but not checked on bulk imports — those are intentionally last-write-wins.)

---

## Deployment (internal server)

- Run `node server/index.js` (under `pm2` or a systemd unit for
  restart-on-crash). It serves the frontend and the API from one process — no
  separate web server needed.
- SQLite in WAL mode; no external network dependency. Back up by copying
  `data/pmo.sqlite`.

---

## Docs

- [`docs/PRD_PMO里程碑管理工作台.md`](docs/PRD_PMO里程碑管理工作台.md) — product requirements
- [`docs/architecture.md`](docs/architecture.md) — architecture notes
- [`docs/db-persistence-design.md`](docs/db-persistence-design.md) — database & persistence design
