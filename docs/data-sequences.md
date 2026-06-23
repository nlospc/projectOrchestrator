# Data Sequences — Resource Module

Canonical data structure and **资源统计分析方法 (resource statistics / analysis method)** for the
PMO Orchestrator resource view. The method is a faithful port of the **R2-Workforce Dashboard**
prototype at [`design/R2-Workforce-Dashboard-offline-V14/`](../design/R2-Workforce-Dashboard-offline-V14/overview.md).

> Verified against the prototype bundle (`design/R2-Workforce-Dashboard-offline-V14/assets/app.js`)
> on 2026-06-19. Formula, thresholds, status weights, and 12 role-weight rows now match the bundle.

---

## 1. Allocation record

One row per (person × project × role) assignment. Defined in `src/data/mock-data.js` → `allocations[]`,
served at runtime via `src/core/data-store.js`.

| Field | Type | Notes | R2 `cn` equivalent |
|---|---|---|---|
| `id` | string | PMO-added stable key (e.g. `R2-001`) | _(none)_ |
| `cat` | string | Category, e.g. `临床` | `cat` |
| `dept` | string | Department / org, e.g. `临床研究组织（CRO）` | `deptOrg` |
| `biz` | string | Business department | `bizDept` |
| `system` | string \| null | Platform / system name | `system` |
| `projectId` | string | Legacy R2 project key, e.g. `PV / SRtracking` | `project` |
| `projectName` | string | Display name | _(derived from `project`)_ |
| `complexity` | number | 1–5 (occasionally higher in prototype data) | `complexity` |
| `status` | string | Project phase (see §3 keys) | `status` |
| `role` | string | Role name (see §2 keys) | `role` |
| `person` | string | Person name | `person` |
| `outsourced` | boolean | `true` = external contractor | `outsourced` |
| `timeRatio` | number | Time-investment ratio 0–1 (0.3 = 30%) | `timeRatio` |

**Field renames from the prototype:** `deptOrg→dept`, `bizDept→biz`, `project→projectId` (+ added
`projectName`), plus an added `id`. All other fields are identical.

---

## 2. Workload formula

```
load = timeRatio × √(complexity / 5) × roleStatusWeight
```

- Prototype: `Na(e) = timeRatio × √(complexity/5) × Zm(role, status)` where `Zm = V_[role]?.[status] ?? 0`.
- PMO: `loadFor(allocation)` in `src/core/utils.js`.

Both read `complexity` and `status` **directly from the allocation record**. The values come from
the Excel upload, not from the milestone-driven `projects[]` table (see §6).

### Load thresholds

| Band | Range | Class |
|---|---|---|
| 🟢 Low (低负荷) | `load < 0.6` | `G` |
| 🟡 Medium (中负荷) | `0.6 ≤ load < 1.2` | `Y` |
| 🔴 High (高负荷) | `load ≥ 1.2` | `R` |

Additionally, a person with **Σ timeRatio > 1.0 (100%)** across projects is flagged **超分配 (over-allocated)**.

---

## 3. Status weights (`statusWeights`)

Verified identical to the prototype bundle.

| Status | Weight |
|---|---|
| 需求调研 | 0.10 |
| 产品设计 | 0.30 |
| 产品开发 | 1.00 |
| 产品自测 | 0.60 |
| UAT | 0.60 |
| 部署上线 | 0.30 |
| 系统运维 | 0.03 |
| 项目暂停 | 0.00 |

`statusWeights` is used as the fallback weight when a role is missing from `roleWeights` (see §6,
deviation D2). The prototype has no such fallback.

---

## 4. Role × status participation weights (`roleWeights`)

`roleWeights[role][status]` → participation weight 0–1. All 12 rows now match the prototype `V_` matrix.

| Role \ Status | 需求调研 | 产品设计 | 产品开发 | 产品自测 | UAT | 部署上线 | 系统运维 |
|---|---|---|---|---|---|---|---|
| 项目经理 | 0.6 | 0.7 | 0.7 | 0.7 | 0.7 | 0.6 | 0.2 |
| 产品经理 | 1.0 | 1.0 | 0.8 | 0.6 | 0.6 | 0.3 | 0.2 |
| 技术负责人 | 0.5 | 0.8 | 0.9 | 0.7 | 0.7 | 0.6 | 0.3 |
| 前端 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| 后端 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| 测试 | 0.1 | 0.2 | 0.6 | 1.0 | 1.0 | 0.4 | 0.1 |
| 运维 | 0.0 | 0.1 | 0.1 | 0.3 | 0.3 | 0.5 | 1.0 |
| Agent开发 | 0.2 | 0.4 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| UI/UX | 0.3 | 1.0 | 0.7 | 0.3 | 0.3 | 0.1 | 0.05 |
| 模型 | 0.6 | 0.6 | 0.9 | 0.4 | 0.4 | 0.2 | 0.3 |
| 架构师 | 0.8 | 0.9 | 0.8 | 0.3 | 0.3 | 0.3 | 0.1 |
| 全栈开发工程师 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |

> **Reconciled 2026-06-19** — 4 rows were ported with wrong values and have been corrected to the
> bundle: **UI/UX, 模型, 架构师, 全栈开发工程师**. These roles are heavily used in the seed
> (全栈开发工程师 ×50, 模型 ×10, UI/UX ×10, 架构师 ×7), so the fix changes live load numbers.

---

## 5. Derived statistics (`src/core/selectors.js`, `src/views/resource.js`)

| Statistic | Function | Definition |
|---|---|---|
| Person load | `personStats` / `resourcePeopleStats` | Σ `loadFor(allocation)` per person |
| Person ratio | same | Σ `timeRatio` per person; `> 1` ⇒ 超分配 |
| Role coverage | `roleRows` | per-role people/projects/ratio/load + outsourced share |
| System rollup | `systemRows` | per-system projects/people/ratio/load |
| Business groups | `businessProjectGroups` | projects grouped by `biz`, people split by role bucket |
| **Bus Factor** | `busFactorRows` | min # of people (ranked by load desc) whose cumulative load reaches **≥ 50%** of a project's total load. **BF=1** = single point of failure 🔴, **BF=2** 🟡, **BF≥3** healthy 🟢 |
| Key-person risk | `keyPeopleRiskRows` | top contributors of BF≤2 projects, ranked by SPOF count then load |

All of the above are identical in definition to the prototype views (`/`, `/matrix`, `/workload`,
`/roles`, `/busfactor`, `/people`).

### 5b. Executive cockpit metrics (`cockpitMetrics`, `src/core/selectors.js`)

Added 2026-06-23. Composes from the selectors above — no new raw data.

| Metric | Formula | Notes |
|---|---|---|
| Delivery Confidence | `green / (R + Y + G)` | 0–1; displayed as %. `delta` stubbed `null` (awaits batch-snapshot persistence). |
| Act-Now risk rank | `deviationDays × complexity` desc | Top 6 slipping projects. `deviationDays` = max milestone slip via `computeSegments`. |
| Delivery wave | milestones where `!actual_end_date`, bucketed ≤30 / ≤60 / ≤90 days | Negative `daysUntil` (overdue) still counts in bucket. |
| Concentration risk | `bf1Count` + `overAllocated` + `overloaded` + top-5 key persons | Reuses `busFactorRows`, `keyPeopleRiskRows`, `personStats`. |
| Org heatmap | R/Y/G counts grouped by `biz` | Uses `projectRag`; excludes archived/gray. |
| Phase distribution | project count per status bucket (设计/开发/测试/运维上线) | 8 statuses collapsed to 4 display buckets. |
| Workforce utilization | load < 0.6 / 0.6–1.2 / ≥ 1.2 person counts | Same thresholds as §2. |

---

## 6. Known deviations & recommendations

| ID | Deviation | Status | Recommendation |
|---|---|---|---|
| **D1** | `loadFor` previously performed a dead allocation-to-project join to source status/complexity. | Resolved | The dead join was removed in commit `c299519`; `loadFor` now reads status/complexity directly from the allocation record. |
| **D2** | Role-weight resolver fallback differed from the prototype's `Zm = V_[role]?.[status] ?? 0`. | Resolved — aligned to `?? 0` | Unknown roles contribute 0 load, matching prototype fidelity. Validation warnings surface unknown roles at import time. |
| **D3** | Resource world is standalone: `resourceProjects()` is synthesized from `allocations[]`, disjoint from the milestone/`projects[]` world. `projectResourceSummary()` therefore returns zeros. | By design | Matches the self-contained prototype. Cross-linking Gantt ↔ resource would require an allocation→`P-24xx` ID map (out of scope here). |
| **D4** | Bus Factor previously ranked raw allocation rows instead of per-person totals. | Resolved | `busFactorRows` now aggregates load per person before ranking, matching prototype `h3`; zero-load allocations are skipped. |

---

## 7. Source of truth

- Weights & schema: `src/data/mock-data.js` (`roleWeights`, `statusWeights`, `allocations`).
  These are the **only** definitions; `server/seed.js` imports rows from here on first boot.
- Algorithm: `src/core/utils.js` (`loadFor`, `loadClass`), `src/core/selectors.js`, `src/views/resource.js`.
- Prototype reference: `design/R2-Workforce-Dashboard-offline-V14/overview.md` + `assets/app.js`.

---

## 8. Batch snapshots & trend deltas

Added 2026-06-23. Enables the "↑/↓ vs 上批次" trend indicators on `#dashboard` and `#cockpit`.

### 8a. Motivation

Every headline number on the executive dashboard needs a direction arrow and magnitude
(`信心 78% ↓3`). The cockpit already stubs `delta: null` (§5b). Without persisted
snapshots of prior state there is no baseline to diff against.

### 8b. Snapshot record (`batch_snapshots`)

One row is written per Excel import (any `kind`). It freezes the **output** of
`cockpitMetrics()` at the moment the import lands — same shape, flat columns.

| Field | Type | Source |
|---|---|---|
| `id` | TEXT PK | `"BS-" + uid()` |
| `batch_id` | TEXT FK → `import_batches.id` | The import that triggered this snapshot |
| `snapped_at` | TEXT (ISO) | `new Date().toISOString()` at write time |
| `confidence_index` | REAL | `confidence.index` (0–1) |
| `red` | INTEGER | `confidence.red` |
| `yellow` | INTEGER | `confidence.yellow` |
| `green` | INTEGER | `confidence.green` |
| `wave_d30` | INTEGER | `wave.d30` |
| `wave_d60` | INTEGER | `wave.d60` |
| `wave_d90` | INTEGER | `wave.d90` |
| `bf1_count` | INTEGER | `concentration.bf1Count` |
| `over_allocated` | INTEGER | `concentration.overAllocated` |
| `overloaded` | INTEGER | `concentration.overloaded` |
| `workforce_low` | INTEGER | `workforce.low` |
| `workforce_mid` | INTEGER | `workforce.mid` |
| `workforce_high` | INTEGER | `workforce.high` |
| `project_total` | INTEGER | `red + yellow + green` |
| `phase_json` | TEXT | JSON array of `{label, count}` (§5b phases) |
| `org_heatmap_json` | TEXT | JSON array of `{biz, red, yellow, green}` (§5b orgHeatmap) |

**Why flat columns + two JSON columns?**
- The 15 scalar metrics are the ones that appear as KPI tiles with deltas — they must be
  queryable and diffable without JSON parsing.
- `phase_json` and `org_heatmap_json` are variable-length arrays used only for
  historical drill-down (not KPI deltas), so a structured column would add complexity
  with no query benefit.

### 8c. Write trigger

Snapshots are written **inside the same transaction as the import** in the
`POST /api/import/:kind` handler (see `db-persistence-design.md` §7):

```
BEGIN;
  -- upsert rows (existing import logic)
  INSERT INTO import_batches ...;
  -- NEW: freeze current cockpit state
  INSERT INTO batch_snapshots (...) VALUES (...);
COMMIT;
```

The server calls `cockpitMetrics()` **after** the upsert rows land but **before** commit,
so the snapshot reflects the state *including* the new import.

### 8d. Delta selector (`snapshotDelta`)

New export in `src/core/selectors.js`:

```js
// snapshotDelta(currentMetrics, previousSnapshot) → deltas object
//
// previousSnapshot = the most-recent batch_snapshots row, fetched at
// bootstrap via GET /api/bootstrap (added to the payload).
//
// Returns null when no previous snapshot exists (first-ever import).
// Otherwise returns an object with the same scalar keys, each value =
// (current − previous). Positive = improvement for confidence_index,
// workforce_low; positive = deterioration for red, overloaded, bf1_count.
// The view layer decides arrow color based on the field's polarity.
```

**Field polarity** (determines whether ↑ is good or bad):

| Field | ↑ = good | ↑ = bad |
|---|---|---|
| `confidence_index` | ✓ | |
| `green`, `workforce_low` | ✓ | |
| `red`, `yellow` | | ✓ |
| `bf1_count`, `over_allocated`, `overloaded` | | ✓ |
| `wave_d30`, `wave_d60`, `wave_d90` | | ✓ |
| `workforce_mid` | | (neutral) |
| `workforce_high` | | ✓ |
| `project_total` | (neutral) | |

### 8e. API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/bootstrap` | Add `previousSnapshot` (latest `batch_snapshots` row) to existing payload |
| `GET /api/snapshots?limit=N` | Historical list for future sparkline/trend chart (not v1.0) |

### 8f. View integration

**`#dashboard` (项目总览):**
- Headline verdict renders `confPct` + arrow from `snapshotDelta.confidence_index`.
- Each KPI tile adds `↑N / ↓N` sub-label from the corresponding delta field.
- Arrow color: green for "good direction" per polarity table, red for "bad direction".

**`#cockpit` (执行驾驶舱):**
- `confidence.delta` (currently `null`) is replaced by `snapshotDelta.confidence_index`.
- `vs 上批次` placeholder becomes a real formatted delta.

### 8g. Graceful degradation

- **No snapshots yet** (fresh install, no imports): `delta = null` → views render
  `--` or hide the arrow. No errors.
- **Only one snapshot**: delta is computed against that one (shows change since first import).
- **Multiple snapshots**: always diff against `ORDER BY snapped_at DESC LIMIT 1 OFFSET 1`
  (the second-most-recent), so each import shows change vs the *previous* import.
