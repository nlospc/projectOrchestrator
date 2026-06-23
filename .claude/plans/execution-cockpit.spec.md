# Execution Cockpit — Metric & Implementation Spec

**Design mock (locked):** [Claude Design](https://claude.ai/design/p/4831e596-fad2-4d61-ab90-73372aab12e2?file=Execution+Cockpit.dc.html)
**Source data:** `docs/data-sequences.md` (canonical), `src/data/mock-data.js` (seed)

---

## 1. New derived metrics (`cockpitMetrics`)

All metrics compose from **existing** selectors in `src/core/selectors.js`. No new raw data required.

### 1.1 Delivery Confidence Index

```
confidenceIndex = green / (red + yellow + green)
```

- Uses `projectRag(project, today)` per project.
- Returns a number 0–1; display as `Math.round(confidenceIndex * 100) + '%'`.
- `delta`: `null` (trend slot — deferred to snapshot persistence fast-follow).

### 1.2 Act-Now Risk List

Projects with RAG = R or Y, ranked by **impact score** descending:

```
impactScore = deviationDays × complexity
```

- `deviationDays`: max slip across the project's milestone segments (from `computeSegments`).
  - For scenario④ (overdue, no actual): `deviationDays = today - planned_end_date` (in days).
  - For scenario② (late finish): `deviationDays = actual_end_date - planned_end_date`.
- `complexity`: from the project record (milestone-world), default 3 if missing.
- Return top 6, each with: `{ projectId, projectName, owner (pm), dept, milestoneName, slipDays, rag }`.

### 1.3 Delivery Wave (30/60/90 days)

Milestones where `actual_end_date` is null (incomplete), bucketed by `planned_end_date`:

```
wave30 = milestones.filter(m => !m.actual_end_date && daysUntil(m.planned_end_date) <= 30).length
wave60 = milestones.filter(m => !m.actual_end_date && daysUntil(m.planned_end_date) <= 60).length
wave90 = milestones.filter(m => !m.actual_end_date && daysUntil(m.planned_end_date) <= 90).length
```

- `daysUntil(date)` = `(new Date(date) - today) / 86400000`. Negative = overdue, still counts.
- Only milestones belonging to non-archived projects in `filteredProjects()`.

### 1.4 Concentration Risk

Three counts + key-person list:

```
bf1Count     = busFactorRows.filter(r => r.bf === 1).length
overAllocated = personStats.filter(p => p.ratio > 1).length
overloaded    = personStats.filter(p => p.load >= 1.2).length
keyPersons   = keyPeopleRiskRows.slice(0, 5)   // top 5 by SPOF count then load
```

- `busFactorRows` and `keyPeopleRiskRows` are existing selectors in `src/views/resource.js`.
  If they live in `resource.js`, extract to `selectors.js` for reuse.
- Each key-person row: `{ person, role, ratio, load }`.

### 1.5 Org Heatmap

Group projects by `biz`, count R/Y/G per group:

```
orgHeatmap = Map<biz, { red: number, yellow: number, green: number }>
```

- Uses `projectRag(project, today)` for each project in `filteredProjects()`.
- Archived / gray projects excluded.

### 1.6 Project Phase Distribution

Group projects by `status`, count per status:

```
phaseDistribution = Map<status, number>
```

- Collapse into 4 display buckets: 设计 (需求调研+产品设计), 开发 (产品开发), 测试 (产品自测+UAT), 运维/上线 (部署上线+系统运维).

### 1.7 Workforce Utilization Summary

```
lowLoad  = personStats.filter(p => p.load < 0.6).length
midLoad  = personStats.filter(p => p.load >= 0.6 && p.load < 1.2).length
highLoad = personStats.filter(p => p.load >= 1.2).length
```

---

## 2. Function signature

In `src/core/selectors.js`:

```js
export function cockpitMetrics(projectList = filteredProjects()) {
  return {
    confidence: { index, red, yellow, green, delta: null },
    actNow:     [{ projectId, projectName, owner, dept, milestoneName, slipDays, rag, impactScore }],
    wave:       { d30, d60, d90 },
    concentration: { bf1Count, overAllocated, overloaded, keyPersons },
    orgHeatmap: [{ biz, red, yellow, green }],
    phases:     [{ label, count }],
    workforce:  { low, mid, high },
  };
}
```

---

## 3. View contract (`src/views/cockpit.js`)

- Pure function `cockpitView()` returning an HTML string.
- Calls `cockpitMetrics()` once, destructures, renders 5 panels matching the locked mock.
- Drill-throughs: risk rows emit `data-open-project="${projectId}"` (reuses existing drawer handler in `shell.js`).
- Trend stubs: render `<div class="trend-stub">…</div>` when `delta === null`.
- No framework dependencies; plain template literals like all other views.

---

## 4. Route wiring

- `src/config/routes.js`: insert `["cockpit", "执行驾驶舱"]` as first route in the 项目 group.
- `src/ui/shell.js`: register `cockpit: cockpitView` in `routeViews`.
- `src/state/app-state.js`: change default route from `"dashboard"` to `"cockpit"`.

---

## 5. CSS additions (`styles.css`)

Extend existing token system. New class families:
- `.hero-strip`, `.hero-card`, `.hero-card.confidence` — hero KPI strip
- `.rag-donut-row`, `.rag-donut` — inline SVG donut
- `.wave-bars`, `.wave-row`, `.wave-track`, `.wave-fill` — delivery wave bars
- `.conc-stats`, `.conc-stat` — concentration risk stat blocks
- `.key-person-list`, `.key-person-row` — key-person risk rows
- `.heatmap-grid`, `.heatmap-cell` — org heatmap table
- `.trend-stub` — deferred trend placeholder

All colors from existing `:root` CSS custom properties. No new color tokens.

---

## 6. Codex slice decomposition

| Slice | File(s) | Concern | Depends on |
|---|---|---|---|
| S1 | `src/core/selectors.js` | Add `cockpitMetrics()` function | — |
| S2 | `src/views/cockpit.js` (new) | Render view using `cockpitMetrics()` | S1 |
| S3 | `styles.css` | Add cockpit CSS classes | — |
| S4 | `src/config/routes.js`, `src/ui/shell.js`, `src/state/app-state.js` | Route wiring + default route | S2 |
| S5 | `docs/data-sequences.md` | Document new derived metrics (§5 update) | S1 |

S1 and S3 are independent — can run in parallel.
S2 depends on S1. S4 depends on S2. S5 depends on S1.

---

## 7. Acceptance criteria

- [ ] `cockpitMetrics()` returns correct values matching existing view counts (no drift)
- [ ] Cockpit renders all 5 panels matching locked mock layout
- [ ] Risk rows drill through to project drawer
- [ ] Trend stubs render neutral (dashed placeholder)
- [ ] No regression to existing routes (dashboard, projects, resource, etc.)
- [ ] App boots clean with `npm start`
