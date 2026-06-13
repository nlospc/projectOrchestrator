---
name: r2-main-migration
description: Use when migrating an R2 workspace main page into PMO Orchestrator, especially resource overview/dashboard pages. Requires extracting the R2 main DOM first, then preserving its information architecture while translating visuals into the current Notion-style app.
---

# R2 Main Migration

Use this skill after `r2-workspace-reader` has identified the target R2 page modules.

## Problem Summary

The first R2 resource overview migration was inaccurate because it reused R2 data and formulas but did not preserve the real R2 `<main>` information architecture. The missing parts were not implementation details; they were product surface requirements:

- Page-local dashboard title, subtitle, and export action.
- Five KPI cards: total people, total projects, average load, high load, low load.
- Formula and threshold explanation.
- Collapsible workload calculation configuration.
- Overallocation warning list where summed `timeRatio` exceeds 100%.
- Busy/idle ranking with full people list, bars, levels, project counts, and over-allocation marks.
- Role x project-stage participation matrix as the benchmark source for workload weighting.
- Chart panels for category/status/role distribution.
- Table-form detail view for auditability.

## Migration Rule

Translate R2 structure, not R2 code.

- Keep PMO Orchestrator's Notion-style shell, colors, cards, tables, and spacing.
- Recreate R2's page modules and calculations in current app code.
- Do not copy Tailwind/Recharts/Radix markup from the compiled R2 bundle.
- If R2 uses a chart, provide a chart-like PMO equivalent, usually lightweight SVG or structured bars.
- If R2 uses ranking cards, also provide a table when PMO users need auditability.

## Resource Overview Target

For PMO `#resource`, preserve this order:

1. Page-local header:
   - `全局看板 Dashboard`
   - Subtitle about identifying overload and schedulable resources.
   - `导出负荷 CSV`.
2. Resource filters:
   - System.
   - Role.
   - Internal/external.
   - Keep global filters if the shell already has them, but do not make filters the first resource content block.
3. KPI strip:
   - Total people.
   - Total projects.
   - Average workload.
   - High-load people.
   - Low-load people.
4. Formula explanation:
   - `load = timeRatio * sqrt(complexity / 5) * roleStatusWeight`.
   - Low/mid/high thresholds.
   - Overallocation definition: `sum(timeRatio) > 100%`.
5. Workload calculation config:
   - Collapsible or compact block.
   - Show thresholds and risk settings.
6. Overallocation warning:
   - List every person whose total time ratio is over 100%.
   - Show person, internal/external label, total ratio, and project count.
7. Busy/idle ranking:
   - Full ranked list, not only Top 10.
   - Include load bar, load value, load level, project count, and over-allocation mark.
   - Do not hide columns at responsive breakpoints; use horizontal scroll or a table-like grid instead.
8. Role x stage benchmark:
   - Show `roleWeights` as a role-by-project-stage participation matrix.
   - Use low/mid/high visual encoding.
   - Treat this as the visible benchmark behind workload calculations.
9. Charts:
   - Category project distribution.
   - Project status distribution.
   - Role composition by people count.
   - Use PMO-native SVG/bars if no chart library exists.
10. Tables:
   - Include workload detail table for auditability.
   - Include role coverage table when role capacity is part of the page.

## Validation Checklist

Before finalizing:

- `node --check app.js` passes.
- Render `#resource` with a local DOM mock if browser `file://` access is blocked.
- Confirm resource content starts with the page-local header, not filters.
- Confirm the page has both chart elements and table elements.
- Confirm the role x project-stage participation benchmark matrix is visible.
- Confirm busy/idle ranking keeps load level and project count visible on narrow layouts.
- Confirm current R2 data generates overallocation and busy ranking rows.
- Confirm CSV export writes current-filter workload rows.
