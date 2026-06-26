# Plan: Optimize Resource Views UI (#resource #matrix #workload #busfactor #people)

**Audience:** VP / COO / BU-head — glance-first executive read, then drill.
**Method:** ui-optimize skill — Claude Design mock (locked) → Codex slices via `/codex:rescue` → Claude audit → gated commit.
**Design language:** locked from cockpit / `resource-overview-v2` (see `.claude/skills/ui-optimize/SKILL.md`).

## Summary
Elevate the four un-optimized resource routes (`#matrix`, `#workload`, `#busfactor`, `#people`)
to the executive-grade visual + interaction quality already shipped on `#resource`
(`resourceOverviewView`, `b515c4c`) and `#cockpit`. `#resource` is the locked reference and
gets only a consistency check. No formulas change — `docs/data-sequences.md` stays canonical.

## Scope decision
- **`#resource`** is already `resource-overview-v2` (hero strip + `cockpit-panel`). Treat as the
  reference design; **do not rebuild** — only verify token/class consistency. *(assumption — adjust if you want it re-touched)*
- Effort concentrates on **`#matrix`, `#workload`, `#busfactor`, `#people`**.

## Per-route gap → target

### #matrix (`matrixView` resource.js:438)
- Remove `📊` emoji in `<h2>` (anti-pattern, resource.js:472).
- Replace `.matrix-toolbar`/`<h2>` headers with `.panel-header` + `.panel-title` + `.panel-badge`.
- Add hero strip: # systems, # projects, # people in matrix, avg participation.
- Keep `benchmarkParticipationMatrix()` (role×stage) and `businessProjectGroups()` intact;
  re-skin the role×stage grid as a heatmap matching cockpit `.heatmap-grid`.
- Preserve `project-focus-banner` + `data-action="clear-project-focus"`.

### #workload (`workloadView` resource.js:565)
- Replace old `kpi()` tiles (resource.js:583-588) with `.hero-strip`.
- Wrap heatmap in `.panel.cockpit-panel` with `.panel-header`; sticky first column + header row.
- Move load-threshold legend into a clean `.seg-legend` strip (drop the standalone panel).
- Keep `matrixCell()` drill (`data-open-person`) and `resourceFilterBar()`.

### #busfactor (`busFactorView` resource.js:692)
- Replace `.resource-page-head` + `kpi()` row with `.hero-strip` (BF=1, BF=2, BF≥3, key persons).
- Unify the 4 sections under `.panel.cockpit-panel` + `.panel-header`; keep donut, risk bars,
  redline cards, coverage heatmap, detail table, and both CSV export buttons.
- Tighten density; move the long explanatory paragraph into a collapsible/`.panel-sub-label`.

### #people (`peopleView` resource.js:770)
- Add `.hero-strip`: total / internal / external / overloaded / over-allocated (reuse
  `resourcePeopleStats` + load thresholds from §2 data-sequences).
- Add `resourceFilterBar()` and a load-distribution micro-bar; keep live `#people-search`.
- Polish `peopleCard()` grid: load lamp, ratio, project count, source tag — sortable by load/ratio.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Hero strip | `resource.js:32-58`, `cockpit.js:13-47` | `.hero-strip` > `.hero-card` (+`.clickable data-route`) |
| Panel | `cockpit.js:50-93` | `.panel.cockpit-panel` > `.panel-header` > `.panel-title`/`.panel-badge` |
| Heatmap | `cockpit.js:121-130` | `.heatmap-grid` / `.heatmap-cell` hot/warm/cool |
| Filter bar | `resource.js:497` | shared `resourceFilterBar()` (state.resourceFilters) |
| Drill | resource.js `data-open-person`, `data-route`, `data-open-project` | keep all existing handlers |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/views/resource.js` | UPDATE | Rewrite `matrixView`, `workloadView`, `busFactorView`, `peopleView` + helpers |
| `src/core/selectors.js` | UPDATE (lean) | Add small aggregate helpers only where a hero strip needs counts not already computed |
| `styles.css` | UPDATE | Add namespaced classes; reuse cockpit classes; no new color tokens |

## Execution (ui-optimize workflow)

**Phase 1 — Design mock (Claude Design MCP).** One hi-fi mock covering the 4 routes in the
locked language. Share `open_url`. **WAIT for "lock it".**

**Phase 2 — Decompose into Codex slices** (one file/concern each):
- Round A `#people` → S1 view rewrite, S2 CSS
- Round B `#workload` → S3 view rewrite, S4 CSS
- Round C `#busfactor` → S5 view rewrite, S6 CSS
- Round D `#matrix` → S7 view rewrite, S8 CSS

**Phase 3 — Execute per slice** via `/codex:rescue` with self-contained spec (file paths,
HTML structure, pattern line-refs, validation cmd). Audit each: read file, verify vs mock,
regression-check adjacent routes, screenshot via chrome-devtools. **Gated commit per route**
(4 `feat:` commits, matching existing cadence).

**Phase 4 — Verify.** `npm start`, load each route, confirm drill-throughs, filter bar,
KPI-count parity with cockpit/dashboard, no duplicate CSS classes.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| `#people` adding filter bar collides with live `#people-search` | Med | Filter bar narrows the dataset; search filters the rendered grid on top |
| Restructuring `#matrix` breaks `benchmarkParticipationMatrix`/`businessProjectGroups` | Med | Keep those functions; only change wrappers/headers |
| Dropped drill handler (`data-open-person` etc.) | Med | Audit checklist asserts every handler survives |
| CSS class collision in 3055-line styles.css | Med | grep before add; namespace `rv-*`; reuse cockpit classes |
| Hero counts diverge from cockpit | Low | Source from same selectors as `cockpitMetrics` |

## Acceptance
- [ ] Mock locked before any code slice
- [ ] 4 routes match locked mock; `#resource` consistency verified
- [ ] No `📊`/emoji in data cells; no new color tokens; no gradients
- [ ] All drill-throughs + filter bar work; KPI counts match cockpit
- [ ] `npm start` boots clean; adjacent routes regression-free
- [ ] Per-route gated `feat:` commits
