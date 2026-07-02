import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, milestones, appSettings } from "../src/core/data-store.js";
import { projectRag } from "../src/core/selectors.js";
import { DEFAULT_SETTINGS } from "../src/config/settings-defaults.js";

// R3: projectRag's red-threshold must come from appSettings.payload
// (what the Settings page actually saves to), not the dead
// state.settings object that the Settings page never writes to.

function resetStore() {
  projects.length = 0;
  milestones.length = 0;
  appSettings.payload = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function makeProject(id) {
  return { id, name: `Project ${id}`, archived: false };
}

// scenario ② (延期完成): actual_end_date is `deviationDays` days after
// planned_end_date.
function makeLateMilestone(id, projectId, deviationDays, today) {
  const plannedEnd = new Date(today);
  plannedEnd.setUTCDate(plannedEnd.getUTCDate() - 10);
  const plannedStart = new Date(plannedEnd);
  plannedStart.setUTCDate(plannedStart.getUTCDate() - 10);
  const actualEnd = new Date(plannedEnd);
  actualEnd.setUTCDate(actualEnd.getUTCDate() + deviationDays);
  const iso = (d) => d.toISOString().slice(0, 10);
  return {
    id, projectId, sortOrder: 1, name: "M1",
    planned_start_date: iso(plannedStart),
    planned_end_date: iso(plannedEnd),
    actual_start_date: iso(plannedStart),
    actual_end_date: iso(actualEnd),
  };
}

test("projectRag red-threshold respects appSettings.payload.healthRules.deviationDays", () => {
  resetStore();
  const today = new Date("2026-07-02");
  const p = makeProject("P1");
  projects.push(p);
  milestones.push(makeLateMilestone("M1", "P1", 10, today)); // 10 days late

  // Default threshold (7): 10 > 7 -> red.
  assert.equal(projectRag(p, today), "R", "10-day slip should be red under the default 7-day threshold");

  // Raise the configured threshold above the slip: 10 <= 15 -> no longer red.
  appSettings.payload.healthRules.deviationDays = 15;
  assert.notEqual(projectRag(p, today), "R", "10-day slip should NOT be red once the configured threshold is raised to 15");
});
