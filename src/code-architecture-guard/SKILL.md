---
name: code-architecture-guard
description: Use when optimizing, debugging, or refactoring PMO Orchestrator code. Read docs/architecture.md first, then inspect only the owning route/shared modules. If structure changes, refresh the architecture doc.
triggers:
  - "optimize code"
  - "debug code"
  - "refactor code"
  - "????"
  - "????"
  - "????"
  - "????"
---

# Code Architecture Guard

## Required flow

1. Read `docs/architecture.md` first.
2. Identify the owning route or shared module before reading implementation files.
3. Read only the relevant files first:
   - Project dashboard / milestones: `src/views/projects.js`
   - Resource views: `src/views/resource.js`
   - Upload / settings: `src/views/admin.js`
   - Shared selectors: `src/core/selectors.js`
   - Shared DOM / formatting helpers: `src/core/utils.js`
4. Expand outward only when ownership crosses modules.

## Update rule

If you change route boundaries, move shared logic, rename modules, or change entry wiring:

- Run `node scripts/sync-architecture.mjs`
- Confirm `docs/architecture.md` matches the new structure

## Scope discipline

- Do not read the whole app by default.
- Start from the owning module and its direct shared dependencies.
- Treat `docs/architecture.md` as the current map of ownership.
