import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, milestones, allocations, confirmedLinks } from "../src/core/data-store.js";
import { projectRag, filteredProjects, resourceProjects } from "../src/core/selectors.js";
import { state } from "../src/state/app-state.js";

// D-1 (user-confirmed): projectRag() is the single health source for both
// display and filtering; a manual override wins over computed RAG.
// archived still wins over everything (existing behavior, unchanged).

function resetStore() {
  projects.length = 0;
  milestones.length = 0;
  state.filters = { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all", groupBy: "family", includeArchived: false, granularity: "month", sortBy: "default" };
}

test("projectRag returns the manual override even with no milestones", () => {
  resetStore();
  const p = { id: "P1", name: "P1", archived: false, override: "R", health: "G" };
  projects.push(p);

  assert.equal(projectRag(p, new Date("2026-07-02")), "R", "override should win even when there are no milestones to compute from");
});

test("projectRag returns the manual override even when milestones would compute green", () => {
  resetStore();
  const p = { id: "P1", name: "P1", archived: false, override: "R", health: "G" };
  projects.push(p);
  milestones.push({
    id: "M1", projectId: "P1", sortOrder: 1, name: "M1",
    planned_start_date: "2026-06-01", planned_end_date: "2026-06-10",
    actual_start_date: "2026-06-01", actual_end_date: "2026-06-05", // finished early -> scenario ①, would be green
  });

  assert.equal(projectRag(p, new Date("2026-07-02")), "R", "override should win over a computed-green result");
});

test("archived still wins over a manual override", () => {
  resetStore();
  const p = { id: "P1", name: "P1", archived: true, override: "R", health: "G" };
  projects.push(p);

  assert.equal(projectRag(p, new Date("2026-07-02")), "gray", "archived must still take precedence over override");
});

test("health filter uses computed projectRag, not the stale static health field, when no override is set", () => {
  resetStore();
  // Static health field claims R (stale import), but the milestone actually
  // finished on time -> computed RAG is G. No override is set. The filter
  // must follow the computed RAG, not the static field.
  const p = { id: "P1", name: "P1", archived: false, override: "", health: "R", dept: "D", biz: "B", status: "产品开发", pm: "PM" };
  projects.push(p);
  milestones.push({
    id: "M1", projectId: "P1", sortOrder: 1, name: "M1",
    planned_start_date: "2026-06-01", planned_end_date: "2026-06-10",
    actual_start_date: "2026-06-01", actual_end_date: "2026-06-05",
  });
  state.today = new Date("2026-07-02");
  state.filters.health = "R";

  const filtered = filteredProjects();
  assert.equal(filtered.length, 0, "project should NOT match health=R filter once computed RAG (G) overrides the stale static field");
});

test("resourceProjects uses computed projectRag for linked (canonical) projects, not the stale static health field", () => {
  resetStore();
  allocations.length = 0;
  confirmedLinks.clear();

  const p = { id: "P1", name: "P1", archived: false, override: "", health: "R", dept: "D", biz: "B", status: "产品开发", pm: "PM" };
  projects.push(p);
  milestones.push({
    id: "M1", projectId: "P1", sortOrder: 1, name: "M1",
    planned_start_date: "2026-06-01", planned_end_date: "2026-06-10",
    actual_start_date: "2026-06-01", actual_end_date: "2026-06-05",
  });
  confirmedLinks.set("RES-1", "P1");
  allocations.push({ projectId: "RES-1", projectName: "P1", person: "Alice", role: "后端", status: "产品开发", complexity: 3, timeRatio: 1 });
  state.today = new Date("2026-07-02");

  const rows = resourceProjects();
  assert.equal(rows[0].health, "G", "linked project's health should follow computed RAG (G), not the stale static field (R)");
});
