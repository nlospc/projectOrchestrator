---
name: r2-workspace-reader
description: Use when the user says "按 R2 workspace 操作", "按 R2 workspace 对齐", references the R2 Workforce Dashboard prototype, or asks to reproduce/adapt R2 resource, workload, matrix, role, people, or Bus Factor pages in the PMO Orchestrator project. Always read the real R2 prototype page DOM/main or provided pasted main before designing or coding; do not rely only on overview.md.
---

# R2 Workspace Reader

Use this skill before adapting any R2 Workforce Dashboard page into the current PMO Orchestrator project.

## Core Rule

For page alignment, read the actual R2 page structure first:
1. Prefer a user-provided pasted `<main>` or screenshot for the exact target page.
2. If no pasted main exists, inspect the compiled R2 workspace files under `design/R2-Workforce-Dashboard-offline-V14/`.
3. If source code is minified, extract observable DOM/page structure rather than copying implementation.
4. Only after extracting the R2 page modules, translate them into the current PMO Orchestrator Notion-style UI.

## Required Workflow

1. Identify the target R2 route or page:
   - `/` for resource/global dashboard.
   - `/matrix` for person x project assignment matrix.
   - `/workload` for per-person workload analysis.
   - `/roles` for role coverage.
   - `/busfactor` for Bus Factor risk.
   - `/people` and `/people/$name` for people directory/detail.
2. Read the R2 page artifact:
   - Use attached pasted text if present.
   - Otherwise inspect `design/R2-Workforce-Dashboard-offline-V14/index.html` and `assets/app.js` enough to recover page modules.
   - If browser access to `file://` is blocked, use local text extraction or a DOM mock; do not skip page-structure extraction.
3. Produce an alignment inventory before coding:
   - Page title and subtitle.
   - Header actions.
   - KPI cards and exact metric meanings.
   - Alerts or exception lists.
   - Rankings, tables, matrices, charts, and their sort/order behavior.
   - Links/drilldowns and drawer/detail behavior.
   - Formulas, thresholds, and any mismatch with current PMO settings.
4. Compare with the current implementation page:
   - Locate the current route in `app.js`.
   - Render or statically inspect current HTML structure.
   - List missing, extra, and differently-modeled modules.
5. Only then implement:
   - Preserve current PMO Orchestrator Notion style.
   - Reuse R2 data and logic, not the compiled R2 source.
   - Keep changes scoped to the target page unless cross-page shared logic is required.

## Known Failure From Prior Run

The first resource overview adaptation was too shallow because it read only `overview.md`. That caused the implementation to reproduce the data model and load formula, but miss the actual R2 dashboard information architecture:

- Export workload CSV action.
- Five KPI cards: total people, total projects, average load, high load, low load.
- Formula explanation block.
- Collapsible workload calculation configuration.
- Overallocation alert list where summed `timeRatio` exceeds 100%.
- Busy/idle ranking with sort control, full scroll list, load bars, project counts, and overallocation markers.
- Recharts-based distribution charts, including project phase and role composition.

When the user says "按 R2 workspace", first recover this kind of page-level structure, then adapt.

## R2 Resource Dashboard Target Checklist

For the R2 `/` resource/global dashboard, check for these modules:

- Header: `全局看板 Dashboard`, explanatory subtitle, export CSV button.
- KPI strip: total people, project total, average load, high-load count, low-load count.
- Formula/threshold explanation.
- Collapsible load calculation config.
- Overallocation warning: people with total time allocation over 100%, with person links, external/internal label, percent, and project count.
- Busy/idle ranking: sorted people list with load bars, load level badge, project count, and over-allocation badge.
- Charts: stage/status distribution and role composition.

Translate these into Notion-style PMO UI rather than copying Tailwind/Recharts markup directly.
