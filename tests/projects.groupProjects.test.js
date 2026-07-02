import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, milestones } from "../src/core/data-store.js";
import { groupProjects } from "../src/views/projects.js";
import { state } from "../src/state/app-state.js";

// P1: groupProjects() currently recomputes projectRag()/computeSegments()
// INSIDE the default-sort comparator (O(n log n) recomputations instead of
// O(n)). This is a characterization test for its current, correct output --
// it must still pass after the sort is refactored to a decorate-sort-
// undecorate pattern (no behavior change, only redundant computation removed).

function resetStore() {
  projects.length = 0;
  milestones.length = 0;
  state.filters = { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all", groupBy: "family", includeArchived: false, granularity: "month", sortBy: "default" };
}

test("groupProjects: default sort orders R before Y before G within a family group", () => {
  resetStore();
  state.today = new Date("2026-07-02");

  const pR = { id: "P-R", name: "Red Project", family: "FAM-1", archived: false };
  const pY = { id: "P-Y", name: "Yellow Project", family: "FAM-1", archived: false };
  const pG = { id: "P-G", name: "Green Project", family: "FAM-1", archived: false };
  // Push in a scrambled order to prove the sort actually reorders them.
  projects.push(pG, pR, pY);

  // P-R: scenario ④ overdue-unfilled -> red.
  milestones.push({
    id: "M-R", projectId: "P-R", sortOrder: 1, name: "M1",
    planned_start_date: "2026-06-01", planned_end_date: "2026-06-10",
    actual_start_date: "2026-06-01", actual_end_date: null,
  });
  // P-Y: scenario ⑤ eroded (segStart >= planned_end_date, no actual date).
  milestones.push({
    id: "M-Y", projectId: "P-Y", sortOrder: 1, name: "M1",
    planned_start_date: "2026-06-01", planned_end_date: "2026-06-10",
    actual_start_date: "2026-07-01", actual_end_date: null,
  });
  // P-G: scenario ① finished on time -> green.
  milestones.push({
    id: "M-G", projectId: "P-G", sortOrder: 1, name: "M1",
    planned_start_date: "2026-01-01", planned_end_date: "2026-01-10",
    actual_start_date: "2026-01-01", actual_end_date: "2026-01-05",
  });

  const groups = groupProjects(projects, state.today);
  assert.equal(groups.length, 1, "all three projects share FAM-1, so there should be exactly one group");
  const g = groups[0];
  assert.deepEqual(g.projects.map(p => p.id), ["P-R", "P-Y", "P-G"], "default sort must order red, then yellow, then green");
  assert.equal(g.redCount, 1);
  assert.equal(g.yellowCount, 1);
  assert.equal(g.greenCount, 1);
});

test("groupProjects: name sort ignores RAG and orders alphabetically (zh)", () => {
  resetStore();
  state.today = new Date("2026-07-02");
  state.filters.sortBy = "name";

  const pB = { id: "P-B", name: "乙项目", family: "FAM-1", archived: false };
  const pA = { id: "P-A", name: "甲项目", family: "FAM-1", archived: false };
  projects.push(pB, pA);

  const groups = groupProjects(projects, state.today);
  assert.deepEqual(groups[0].projects.map(p => p.id), ["P-A", "P-B"], "name sort should order 甲 before 乙");
});
