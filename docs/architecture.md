# Code Architecture

## Read Order
- 1. Read docs/architecture.md to locate the active module boundary.
- 2. Open the route module or shared module that owns the requested behavior.
- 3. Only expand to adjacent shared modules when the ownership line crosses modules.

## Module Layout
- Entry: index.html -> app.js -> src/ui/shell.js
- Route config: src/config/routes.js
- State: src/state/app-state.js
- Shared logic: src/core/utils.js, src/core/selectors.js, src/core/files.js
- Route views: src/views/projects.js, src/views/resource.js, src/views/admin.js
- Repo skill: skills/code-architecture-guard/SKILL.md

## Ownership
- Project dashboard and milestone timeline live in src/views/projects.js.
- Resource overview, matrix, workload, bus factor, and people views live in src/views/resource.js.
- Upload, template download, and settings live in src/views/admin.js.
- Filtering, derived datasets, and shared selectors live in src/core/selectors.js.
- DOM and formatting helpers live in src/core/utils.js.

## Update Rule
- If route ownership, shared module boundaries, or entry wiring changes, regenerate this file with node scripts/sync-architecture.mjs.
- The repo pre-commit hook runs the same sync script and stages docs/architecture.md automatically.
