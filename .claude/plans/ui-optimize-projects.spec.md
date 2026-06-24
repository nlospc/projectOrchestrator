# UI Optimize Spec: `#projects` (关键里程碑监控)

**Route:** `#projects`
**View:** `src/views/projects.js` → `projectsView()` + `timeline()`
**Status:** Phase 0 — Audit spec locked

---

## Goal

Elevate the Gantt milestone view to executive-grade for VP/COO/BU-head.
They need a 2-second health read before engaging with timeline detail.

## Changes

### 1. Summary hero strip (NEW)

Add a compact KPI strip above the Gantt panel:
- Total projects count
- RAG mini-donut + red/yellow/green counts (clickable → filter)
- Slipping milestones count (scenario 2/4)
- Max deviation days
- Upcoming milestones ≤30d

Uses existing `filteredProjects()` + `projectRag()` — no new raw data needed.

### 2. Group-by: add `family` (产品族), set as default

Current options: none / dept / owner / rag
Add: `["family", "按产品族"]` as first option, change default `groupBy` from `"none"` to `"family"`.

### 3. Project list row refinement

- Add dept + biz subtitle line
- Show deviation badge (e.g., `+14d`) for R/Y projects
- Reduce row height: 76px → 60px (both list + gantt row)
- Tighter spacing

### 4. Toolbar visual polish

- Use `--primary` instead of `--brand` for active granularity chip
- Muted labels match cockpit palette
- Clean borders

### 5. Gantt visual polish

- Segment legend strip below toolbar (green=按期, amber=延期, red=逾期, gray=归档)
- Better segment hover state
- Refined today line
- Month header alignment

### 6. Group header enhancement

- Add mini R/Y/G dot counts alongside existing red count
- Consistent with cockpit heatmap visual language

## Anti-patterns (per SKILL.md)
- No gradient backgrounds
- No emoji in data cells
- No rounded-corner accent-border cards
- No new color tokens
- Color for RAG meaning only

## Selector needed

`projectsViewMetrics(list)` returning:
```
{ total, red, yellow, green, slippingCount, maxDeviation, milestonesDue30 }
```

## Files to modify

| File | Action |
|---|---|
| `src/core/selectors.js` | Add `projectsViewMetrics()` |
| `src/views/projects.js` | Update `projectsView()`, `projectListRow()`, `groupRow()` |
| `src/state/app-state.js` | Change default `groupBy` to `"family"` |
| `styles.css` | Add `.projects-hero-strip`, refine existing Gantt classes |
