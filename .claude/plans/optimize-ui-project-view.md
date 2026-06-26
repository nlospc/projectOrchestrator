 Implementation Plan: Optimize #projects UI

  Requirements Restatement

  Upgrade the #projects Gantt milestone view from a
  functional-but-flat data grid to an executive-grade
  view matching the cockpit design language. The
  target audience is VP/COO/BU-head — they need to
  glance at project health before drilling into
  timeline detail.

  Current State

  - projectsView() in src/views/projects.js:182-229 —
  renders a header, toolbar, and timeline() Gantt
  - timeline() at line 231 — 2-column grid: frozen
  project list (360px) + scrollable Gantt with month
  columns
  - CSS — ~180 lines of project/Gantt styling (lines
  355–1050 in styles.css), functional but
  inconsistent with cockpit palette
  - No summary strip — executive lands directly on
  dense Gantt rows with no context

  Key Improvements

  Area: Summary strip
  What changes: Add a hero-style KPI strip above the
    Gantt: total projects, R/Y/G counts, slipping
    milestones, max deviation
  Why: VP needs a 2-second health read before
  engaging
    the Gantt
  ────────────────────────────────────────
  Area: Toolbar polish
  What changes: Match cockpit design language — muted

    labels, consistent borders, refined group
  dropdown
  Why: Visual consistency with #dashboard and
  #cockpit
  ────────────────────────────────────────
  Area: Project list column
  What changes: Add dept/biz subtitle, show deviation

    badge for R/Y projects, tighten row density to
    56px
  Why: More info at a glance; reduce row height waste
  ────────────────────────────────────────
  Area: Gantt polish
  What changes: Better segment hover, cleaner month
    header, refined today line, legend strip
  Why: Readability at executive-scale zoom levels
  ────────────────────────────────────────
  Area: Group headers
  What changes: Styled closer to cockpit panel
    headers, add R/Y/G mini-counts
  Why: Context without expanding groups

  Patterns to Mirror

  ┌────────┬─────────────────────┬───────────────┐
  │ Catego │       Source        │    Pattern    │
  │   ry   │                     │               │
  ├────────┼─────────────────────┼───────────────┤
  │        │                     │ .hero-strip   │
  │ Hero   │ src/views/cockpit.j │ grid with     │
  │ strip  │ s:13-47             │ .hero-card    │
  │        │                     │ children      │
  ├────────┼─────────────────────┼───────────────┤
  │ Panel  │ src/views/cockpit.j │ .panel.cockpi │
  │ stylin │ s:50-93             │ t-panel with  │
  │ g      │                     │ .panel-header │
  ├────────┼─────────────────────┼───────────────┤
  │ KPI    │                     │ 32-36px       │
  │ typogr │ styles.css cockpit  │ values, 14px  │
  │ aphy   │ section             │ labels,       │
  │        │                     │ tabular-nums  │
  ├────────┼─────────────────────┼───────────────┤
  │        │                     │ .rag-lamp     │
  │ RAG    │ src/views/projects. │ class for     │
  │ dots   │ js:374              │ status        │
  │        │                     │ indicator     │
  ├────────┼─────────────────────┼───────────────┤
  │        │                     │ Existing .gan │
  │ Toolba │ src/views/projects. │ tt-toolbar    │
  │ r      │ js:200-226          │ (refine, not  │
  │        │                     │ replace)      │
  └────────┴─────────────────────┴───────────────┘

  Files to Change

  File: src/views/projects.js
  Action: UPDATE
  Why: Add summary strip to projectsView(), refine
    projectListRow() with dept + deviation info
  ────────────────────────────────────────
  File: src/core/selectors.js
  Action: UPDATE
  Why: Add projectsViewMetrics() selector for the
    summary strip KPIs
  ────────────────────────────────────────
  File: styles.css
  Action: UPDATE
  Why: Add .projects-hero-strip, refine
    .project-list-row, .gantt-toolbar, add
  .seg-legend

  Implementation Phases

  Phase 1: Selector — projectsViewMetrics()

  - Action: Add a lightweight selector in
  selectors.js that returns: { total, red, yellow,
  green, slippingCount, maxDeviation, milestoneCount
  } from filteredProjects()
  - Mirror: cockpitMetrics() at selectors.js:179
  (same RAG counting pattern)
  - Validate: Import succeeds, returns correct counts

  Phase 2: Summary strip in projectsView()

  - Action: Add a .projects-hero-strip above the
  panel, showing RAG mini-donut + counts + slipping
  milestones + max deviation
  - Mirror: dashboardView() headline strip at
  projects.js:22-37 (lighter than cockpit hero,
  contextual to Gantt)
  - Rules: Clickable RAG items should set
  state.filters.health (existing
  data-action="health-filter" pattern); strip must
  not push the Gantt off-screen
  - Validate: Renders, data matches cockpit counts

  Phase 3: Project list row refinement

  - Action: Add dept/biz line, show deviation badge
  for R/Y rows, reduce row height from 76px to 60px,
  tighten spacing
  - Mirror: projectListRow() at projects.js:367,
  .project-list-row CSS at styles.css:821
  - Rules: Must not break data-open-project click
  handler; must keep sticky left behavior

  Phase 4: Toolbar + Gantt visual polish

  - Action: Refine toolbar colors/spacing to match
  cockpit palette; add segment legend strip below
  toolbar; polish today line; improve segment hover
  - Mirror: .gantt-toolbar at styles.css:378, cockpit
  palette vars
  - Rules: No new color tokens; use :root vars only;
  .granularity-chip.active should use --primary not
  --brand

  Phase 5: Group header enhancement

  - Action: Add mini R/Y/G dot counts to group header
  rows
  - Mirror: groupRow() at projects.js:357; already
  shows redCount
  - Validate: Groups display with correct counts

  Risks

  Risk: Summary strip pushes Gantt below fold on
  small
    screens
  Likelihood: Medium
  Mitigation: Use compact 48px strip, verify at 768px

    viewport
  ────────────────────────────────────────
  Risk: Row height change misaligns with Gantt row
    height
  Likelihood: Medium
  Mitigation: CSS height must be set on both
    .project-list-row and .gantt-project-row
  ────────────────────────────────────────
  Risk: New selector duplicates cockpitMetrics logic
  Likelihood: Low
  Mitigation: Reuse projectRag() and
    filteredProjects() directly, keep it lean

  Estimated Complexity: Medium

  - Selector: 30min
  - Summary strip (JS + CSS): 1hr
  - List row refinement (JS + CSS): 1hr
  - Toolbar/Gantt polish (CSS): 1hr
  - Group headers: 30min
  - Total: ~4 hours
