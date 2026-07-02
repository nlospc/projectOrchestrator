import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, milestones } from "../src/core/data-store.js";
import { cockpitMetrics, projectsViewMetrics } from "../src/core/selectors.js";
import { state } from "../src/state/app-state.js";

// Decision D-2: 交付波次 windows must be 0 <= days <= N. An already-overdue,
// unfinished milestone (negative days-until) must NOT count toward d30/d60/d90
// or 30-day-due KPIs -- it belongs to 立即行动/slipping metrics instead.

function isoPlusDays(base, n) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function resetStore() {
  projects.length = 0;
  milestones.length = 0;
}

function makeProject(id) {
  return {
    id, name: `Project ${id}`, archived: false,
    biz: "B1", dept: "D1", status: "产品开发", complexity: 3, pm: "PM1",
  };
}

function makeMilestone(id, projectId, sortOrder, plannedEndOffsetDays, today) {
  const plannedEnd = isoPlusDays(today, plannedEndOffsetDays);
  return {
    id, projectId, sortOrder, name: `M${sortOrder}`,
    planned_start_date: plannedEnd,
    planned_end_date: plannedEnd,
    actual_start_date: null,
    actual_end_date: null,
  };
}

test("wave buckets exclude already-overdue unfinished milestones (0<=days<=N)", () => {
  resetStore();
  const today = "2026-07-02";
  state.today = new Date(today);

  const p = makeProject("P1");
  projects.push(p);
  milestones.push(
    makeMilestone("M-overdue", "P1", 1, -5, today), // overdue, unfinished
    makeMilestone("M-in10", "P1", 2, 10, today),
    makeMilestone("M-in45", "P1", 3, 45, today),
    makeMilestone("M-in70", "P1", 4, 70, today),
  );

  const m = cockpitMetrics([p]);
  assert.equal(m.wave.d30, 1, "d30 should only count M-in10, not the overdue milestone");
  assert.equal(m.wave.d60, 2, "d60 should count M-in10 and M-in45");
  assert.equal(m.wave.d90, 3, "d90 should count M-in10, M-in45, M-in70");

  const pv = projectsViewMetrics([p]);
  assert.equal(pv.milestonesDue30, 1, "projectsViewMetrics 30-day KPI should exclude overdue milestone");
});

test("wave buckets still count a milestone exactly on the boundary (days === N)", () => {
  resetStore();
  const today = "2026-07-02";
  state.today = new Date(today);

  const p = makeProject("P2");
  projects.push(p);
  milestones.push(makeMilestone("M-exact30", "P2", 1, 30, today));

  const m = cockpitMetrics([p]);
  assert.equal(m.wave.d30, 1, "a milestone due in exactly 30 days must be included (days<=N is inclusive)");
});

test("wave buckets count a milestone due today (days === 0)", () => {
  resetStore();
  const today = "2026-07-02";
  state.today = new Date(today);

  const p = makeProject("P3");
  projects.push(p);
  milestones.push(makeMilestone("M-today", "P3", 1, 0, today));

  const m = cockpitMetrics([p]);
  assert.equal(m.wave.d30, 1, "a milestone due today (days=0) must count toward the wave");
});
