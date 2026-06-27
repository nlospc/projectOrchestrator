# Project ↔ Resource Reconciliation Design (v1.0)

**Status:** Design (implementation deferred per CLAUDE.md)
**Decision:** A **confirmation-gated link registry** bridges the milestone-tracked
`projects[]` world and the resource-tracked `allocations[]` world. The matcher only
*proposes*; a human *confirms*; **unmatched is a permanent, first-class state.**
**Date:** 2026-06-26
**Closes:** `data-sequences.md` §6 deviation **D3** (resource world disjoint from `projects[]`).

---

## 1. Problem

The two modules describe the **same kind of entity** (a project) but were seeded from
two different prototypes and never linked:

| | Project module (`projects[]`) | Resource module (`allocations[]`) |
|---|---|---|
| Count (seed) | **6** coarse, hand-authored programs | **69** fine-grained initiatives (27 systems) |
| Key | `P-2401` … | `project_key` = `"PV / SRtracking"` (legacy R2 string) |
| Health | real `health` + override | naively derived from status (`resource.js`) |
| `biz` / `dept` / `complexity` / `status` | canonical | **duplicated**, can diverge |

`projectResourceSummary()` (`src/core/selectors.js`) already attempts a join on
`allocation.projectId === project.id` and is documented to return zeros — that broken
join is the symptom this design fixes.

### 1.1 Why name-matching alone cannot solve it

A name-matching pass was run over the live seed (normalized + token-Jaccard):

```
Exact projectName ↔ project.name overlap:  0 / 69
Best fuzzy candidates: all character-overlap noise
  临床数据分析与可视化平台 → 项目组合数据中台   0.33  (shares 据/平/台)
  主数据中台              → 项目组合数据中台   0.50  (shares 数据中台)
  RPM                    → CRM 稳定性治理    0.50  (R/M letters)
```

**Conclusion that drives the whole design:** the matcher can never be trusted to
auto-link. It is a *proposal engine*. The system must work correctly when **most or all
links are absent**, and "unmatched" must be a normal state — not an error queue that
demands resolution.

---

## 2. Approach — a side registry, not a field

The link lives in its own table/array, **not** as a `projectRef` column on `allocations`,
because:

- The relationship is **many-to-one** (many initiatives roll up to one project) — chosen
  grain is **initiative → project** (`project_key` → `projects.id`).
- It is **mutable and auditable** — a human curates it over time; we need who/when/source.
- **Neither siloed schema changes.** The registry is purely additive; an empty registry
  means the app behaves **exactly as today** (full backward-compat).

```
projects[]  (canonical, coarse)        allocations[]  (resource, fine)
   P-2401  ◄─────────┐                    PV / SRtracking
                     │ project_links      PV / Copilot
   P-2402  ◄──┐      └────────────────────PV / Agent
              └───────────────────────────临床数据分析与可视化平台 / 数据对比
   (no link) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ AI翻译平台 / AI翻译平台   ← 未关联 (valid)
```

---

## 3. Schema (DDL)

Follows `db-persistence-design.md` conventions (snake_case SQL, human-readable string IDs,
repository maps rows to the frontend object shape).

```sql
-- ── project_links (resource initiative ↔ canonical project) ───────────────
CREATE TABLE project_links (
  id            TEXT PRIMARY KEY,                 -- "LNK-" + uid()
  resource_key  TEXT NOT NULL,                    -- allocations.project_key ("PV / SRtracking")
  project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,  -- NULL = unmatched
  status        TEXT NOT NULL DEFAULT 'proposed', -- 'proposed' | 'confirmed' | 'rejected'
  match_source  TEXT NOT NULL,                    -- 'auto' | 'manual' | 'import'
  confidence    REAL,                             -- 0–1 from matcher; NULL when manual
  candidate_json TEXT,                            -- JSON: ranked alt candidates [{project_id,score}]
  confirmed_by  TEXT,                             -- audit
  confirmed_at  TEXT,                             -- ISO timestamp
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(resource_key)                            -- one live link per resource initiative
);
CREATE INDEX idx_links_project ON project_links(project_id);
CREATE INDEX idx_links_status  ON project_links(status);
```

**Notes**
- Keyed on `resource_key` (the initiative string), **not** an allocation row id — one
  initiative spans many allocation rows. `UNIQUE(resource_key)` guarantees one live link.
- `project_id NULL` + `status='rejected'` ⇒ explicitly "no project exists for this
  initiative" (a curator decision, distinct from "not yet reviewed").
- `candidate_json` preserves the matcher's ranked alternatives so the reconciliation
  console can offer one-click re-pick without re-running the matcher.
- `ON DELETE SET NULL`: archiving/deleting a project orphans its links to unmatched
  rather than cascading away the curation history.

### 3.1 Link state machine

```
            matcher proposes                 curator picks
  (none) ──────────────────► proposed ──────────────────► confirmed
                                │  │                          │
                 curator rejects│  │curator clears            │curator unlinks
                                ▼  ▼                          ▼
                            rejected ◄──────────────────── proposed
```

- **proposed** — matcher's suggestion, *not* applied to enrichment (§5). Surfaced in the console.
- **confirmed** — drives enrichment and the project↔resource summary.
- **rejected** — curator asserts no canonical project; initiative stays standalone forever.
- **absent (no row)** — never reviewed; treated identically to standalone. Equivalent to
  "未关联" in the UI.

---

## 4. Matcher (proposal engine only)

A pure function `proposeLinks(allocations, projects) → ProposedLink[]`. **Writes nothing**;
the reconciliation flow decides what to persist as `status='proposed'`.

### 4.1 Tiers (highest confidence first)

| Tier | Rule | Confidence | Auto-confirm? |
|---|---|---|---|
| T0 exact | `norm(project_name) === norm(project.name)` or `=== norm(project.code)` | 1.00 | **No** (still proposed) |
| T1 contains | one normalized name fully contains the other (len ≥ 4) | 0.70 | No |
| T2 token | Jaccard(tokens) ≥ 0.5 over name **and** agreeing `biz`/`dept` | 0.40–0.65 | No |
| — none | below threshold | — | → `status='proposed', project_id=NULL` *(review)* or left absent |

`norm(s)` = lowercase, strip whitespace and `/（）()【】-—·`.

**No tier auto-confirms.** Even T0 lands as `proposed` for a human to accept — because the
seed proved T0 produces 0 rows and real uploads may still collide on generic names
(`IND264` vs `IND265`). The threshold for *creating a proposal row at all* is conservative
(≥ T2); everything below is left absent so the console isn't flooded with noise.

### 4.2 Re-run semantics

- Idempotent: re-running never overwrites a `confirmed` or `rejected` row.
- For `proposed` rows it refreshes `confidence`/`candidate_json` only.
- New resource_keys (from a fresh Excel import) get new proposals; vanished keys keep their
  rows (a re-upload may reintroduce them).

---

## 5. Unmatched as first-class (both sides)

The core requirement: the product is fully usable with zero confirmed links.

### 5.1 Resource side (`resourceProjects`, `src/core/selectors.js`)

```js
// enrich ONLY when a confirmed link exists; else fall back to allocation's own fields
const link = confirmedLinkFor(allocation.project_key);     // null when unmatched
const canonical = link ? projectsById.get(link.project_id) : null;

rows.set(allocation.project_key, {
  id:         canonical?.id        ?? allocation.project_key,
  name:       canonical?.name      ?? allocation.project_name,
  biz:        canonical?.biz       ?? allocation.biz,        // canonical wins, no silent divergence
  dept:       canonical?.dept      ?? allocation.dept,
  status:     canonical?.status    ?? allocation.status,
  complexity: canonical?.complexity ?? allocation.complexity,
  health:     canonical ? effectiveHealth(canonical) : derivedHealth(allocation),
  linked:     Boolean(canonical),                            // drives the 未关联 badge
  // resource-only fields always from allocation
  cat:        allocation.cat,
  system:     allocation.system,
});
```

- Unlinked initiatives render **exactly as today** — no regression.
- A **`未关联项目` badge/filter** surfaces `linked === false`.

### 5.2 Project side (`projectResourceSummary`, `src/core/selectors.js`)

- Resolve member allocations via `confirmed` links (`project_links` where `project_id = p.id`),
  replacing the broken `a.projectId === project.id` join (**fixes D3**).
- A project with **no confirmed links** returns `{ unmatched: true }` so the view shows
  **"无资源数据"** instead of the current misleading zeros.

### 5.3 Filter cross-contamination (independent fix)

`resourceProjects()` currently reads `state.filters.biz/dept` (project-module vocabulary)
against resource-vocabulary values, silently zeroing the resource view. Move resource
biz/dept filtering onto the existing `state.resourceFilters`; each dropdown is populated
only from its own dataset. This is correct **regardless** of link state and ships
independently.

---

## 6. Reconciliation console (关联中心)

An admin surface (under `#admin` / settings) with three lists:

1. **待确认 (proposed)** — `status='proposed'` rows. Each shows the initiative, the top
   candidate + confidence, and `candidate_json` alternatives. Actions: **确认** (→confirmed),
   **改选** (pick another candidate), **驳回** (→rejected).
2. **未关联资源 (unmatched initiatives)** — resource_keys with no `confirmed` link. Action:
   **手动关联** (manual link → `match_source='manual', confidence=NULL, confirmed`).
3. **无资源项目 (projects w/o resources)** — `projects` with no confirmed link. Informational;
   click-through to manually attach an initiative.

Bulk affordance: "接受所有 T0 提案" for fast first-pass when a real upload does collide.

---

## 7. API surface

Extends `db-persistence-design.md` §4.

| Method & path | Purpose |
|---|---|
| `GET /api/links` | All link rows (joined to project + initiative summary) for the console |
| `POST /api/links/propose` | Run the matcher, upsert `proposed` rows, return the diff |
| `PATCH /api/links/:id` | `{status, project_id?, confirmed_by}` — confirm / repick / reject |
| `POST /api/links` | Manual link `{resource_key, project_id, confirmed_by}` |
| `GET /api/bootstrap` | Add `links` (confirmed rows) to the existing payload so selectors enrich on boot |

`PATCH`/`POST` run in one transaction and stamp `confirmed_by`/`confirmed_at` (audit parity
with milestone change logs).

---

## 8. Seeding & migration

- New table starts **empty** → app is byte-for-byte identical to today on first boot.
- Optional one-shot `POST /api/links/propose` after seed populates the `待确认` queue; given
  the seed's 0-overlap, it will (correctly) propose almost nothing — the console then shows
  all 69 initiatives as 未关联, which is the truthful state.
- No change to `mock-data.js`, `projects`, or `allocations` schemas.

---

## 9. Phased rollout

| Phase | Deliverable | Touches |
|---|---|---|
| **R1** | `project_links` table + repository + `proposeLinks()` matcher (pure, unit-tested) | `server/`, `src/core/` |
| **R2** | `GET /api/bootstrap` carries `links`; `resourceProjects()` enrichment + `linked` flag | `selectors.js`, `bootstrap.js` |
| **R3** | `projectResourceSummary()` via links (closes D3); "无资源数据" empty state | `selectors.js`, `views/projects.js` |
| **R4** | Filter decontamination (resource biz/dept → `state.resourceFilters`) — *independent* | `views/resource.js`, `app-state.js` |
| **R5** | Reconciliation console (关联中心) + propose/confirm/reject/manual endpoints | `server/routes`, `views/admin.js` |
| **R6** | Import hook: each resource Excel import auto-runs `propose` for new keys | `server/routes/imports.js` |

R4 can ship first (pure bug-fix, no schema). R1–R3 deliver the data bridge headless;
R5 adds the human surface; R6 keeps it fed.

---

## 10. Open assumptions (marked per CLAUDE.md)

1. **Grain = initiative → project** (per locked decision). System→project is *derived*
   (a system's link = the project its initiatives agree on); if a single system's
   initiatives map to different projects, the initiative grain handles it correctly while a
   system grain could not.
2. **Many-to-one**, not many-to-many: one initiative ↔ at most one canonical project. If a
   real initiative genuinely spans two programs, model it as two initiatives upstream.
3. **No auto-confirm** at any confidence — deliberate, given the 0-overlap seed. Revisit only
   if real uploads share a stable project-key column (then T0 could auto-confirm).
4. **Matcher weights/thresholds** are config constants in code (like `roleWeights`), not a
   table — tuning them needs no migration.
5. Resource Excel remains **read-mostly** (`db-persistence-design.md` §11.3); links are the
   only curated layer on top.
