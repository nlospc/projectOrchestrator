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
 *   deviationDays:         number,         // semantics differ by scenario — see table below
 *   eroded:                boolean,        // true iff scenario === 5
 *   scenario:              1 | 2 | 3 | 4 | 5 | "INVARIANT_VIOLATED",
 *   overdueGrowSplitAt:    Date | null,    // scenario 4 only: ghost→solid-red boundary
 * }
 *
 * deviationDays per scenario (Locked Call C — no single definition):
 *   1: A - P in days (≤ 0; negative = completed early)
 *   2: A - P in days (> 0; positive = days late)
 *   3: 0
 *   4: today - P in days (> 0; current overdue magnitude)
 *   5: segStart - P in days (≥ 0; erosion magnitude from upstream delay)
 *
 * seg_start formula (Locked Call A, revised 2026-06-14):
 *   i = 0:   M.actual_start_date ?? M.planned_start_date
 *   i > 0:   M.actual_start_date ?? prev.actual_end_date ?? M.planned_start_date
 *
 * Dispatch order (Locked Call B — ⑤ precedes ④):
 *   if A != null:
 *     A <= P  → ①  按期完成
 *     A >  P  → ②  延期完成
 *   else:
 *     segStart >= P      → ⑤  工期被侵蚀
 *     today    >  P      → ④  逾期未填  (strict >, Locked Call F)
 *     else               → ③  未来在轨
 *
 * // TODO(perf): memoize per-project segments keyed on milestones array revision when projectCount > 50
 */

const MS_PER_DAY = 86_400_000;

/** Parse "YYYY-MM-DD" as UTC midnight. ECMA-262 §20.4.1.15 specifies date-only
 *  ISO strings as UTC, so `new Date("2026-02-20")` === 2026-02-20T00:00:00Z. */
function pd(dateStr) {
  return new Date(dateStr);
}

/** Difference in whole days: (a - b), positive when a is later. */
function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/**
 * @param {import('../data/mock-data.js').Milestone[]} milestones
 * @param {import('../data/mock-data.js').Project}    project
 * @param {Date}                                       today
 * @returns {Segment[]}
 */
export function computeSegments(milestones, project, today) {
  if (!milestones || milestones.length === 0) return [];

  return milestones.map((m, i) => {
    const P = pd(m.planned_end_date);
    const A = m.actual_end_date ? pd(m.actual_end_date) : null;
    const prev = i > 0 ? milestones[i - 1] : null;
    const upstreamFinishedLate = Boolean(
      prev?.actual_end_date &&
      prev?.planned_end_date &&
      pd(prev.actual_end_date).getTime() > pd(prev.planned_end_date).getTime()
    );

    // seg_start — Locked Call A
    let segStart;
    if (i === 0) {
      segStart = m.actual_start_date ? pd(m.actual_start_date) : pd(m.planned_start_date);
    } else {
      if (m.actual_start_date) {
        segStart = pd(m.actual_start_date);
      } else if (prev.actual_end_date) {
        segStart = pd(prev.actual_end_date);
      } else {
        segStart = pd(m.planned_start_date);
      }
    }

    // Defensive invariant check (Locked Call E — tag, never throw)
    const plannedStart = pd(m.planned_start_date);
    if (P.getTime() < plannedStart.getTime()) {
      return {
        milestoneId: m.id, segStart, segEnd: P,
        hue: "gray", tone: "ghost",
        plannedAnchorAt: P, actualAnchorAt: A,
        deviationDays: 0, eroded: false,
        scenario: "INVARIANT_VIOLATED", overdueGrowSplitAt: null,
      };
    }

    // Scenario dispatch — Locked Calls B, F
    let scenario, segEnd, hue, tone, deviationDays, eroded, overdueGrowSplitAt;

    if (A !== null) {
      if (A.getTime() <= P.getTime()) {
        // ① 按期完成
        scenario = 1;
        segEnd = A;
        hue = "green";
        tone = "solid";
        deviationDays = diffDays(A, P); // ≤ 0
        eroded = false;
        overdueGrowSplitAt = null;
      } else {
        // ② 延期完成
        scenario = 2;
        segEnd = A;
        hue = "red";
        tone = "solid";
        deviationDays = diffDays(A, P); // > 0
        eroded = false;
        overdueGrowSplitAt = null;
      }
    } else if (segStart.getTime() >= P.getTime()) {
      // ⑤ 工期被侵蚀 — Locked Call B: ⑤ precedes ④
      scenario = 5;
      segEnd = new Date(Math.max(segStart.getTime(), P.getTime()) + MS_PER_DAY);
      hue = "amber";
      tone = "ghost";
      deviationDays = diffDays(segStart, P); // ≥ 0; erosion magnitude
      eroded = true;
      overdueGrowSplitAt = null;
    } else if (today.getTime() > P.getTime()) {
      // ④ 逾期未填 — strict >, Locked Call F
      scenario = 4;
      segEnd = today;
      hue = "red";
      tone = "ghost";
      deviationDays = diffDays(today, P); // > 0
      eroded = false;
      overdueGrowSplitAt = null;
    } else {
      // ③ 未来在轨
      scenario = 3;
      segEnd = P;
      hue = upstreamFinishedLate ? "amber" : "green";
      tone = "ghost";
      deviationDays = 0;
      eroded = false;
      overdueGrowSplitAt = null;
    }

    return {
      milestoneId: m.id,
      segStart,
      segEnd,
      hue,
      tone,
      plannedAnchorAt: P,
      actualAnchorAt: A,
      deviationDays,
      eroded,
      scenario,
      overdueGrowSplitAt,
    };
  });
}
