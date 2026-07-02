import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, milestones, allocations, personInfo, appSettings } from "../src/core/data-store.js";
import { cockpitMetrics } from "../src/core/selectors.js";
import { loadLevel, peopleView } from "../src/views/resource.js";
import { DEFAULT_SETTINGS } from "../src/config/settings-defaults.js";

// R3 part 2/3: load classification (loadLevel, cockpitMetrics workforce
// counts, and the KPI text labels that describe the thresholds) must all
// honor appSettings.payload.loadThresholds instead of hardcoded 0.6/1.2 --
// otherwise changing the Settings page has no visible effect on load KPIs,
// and worse, a changed threshold silently disagrees with the displayed
// "≥ 1.2" / "< 0.6" text.

function resetStore() {
  projects.length = 0;
  milestones.length = 0;
  allocations.length = 0;
  personInfo.length = 0;
  appSettings.payload = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

test("loadLevel honors configured loadThresholds instead of hardcoded 0.6/1.2", () => {
  resetStore();
  // Default thresholds (low 0.6, mid 1.2): 0.9 is medium.
  assert.equal(loadLevel(0.9).key, "Y", "0.9 should be medium under default thresholds");

  // Configure a lower mid threshold: 0.9 should now classify as high.
  appSettings.payload.loadThresholds = { low: 0.5, mid: 0.8, bfRisk: 1, bfTarget: 3 };
  assert.equal(loadLevel(0.9).key, "R", "0.9 should be high once the configured mid threshold drops to 0.8");
});

test("cockpitMetrics workforce buckets honor configured loadThresholds", () => {
  resetStore();
  const p = { id: "P1", name: "P1", archived: false, biz: "B", dept: "D", status: "产品开发", complexity: 3, pm: "PM" };
  projects.push(p);
  personInfo.push({ name: "Alice", role: "开发", outsourced: false });
  allocations.push({
    projectId: "P1", projectName: "P1", person: "Alice", role: "开发",
    outsourced: false, timeRatio: 0.9, complexity: 3, status: "产品开发",
  });

  // With default thresholds, Alice's load (well under 1.2) should be low or medium, not high.
  const before = cockpitMetrics([p]);
  assert.equal(before.workforce.high, 0, "no one should be classified high under default thresholds for this fixture");

  // Drop the mid threshold low enough that Alice's load now counts as high.
  appSettings.payload.loadThresholds = { low: 0.05, mid: 0.1, bfRisk: 1, bfTarget: 3 };
  const after = cockpitMetrics([p]);
  assert.equal(after.workforce.high, 1, "workforce.high should react to a lowered configured mid threshold");
});

test("peopleView's 超负荷人员 hero label reflects the configured mid threshold, not a hardcoded 1.2", () => {
  resetStore();
  appSettings.payload.loadThresholds = { low: 0.6, mid: 0.85, bfRisk: 1, bfTarget: 3 };
  const html = peopleView();
  assert.ok(html.includes("0.85"), "hero-sub text should interpolate the configured mid threshold (0.85), not a hardcoded 1.2");
});
