import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, allocations, personInfo, appSettings } from "../src/core/data-store.js";
import { busFactorRows } from "../src/core/selectors.js";
import { DEFAULT_SETTINGS } from "../src/config/settings-defaults.js";

// R3 part 3/3: busFactorRows' risk tier (R/Y/G) must honor
// appSettings.payload.loadThresholds.bfRisk/bfTarget instead of the
// hardcoded bf<=1/bf===2 cutoffs, so the Settings page's BF controls
// actually affect the Bus Factor view.

function resetStore() {
  projects.length = 0;
  allocations.length = 0;
  personInfo.length = 0;
  appSettings.payload = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

test("busFactorRows risk defaults match today's behavior (bfRisk=1, bfTarget=3)", () => {
  resetStore();
  const p = { id: "P1", name: "P1" };
  projects.push(p);
  allocations.push({ projectId: "P1", person: "Alice", role: "后端", status: "产品开发", complexity: 3, timeRatio: 1 });

  const rows = busFactorRows();
  assert.equal(rows[0].bf, 1);
  assert.equal(rows[0].risk, "R", "bf=1 should be red under default thresholds");
});

test("busFactorRows risk reacts to a configured bfRisk of 2", () => {
  resetStore();
  const p = { id: "P1", name: "P1" };
  projects.push(p);
  allocations.push(
    { projectId: "P1", person: "Alice", role: "后端", status: "产品开发", complexity: 3, timeRatio: 0.34 },
    { projectId: "P1", person: "Bob", role: "前端", status: "产品开发", complexity: 3, timeRatio: 0.33 },
    { projectId: "P1", person: "Cara", role: "Agent开发", status: "产品开发", complexity: 3, timeRatio: 0.33 },
  );

  // Three near-equal contributors: the top one alone is ~34%, under the 50%
  // cumulative cutoff, so a second contributor is needed -> bf should be 2.
  const rowsDefault = busFactorRows();
  assert.equal(rowsDefault[0].bf, 2);
  assert.equal(rowsDefault[0].risk, "Y", "bf=2 is yellow under default bfRisk=1");

  appSettings.payload.loadThresholds = { low: 0.6, mid: 1.2, bfRisk: 2, bfTarget: 3 };
  const rowsConfigured = busFactorRows();
  assert.equal(rowsConfigured[0].risk, "R", "bf=2 should become red once the configured bfRisk threshold is raised to 2");
});
