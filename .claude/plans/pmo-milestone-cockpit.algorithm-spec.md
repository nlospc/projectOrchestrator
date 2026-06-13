# Algorithm Spec: Milestone Segment Engine (Task 1 lock-down)

**Companion to**: `.claude/plans/pmo-milestone-cockpit.plan.md`
**Status**: Design-only — no code yet (per CLAUDE.md "design first")
**Reference today**: `state.today = 2026-06-13`
**Source spec**: `docs/PRD_PMO里程碑管理工作台.md` §4.1.3 + §4.1.4 + §7

This document is the **single source of truth** for `src/core/milestones.js`. T3 will translate this verbatim into a `computeSegments()` function with the JSDoc + fixture block copied from §2 below.

---

## 1. Inputs

```
Milestone (per src/data/mock-data.js extension)
  id                  string
  projectId           string
  name                string
  sortOrder           number
  planned_start_date  "YYYY-MM-DD"   // required
  planned_end_date    "YYYY-MM-DD"   // required
  actual_start_date   "YYYY-MM-DD" | null
  actual_end_date     "YYYY-MM-DD" | null

Project
  id, planned_start_date, planned_end_date, archived: boolean

today: Date (from state.today)
```

Pre-conditions enforced by `mutations.js`, not by `computeSegments`:
- `planned_start_date ≤ planned_end_date` for every milestone
- `actual_start_date ≤ actual_end_date` when both present
- `M_{i-1}.actual_end_date ≤ Mᵢ.actual_end_date` when both present (PRD §4.1.4 row 1)

`computeSegments` may **assume** these invariants. If violated (defensive paranoia), it still produces a segment but tags it `scenario = "INVARIANT_VIOLATED"` for debug — never throws.

---

## 2. JSDoc fixture (T3 will paste this verbatim atop `src/core/milestones.js`)

```js
/**
 * computeSegments — single source of truth for milestone-segment rendering.
 * Pure function: no DOM, no state import, no Date.now().
 *
 * @param {Milestone[]} milestones  ordered by sortOrder; all share projectId
 * @param {Project}     project     host project (used for archived flag only)
 * @param {Date}        today       caller-provided "now" (= state.today)
 * @returns {Segment[]} one entry per milestone, same index order
 *
 * Segment = {
 *   milestoneId:           string,
 *   segStart:              Date,
 *   segEnd:                Date,
 *   hue:                   "green" | "red" | "amber" | "gray",
 *   tone:                  "solid" | "ghost" | "mixed",
 *   plannedAnchorAt:       Date,           // ◇ position
 *   actualAnchorAt:        Date | null,    // ◆ position (null when A absent)
 *   deviationDays:         number,         // semantics differ by scenario, see §4
 *   eroded:                boolean,        // true iff scenario === 5
 *   scenario:              1 | 2 | 3 | 4 | 5,
 *   overdueGrowSplitAt:    Date | null,    // scenario ④ only: where ghost→solid red
 * }
 */
```

---

## 3. seg_start formula (PRD §4.1.3 literal)

```
i = 1:   seg_start(M₁)  = M₁.actual_start_date ?? M₁.planned_start_date
i > 1:   seg_start(Mᵢ)  = M_{i-1}.actual_end_date ?? Mᵢ.planned_start_date
```

> **Locked decision A** — for i > 1 we do **not** fall back to `Mᵢ.actual_start_date`. PRD §4.1.3 omits it from the formula. We treat `actual_start_date` on i > 1 milestones as metadata only (visible in drawer editor, not in Gantt). See "Locked Calls" §6.

---

## 4. seg_end + encoding (5-scenario truth table)

Let `A = Mᵢ.actual_end_date`, `P = Mᵢ.planned_end_date`, `S = seg_start(Mᵢ)`.

**Dispatch order (deterministic)**:

```
if A != null:
    if A <= P: → ①
    else:      → ②
else:                              // A == null
    if S >= P:        → ⑤         // upstream erosion (locked precedence ⑤ > ④)
    elif today > P:   → ④         // overdue, no eroded upstream
    else:             → ③         // on-track future
```

| # | Name | seg_end | hue | tone | plannedAnchorAt | actualAnchorAt | deviationDays | eroded | overdueGrowSplitAt |
|---|---|---|---|---|---|---|---|---|---|
| ① | 按期完成 | A | green | solid | P | A | A - P (≤ 0; days early as negative) | false | null |
| ② | 延期完成 | A | red | solid | P | A | A - P (> 0; days late) | false | null |
| ③ | 未来在轨 | P | green | ghost | P | null | 0 | false | null |
| ④ | 逾期未填 | today | red¹ | mixed² | P | null | today - P (> 0; current overdue) | false | P |
| ⑤ | 工期被侵蚀 | max(S, P) + min visual width³ | amber | ghost | P | null | S - P (≥ 0; erosion magnitude) | true | null |

¹ The renderer paints `[S, P]` as gray ghost and `[P, today]` as solid `#EB5757`. The algorithm reports `hue = "red"` to drive status semantics; the renderer reads `tone = "mixed"` + `overdueGrowSplitAt` to do the two-tone fill.
² `mixed` = leading ghost + trailing solid red. Only scenario ④ uses this tone.
³ "Minimum visual width" = 1 day-equivalent on the time axis. The algorithm reports `segEnd = max(S, P) + 86400000ms`; the renderer enforces a CSS `min-width: 6px` floor independently.

**deviationDays semantics summary** (locked):
- ①: A - P (negative or zero = early/on-time)
- ②: A - P (positive = days late)
- ③: 0 (not applicable)
- ④: today - P (current overdue magnitude, positive)
- ⑤: S - P (erosion magnitude, ≥ 0; how far upstream pushed the start past M's planned end)

---

## 5. PRD §7 acceptance walk-through (hand-computed, `today = 2026-06-13`)

Each row maps a PRD §7 case to specific seed milestones and shows the algorithm's expected output, field-by-field. T3 will keep this table as fixtures.

### Case 1 — Scenario ② (M1 计划 2/15、实际 2/20 完成)

**Seed**: project `P-2401`, milestone `P-2401-M1`
```
planned_start_date = 2026-02-01
planned_end_date   = 2026-02-15
actual_start_date  = 2026-02-01
actual_end_date    = 2026-02-20
```

**Hand walk**:
- A = 2026-02-20, P = 2026-02-15, A > P → **②**
- segStart = M1.actual_start_date = 2026-02-01
- segEnd = A = 2026-02-20
- hue = red, tone = solid
- plannedAnchorAt = 2026-02-15
- actualAnchorAt = 2026-02-20
- deviationDays = +5
- eroded = false, overdueGrowSplitAt = null, scenario = 2

**Side effect on M2**: per PRD §7 case 1 "M2 段起点自动变为 2/20" — seed `P-2401-M2.planned_start_date = 2026-02-15` (irrelevant) and `P-2401-M2` has A absent → its seg_start = `M1.actual_end_date = 2026-02-20`. ✓

PRD says "2/15–2/20 叠加深红斜纹" — this is a **renderer-only flourish** atop scenario ② (highlight the P→A overrun window). Spec exposes `plannedAnchorAt = 2026-02-15` and `actualAnchorAt = 2026-02-20`; renderer paints the diff stripe. No new algorithm field.

---

### Case 2 — Scenario ④ (M2 计划 3/30，今日 4/10，未填实际)

PRD's "今日 4/10" doesn't align with our pinned `today = 2026-06-13`. We preserve the **shape** (today > P, A absent, upstream not eroded) by re-dating: pick a milestone where today=06-13 overshoots P by ~14 days and upstream completed before P.

**Seed**: project `P-2402`, milestone `P-2402-M2`
```
P-2402-M1: planned 2026-01-15..2026-02-15, actual 2026-01-15..2026-02-15 (scenario ①)
P-2402-M2: planned 2026-04-01..2026-05-30, actual_start = 2026-04-05, actual_end = null
```

**Hand walk** (M2):
- A = null
- S = M1.actual_end_date = 2026-02-15 (not null) → S = 2026-02-15
- check ⑤: S ≥ P? 2026-02-15 ≥ 2026-05-30 → false. Not ⑤.
- check ④: today (06-13) > P (05-30) → true. → **④**
- segStart = 2026-02-15
- segEnd = today = 2026-06-13
- hue = red, tone = mixed
- plannedAnchorAt = 2026-05-30
- actualAnchorAt = null
- deviationDays = today - P = 14 days
- eroded = false, overdueGrowSplitAt = 2026-05-30, scenario = 4

Renderer: `[2026-02-15, 2026-05-30]` gray ghost; `[2026-05-30, 2026-06-13]` solid `#EB5757` (growing tail). ✓

---

### Case 3 — Audit modal blocks empty-reason save (NOT an algorithm case)

This is a **mutation-layer** acceptance, not a segment one. It belongs to `src/core/mutations.js` (T4), not `milestones.js`. Documented here for completeness:

```js
updateMilestone("P-2401-M1", { planned_end_date: "2026-04-01" }, "" /* reason */, "PMO Admin")
// → throws Error("planned_end_date 修改必须填写原因")
// → milestoneChangeLogs[] unchanged
// → milestones[] unchanged
```

T1 deliverable for this case is just confirming the spec carve-out: `computeSegments` is read-only and never runs for this scenario.

---

### Case 4 — Scenario ⑤ (上游累计延期使 M3 的 seg_start ≥ M3 计划完成)

**Seed**: project `P-2403`, milestone `P-2403-M3`
```
P-2403-M1: planned 2026-01-01..2026-01-31, actual 2026-01-01..2026-02-15  (②, +15d)
P-2403-M2: planned 2026-02-01..2026-03-15, actual 2026-02-15..2026-04-20  (②, +36d)
P-2403-M3: planned 2026-03-15..2026-04-10, A absent
```

**Hand walk** (M3):
- A = null
- S = M2.actual_end_date = 2026-04-20
- check ⑤: S (2026-04-20) ≥ P (2026-04-10) → true. → **⑤**
  (Locked precedence: ⑤ > ④, even though today=06-13 > P also satisfies ④. See §6 Locked Calls.)
- segStart = 2026-04-20
- segEnd = max(S, P) + 1 day = 2026-04-21 (renderer enforces min-width visually)
- hue = amber, tone = ghost
- plannedAnchorAt = 2026-04-10 (空心 ◇，标注 "起点已越过")
- actualAnchorAt = null
- deviationDays = S - P = 10 (erosion magnitude in days)
- eroded = true, overdueGrowSplitAt = null, scenario = 5

Status badge in drawer: "工期被侵蚀"; tooltip: "上游延期已完全侵蚀本段工期，需重排计划". ✓

---

### Case 5 — Re-render performance (NOT an algorithm case)

PRD §7 case 5 ("插入/拖拽里程碑后，甘特视图 1 秒内完成重算重绘") is a **render-pipeline** acceptance:

1. Drag handle → `reorderMilestones(projectId, newOrder)` (T4)
2. Mutation validates lex-order; throws → drag rolls back (Locked Call D, see §6)
3. On success: triggers `render()` in `shell.js`
4. `render()` calls `timeline(filteredProjects())` → for each project, `computeSegments(...)` runs (O(n) per project)
5. DOM `innerHTML` replaced

Expected magnitude: 6 seed projects × ≤ 8 milestones = 48 `computeSegments` calls per repaint; each call is < 1ms of arithmetic. Repaint well under 100ms; PRD's 1s budget has 10× headroom. T6 confirms via DevTools profile during T10 acceptance.

T1 deliverable for this case: confirm `computeSegments` is sufficiently cheap to be called eagerly on every render (no memoization needed in v1.0). Add `// TODO(perf): memoize per-project segments keyed on milestones revision when projectCount > 50` to the JSDoc header in T3.

---

### Sanity case — Scenario ① + Scenario ③ in one project

Not a PRD §7 case, but needed to exercise the "happy path" segments. Used for visual regression.

**Seed**: project `P-2404`
```
P-2404-M1: planned 2026-01-01..2026-02-15, actual 2026-01-01..2026-02-10  (①, -5d)
P-2404-M2: planned 2026-02-15..2026-04-15, actual 2026-02-10..2026-04-12  (①, -3d)
P-2404-M3: planned 2026-04-15..2026-07-30, actual_start = 2026-04-12, actual_end = null  (③)
```

**Hand walk M1** (Scenario ①):
- A = 2026-02-10, P = 2026-02-15, A ≤ P → **①**
- segStart = M1.actual_start_date = 2026-01-01
- segEnd = 2026-02-10
- hue = green, tone = solid
- plannedAnchorAt = 2026-02-15
- actualAnchorAt = 2026-02-10
- deviationDays = -5, eroded = false, scenario = 1 ✓

**Hand walk M3** (Scenario ③):
- A = null
- S = M2.actual_end_date = 2026-04-12
- check ⑤: S (04-12) ≥ P (07-30) → false. Not ⑤.
- check ④: today (06-13) > P (07-30) → false. Not ④.
- → **③**
- segStart = 2026-04-12
- segEnd = P = 2026-07-30
- hue = green, tone = ghost
- plannedAnchorAt = 2026-07-30 (空心 ◇)
- actualAnchorAt = null
- deviationDays = 0, eroded = false, scenario = 3 ✓

Note: `actual_start_date = 2026-04-12` on M3 is **not used** by the algorithm (Locked Decision A). It surfaces in the drawer editor only.

---

## 6. Locked Calls (ambiguities resolved — please challenge if wrong)

| ID | Question raised by PRD ambiguity | Decision locked here | Reversible? |
|---|---|---|---|
| **A** | For i > 1, does seg_start fall back to `Mᵢ.actual_start_date` before `Mᵢ.planned_start_date`? | **No.** Strict 2-level fallback `M_{i-1}.actual_end_date ?? Mᵢ.planned_start_date` per PRD §4.1.3 literal. `actual_start_date` on i > 1 is metadata only. | Yes, by adding one `??` clause in §3 |
| **B** | When ④ and ⑤ conditions both hold (A absent, S ≥ P, today > P), which scenario wins? | **⑤ wins.** The "upstream erosion" narrative is more specific and more actionable for PMO than the generic "逾期未填". | Yes, by reordering the dispatch in §4 |
| **C** | `deviationDays` units and sign convention vary by scenario — is one global definition possible? | **No.** Locked per-scenario semantics (see §4 table). Single label "偏差天数 N" in drawer is rendered by a small adapter that picks wording: "早 5 天 / 晚 5 天 / 当前逾期 14 天 / 侵蚀 10 天". | Yes, but coordinated with badge copy |
| **D** | Should drag-reorder validation block the drop or accept-then-toast-rollback? | **Block the drop** (Open Question Q1 in plan; same decision). Mutation throws → drag handler reverts DOM position before render. | Yes — UX preference |
| **E** | When upstream `M_{i-1}.actual_end_date` exists but is **before** `M_{i-1}.actual_start_date` or is in the future, does `computeSegments` crash? | **No.** Pre-conditions are mutation's job. `computeSegments` proceeds with whatever it's given and tags `scenario = "INVARIANT_VIOLATED"` for debug. | Yes |
| **F** | Should `computeSegments` use `today.getTime() > P.getTime()` (strict) or `>=` for the ④ check? | **Strict `>`.** "今日 = P" means today IS the planned day; that's still "未到期 (③)" until midnight rolls over. | Yes, but explain to PMO |

---

## 7. Hand-off checklist before T2

- [x] All 5 PRD §7 cases mapped to seed milestones and field-by-field hand-walked
- [x] `today = 2026-06-13` produces at least one occurrence of each scenario ①②③④⑤
- [x] Dispatch order written deterministically (no ambiguity in §4)
- [x] Locked Calls A–F captured for review
- [ ] **User confirms Locked Calls A, B, C, D, E, F** (or proposes changes)
- [ ] **User confirms the 4 reshaped seed projects (P-2401..P-2404) are an OK basis** for T2 (the original 6 seed projects had `P-2405` archived + `P-2406` 合规项目; both retained but their milestone shapes will be redesigned similarly in T2 to add demo diversity — not specced here yet to keep T1 focused)

---

## 8. What this document does NOT cover

- Renderer details (CSS classes, stripe patterns, anchor SVG glyphs) — that's T6
- Project-level RAG aggregation (`projectRag`) — that's T5
- Project-row "overflow stripe" (`projectOverflowSegment`) — that's T5, uses `computeSegments` output
- Mutation API (`updateMilestone` etc.) — that's T4
- Status-badge copy adaptation per scenario — T7 (drawer)

The boundary is intentional: `milestones.js` produces a typed segment array. Every other concern reads it.

---

**Ready for T2?** Confirm Locked Calls A–F. If any are wrong, name the ID and propose the alternative — I'll patch this spec and re-walk affected cases before touching the seed.
