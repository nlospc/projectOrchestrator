---
name: ui-optimize
description: |
  Strategic UI optimization workflow for PMO Orchestrator views. Elevates
  each route to executive-grade visual quality matching the cockpit design
  language. Claude orchestrates + audits, Codex executes via /codex:rescue.
triggers:
  - "optimize UI"
  - "optimize view"
  - "make it pretty"
  - "升级界面"
  - "优化UI"
  - "polish route"
  - "executive upgrade"
---

# UI Optimize — Strategic View Upgrade Skill

Workflow for upgrading any PMO Orchestrator route to the executive-grade
visual language established by the `#cockpit` (执行驾驶舱) design.

## When to use

Invoke when upgrading one or more of the 9 remaining routes:

| Route | View file | Current state |
|---|---|---|
| `#dashboard` | `src/views/projects.js` → `dashboardView()` | Operational KPIs, bar charts — functional but flat |
| `#projects` | `src/views/projects.js` → `projectsView()` | Gantt timeline — dense, needs density/readability pass |
| `#resource` | `src/views/resource.js` → `resourceOverviewView()` | Resource summary — R2 port, needs visual elevation |
| `#matrix` | `src/views/resource.js` → `matrixView()` | Person×Project grid — needs heatmap polish |
| `#workload` | `src/views/resource.js` → `workloadView()` | Load bars — needs cockpit-grade card layout |
| `#busfactor` | `src/views/resource.js` → `busFactorView()` | BF table + risk cards — needs hierarchy/density fix |
| `#people` | `src/views/resource.js` → `peopleView()` | Person cards — needs grid polish |
| `#upload` | `src/views/admin.js` → `uploadView()` | File upload + history — needs clean form treatment |
| `#settings` | `src/views/admin.js` → `settingsView()` | Settings form — needs layout + section grouping |

## Design language (locked from cockpit)

### Palette — extend existing `:root` vars only
```
--bg: #f7f6f3       --surface: #ffffff      --surface-2: #fbfaf8
--line: #e6e1d9      --line-strong: #d8d2ca  --text: #37352f
--muted: #787774     --primary: #4d646f      --primary-2: #667a83
--green/--yellow/--red + their -bg variants for RAG meaning ONLY
```

### Typography
- Font stack: `Inter, "WenQuanYi Zen Hei", "Microsoft YaHei", Arial, sans-serif`
- Hero numbers: 32-36px, font-weight 700, letter-spacing -1px
- Panel titles: 14px, font-weight 600
- Labels/muted: 11-12px, color var(--muted)
- Tabular numbers: `font-variant-numeric: tabular-nums` on all data

### Layout patterns (from cockpit CSS)
- **Hero strip:** `.hero-strip` grid with `.hero-card` sections
- **Panel row:** `.panel-row` 2-column grid with `.panel` cards
- **KPI blocks:** `.conc-stat` centered stat with label
- **Data tables:** `.risk-table` minimal borders, hover rows
- **Bar visualizations:** `.wave-bars` / `.wave-row` / `.wave-track`
- **Heatmap grids:** `.heatmap-grid` / `.heatmap-cell`
- **Trend stubs:** `.trend-stub` dashed placeholder for deferred data

### Anti-patterns (never do)
- No gradient backgrounds
- No emoji in data cells
- No rounded-corner accent-border cards (AI slop)
- No new color tokens — extend `:root` only
- Color for RAG meaning only, never decoration
- No Inter/Roboto import — use existing font stack

## Execution workflow

```
INPUT: route name(s) to optimize (e.g. "#dashboard #matrix")

PHASE 0 — Audit current view
  1. Read the view function source
  2. Screenshot current state (if chrome-devtools available)
  3. List what's wrong: density, hierarchy, polish gaps
  4. Write optimization spec to .claude/plans/ui-optimize-{route}.spec.md

PHASE 1 — Design mock (Claude Design MCP)
  1. get_claude_design_prompt()
  2. create_project() or reuse existing project
  3. finalize_plan → write_files → render_preview
  4. Share open_url with user
  5. WAIT for user to lock ("lock it" / "proceed" / "yes")

PHASE 2 — Decompose into Codex slices
  Rule: one file or concern per slice. Typical decomposition:
    S1: New/updated selectors if view needs derived data
    S2: View function rewrite (or new view module)
    S3: CSS additions to styles.css
    S4: Route/shell wiring changes (if restructuring)

PHASE 3 — Execute via Codex
  For each slice:
    1. Claude writes self-contained spec with:
       - File path(s) to modify
       - Exact function signatures / HTML structure
       - Which existing patterns to mirror (with line refs)
       - Validation command
    2. Delegate to /codex:rescue
    3. AUDIT Codex output:
       - Read the modified file
       - Verify structure matches locked mock
       - Check no regression to other routes
       - Run app (npm start) if final slice
    4. If audit fails: write fix spec, re-delegate (no manual edit)
    5. Gated commit after audit passes

PHASE 4 — Verify
  1. npm start
  2. Load the optimized route in browser
  3. Verify drill-throughs and interactions work
  4. Check adjacent routes for regression
  5. Final commit
```

## Slice spec template

When delegating to Codex, use this structure:

```markdown
## S{N}: {title}

### Context
{What we're building and why — one paragraph}

### File(s) to modify
{path} — {CREATE | UPDATE | OVERWRITE}

### What to {add | change}
{Exact code or precise instructions with line references}

### Pattern to follow
{Reference to existing code: file:line, function name}

### Rules
- {constraint 1}
- {constraint 2}

### Validation
{bash command that proves correctness}
```

## Cross-route consistency checks

After optimizing any route, verify these invariants:

- [ ] KPI counts on cockpit == counts on dashboard == counts on resource views
- [ ] Drill-through from cockpit risk rows opens correct project drawer
- [ ] Filter bar applies correctly to the optimized view
- [ ] No duplicate CSS class names (grep styles.css)
- [ ] App boots clean with `npm start`
- [ ] Existing `data-open-project` and `data-route` handlers still work

## Codebase reference

| Concern | File | Key exports |
|---|---|---|
| Route registry | `src/config/routes.js` | `routeGroups`, `routes`, `projectFilterRoutes` |
| View dispatch | `src/ui/shell.js:207` | `routeViews` map, `render()` |
| State | `src/state/app-state.js` | `state.route`, `state.filters`, `state.resourceFilters` |
| Selectors | `src/core/selectors.js` | `filteredProjects`, `personStats`, `cockpitMetrics`, `projectRag` |
| Resource views | `src/views/resource.js` | 6 view functions + `busFactorRows`, `keyPeopleRiskRows` |
| Project views | `src/views/projects.js` | `dashboardView`, `projectsView`, `timeline` |
| Admin views | `src/views/admin.js` | `uploadView`, `settingsView` |
| Cockpit (reference) | `src/views/cockpit.js` | `cockpitView` — gold standard for visual quality |
| Styles | `styles.css` | 3055 lines, cockpit classes at end |
| Data spec | `docs/data-sequences.md` | Canonical formulas and thresholds |
