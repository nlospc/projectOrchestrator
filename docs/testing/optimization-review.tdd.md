# Optimization Review — TDD Evidence Report

**Date:** 2026-07-02
**Scope:** Execute the logic/function review delivered earlier in this session (no new features — correctness fixes, a performance refactor, and security hardening on *existing* code) via strict RED→GREEN→(refactor) TDD, one Git checkpoint per stage.
**Source plan:** No `*.plan.md` file — the plan was the recommendation document delivered inline in this conversation (Phase 1 correctness → Phase 2 performance → Phase 3 consistency), itself derived from reading `src/core/selectors.js`, `src/core/milestones.js`, `src/core/mutations.js`, `src/core/data-store.js`, `src/ui/shell.js`, `src/views/*.js`, `src/core/importers.js`, and the `server/` layer.
**User-confirmed decisions locked in before implementation:**
- **D-1**: `projectRag()` is the single health source for both filtering and display; manual `override` wins (archived still wins over override).
- **D-2**: 交付波次 (delivery-wave) windows use `0 ≤ days ≤ N`; already-overdue unfinished milestones are excluded (they surface via 立即行动/slipping metrics instead).

Every commit below follows the compact TDD checkpoint pattern (failing test → GREEN fix → optional refactor, each its own commit) on `main`. No hooks were bypassed; no destructive git operations were used.

---

## Test harness

This project had zero test infrastructure before this session (`package.json` had only `start`/`dev` scripts). Added:
- `node --test tests/` as the `test` npm script (Node 20.20.2's built-in runner — no new dependency).
- `tests/helpers/browser-shim.js` — a minimal `window`/`document` stub, required because `src/state/app-state.js` reads `window.location.hash`/`.search` at module top-level, and this codebase is browser-only with no prior Node-import path.

## User journeys / guarantees covered

Each corresponds to a backlog item from the recommendation (R = correctness fix, P = performance, C = consistency):

1. As a PMO viewer, 交付波次 counts (≤30/60/90 天) must not include milestones that are already overdue (D-2).
2. As a resource planner, selecting a system in 资源筛选 must auto-fill the matching product family, and vice versa (R4).
3. As a PMO admin, changing 红灯阈值/负荷阈值/Bus Factor 阈值 in 设置 must actually change RAG/load/BF classification everywhere it's displayed (R3).
4. As a PMO admin, setting a manual health override must win over computed RAG in both filters and display, everywhere (R1/D-1, the largest and riskiest item).
5. As a PMO user, the 人员索引 sort chips (负荷/工时占比/项目数/姓名) must actually reorder the grid, including while searching (R5).
6. As a PMO admin, editing an earlier milestone's actual completion date past a later milestone's must be rejected, not just the reverse (R6).
7. As a developer, `groupProjects()`'s default sort must not recompute `projectRag()`/`computeSegments()` inside the sort comparator — O(n log n) → O(n) (P1).
8. As a developer, redundant re-computation in resource views (duplicate `personStats()` calls, `.find()` inside loops, per-cell allocation re-scans) should be eliminated without changing output (P2).
9. As a PMO user, typing in the project/people search boxes should not re-render on every keystroke (P3).
10. As a security reviewer, no imported (Excel/CSV) person/role/project name should be able to break HTML markup or inject script when rendered (C2).

---

## Task report

| Item | Summary | Validation command | Result |
|---|---|---|---|
| Harness | Added `node --test`, browser shim | `npm test` | 0 tests, exit 0 |
| R2 | Wave windows `0≤days≤N` | `npm test` | RED→GREEN, 3 tests |
| R4 | Resource-filter cascade `project_key`→`projectId` | `npm test` | RED (compile)→GREEN, 3 tests |
| R7 | Removed duplicate route-validation block | `npm test` + `node --check` | no behavior change, suite stayed green |
| R3 (3 parts) | Settings→deviationDays / loadThresholds / bfRisk+bfTarget wiring | `npm test` | 3× RED→GREEN, 6 tests total |
| R1/D-1 | `projectRag()` override precedence + `filteredProjects`/`resourceProjects` use computed RAG | `npm test` | 2× RED→GREEN, 5 tests |
| P1 | `groupProjects()` O(n log n)→O(n); extracted `ragFromSegments()` | `npm test` (characterization tests written first, stayed green through refactor) | 2 characterization tests, 0 regressions across full 19-test suite at that point |
| R5 | `sortedPeople()` + wired into shell.js/peopleView | `npm test` | RED (compile)→GREEN, 5 tests |
| R6 | Bidirectional `actual_end_date` validation (client + server mirror) | `npm test` for client; `node --check` + module-load smoke test for server (see Known Gaps) | RED→GREEN, 2 tests (client only) |
| P2 | Dedupe + Map-index resource view lookups; `matrixCell` pre-filtered index; `busFactorRows` investigated and scoped out | `npm test` | 1 RED→GREEN (matrixCell), rest verified via existing/characterization tests + `node --check` |
| P3 | `debounce()` utility, wired into search inputs | `npm test` | RED (compile)→GREEN, 2 tests |
| C1 | Investigated merging the two `roleCategory` implementations | manual analysis | **Declined** — `"UI/UX"` classifies differently under each (产品 vs `other`), proving they're not safely mergeable without behavior change |
| C2 | `escapeHtml()` sweep across 4 tested + 3 untested (DOM/large-template) render sites | `npm test` for the 4 tested sites; `node --check` + review for the rest | RED→GREEN, 4 tests + 3 additional sites fixed |
| C3 | Dead-code sweep for orphans created by this session's own changes | grep + manual review | `effectiveHealth()`, `state.settings` removed (orphaned by R1/R3); confirmed `parseDate` unused import in `selectors.js` **predates this session** (present in `480e65f`) — left untouched per "don't touch pre-existing dead code" |

Full commit list (chronological, `480e65f..HEAD`, 34 commits): test harness setup → R2 → R4 → R7 → R3×3 → R1×3 (incl. dead-code cleanup) → P1×3 → R6×2 (client+server) → R5×3 → P2×4 → P3×3 → C2×2. Each `test:` commit is a RED checkpoint (or characterization-GREEN for refactors); each `fix:`/`perf:`/`refactor:` commit is the corresponding GREEN/refactor checkpoint.

---

## Test specification

| # | What is guaranteed | Test file | Type | Result |
|---|---|---|---|---|
| 1 | Wave buckets exclude already-overdue unfinished milestones (D-2) | `tests/selectors.wave.test.js` | unit | PASS |
| 2 | Wave buckets are inclusive at the exact boundary and at day 0 | `tests/selectors.wave.test.js` | unit | PASS |
| 3 | Resource-filter system→family cascade uses `projectId`, not the nonexistent `project_key` | `tests/resource-filters.cascade.test.js` | unit | PASS |
| 4 | `projectRag`'s red threshold reads `appSettings.payload.healthRules.deviationDays` | `tests/selectors.settings.test.js` | unit | PASS |
| 5 | `loadLevel`/`cockpitMetrics` workforce buckets/`peopleView` labels honor configured `loadThresholds` | `tests/load-thresholds.test.js` | unit | PASS |
| 6 | `busFactorRows` risk tier honors configured `bfRisk`/`bfTarget`, defaults unchanged | `tests/bus-factor-thresholds.test.js` | unit | PASS |
| 7 | `projectRag` returns manual override (no milestones, or would-be-green milestones); archived still wins | `tests/selectors.health-canon.test.js` | unit | PASS |
| 8 | `filteredProjects`/`resourceProjects` use computed RAG, not the stale static `health` field | `tests/selectors.health-canon.test.js` | unit | PASS |
| 9 | `groupProjects()` default/name sort produce correct output (characterization, pre- and post-refactor) | `tests/projects.groupProjects.test.js` | unit | PASS |
| 10 | `updateMilestone` rejects an `actual_end_date` later than the NEXT milestone's | `tests/mutations.date-validation.test.js` | unit | PASS |
| 11 | `sortedPeople()` sorts correctly by each key and does not mutate input | `tests/resource.sortedPeople.test.js` | unit | PASS |
| 12 | `matrixCell` accepts and correctly uses a pre-filtered `items` array | `tests/resource.matrixCell.test.js` | unit | PASS |
| 13 | `busFactorRows` isolation + documented name-collision double-count quirk (regression lock, not a fix) | `tests/selectors.busFactorRows-perf-safety.test.js` | unit | PASS |
| 14 | `debounce()` coalesces rapid calls and re-fires after settling | `tests/utils.debounce.test.js` | unit | PASS |
| 15 | Imported person/role names are escaped in `workloadSummaryTable`/`busyRankingRow`/`horizontalRiskBars`/`matrixCell` (stored-XSS) | `tests/resource.escapeHtml-sweep.test.js` | unit (security) | PASS |

All 38 tests pass as of the final commit (`19b221e`). Command: `npm test`.

---

## Coverage and known gaps

`node --test --experimental-test-coverage tests/` overall: **51.5% line / 70.9% branch / 60.8% function**, well under the skill's 80% target — but that target assumes building a full suite for the app, which was **not** this session's task. This was a targeted bug-fix/optimization pass against a specific, pre-approved backlog; coverage is concentrated exactly where the backlog touched:

- `src/core/selectors.js`: 80.3% line (the RAG/wave/threshold/health-canon logic this session rewrote)
- `src/core/resource-filters.js`: 100% (new file, fully tested)
- `src/core/milestones.js`: 94.7% (untouched this session, incidentally exercised by fixture tests)
- `src/core/mutations.js`: 57.5% — the untested lines are the network/rollback branches (`apiPatchMilestone` success/failure paths), out of reach without a fetch mock
- `src/views/*.js`, `src/ui/shell.js`: low line coverage overall (15–25%) because most of their code is DOM string-template rendering or event-wiring exercised only manually/by review in this session (see below), not because the *changes made* are untested — every pure/testable function this session added or modified (`sortedPeople`, `matrixCell`, `ragFromSegments`, `groupProjects`, the escaped render functions) has a dedicated test.

**Explicit gaps, not silently skipped:**
1. **Server-side `server/repositories/milestones.js` R6 mirror** — `getDb()` connects to the real `data/pmo.sqlite` file with no injectable/in-memory DB seam anywhere in this codebase. Adding one was out of scope (would have expanded the fix into a DB-layer refactor). Verified only via `node --check` and a module-load smoke test, plus manual symmetry review against the tested client-side logic. **Recommend**: add an in-memory DB seam (e.g. `getDb(path)` with a test override) before writing further server-repository logic.
2. **R4/R5 shell.js wiring** — the actual DOM event-handler code in `src/ui/shell.js` (click/input listeners) is not unit-tested; this codebase has no jsdom or browser test runner. The *decision logic* each handler delegates to (`applyResourceFilterCascade`, `sortedPeople`) is fully unit-tested; the wiring itself was verified by `node --check` (syntax) and manual code review only. **Recommend**: introduce Playwright or jsdom if UI-wiring regressions become a recurring problem.
3. **C1 (roleCategory merge)** — investigated, not implemented. `src/core/selectors.js`'s `ROLE_TO_CATEGORY` (exact-match, 3-bucket) and `src/views/resource.js`'s `ROLE_CATS` (substring-match, 5-category) classify at least one real role (`"UI/UX"`) differently. A forced merge would have changed observable behavior for an item outside the approved backlog; declined and documented instead of forced through.
4. **P2 `busFactorRows()` optimization** — investigated, not implemented. Discovered a pre-existing quirk (unlinked resource rows sharing a display name double-count each other's contributors) that a correct O(P+A) rewrite would need to faithfully reproduce. Given this app's realistic dataset size (dozens of projects, hundreds of allocations), the risk of the rewrite outweighed the benefit; left as-is with a regression-lock test (`tests/selectors.busFactorRows-perf-safety.test.js`) documenting the quirk so a future "fix" doesn't silently change behavior.
5. **`projects.js`'s `projectRows()`** — noted during R1 as pre-existing dead code (exported, never imported/called by any route). Left untouched per "don't remove pre-existing dead code unless asked"; still uses the static `project.health` field directly rather than computed RAG, but since nothing calls it, it's inert.
6. **`parseDate` unused import in `selectors.js`** — confirmed via `git show 480e65f` to predate this session. Left untouched, noted here rather than silently dropped.

## Merge evidence

All 34 implementation commits are on `main` (this repo's normal working branch — no feature-branch convention in use per prior commit history) and were not squashed. If a future maintainer squashes them, this document is the durable record of what was RED, what made it GREEN, and what was deliberately scoped out and why.
