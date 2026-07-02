import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { allocations } from "../src/core/data-store.js";
import { matrixCell } from "../src/views/resource.js";
import { state } from "../src/state/app-state.js";

// P2: matrixCell() filters the ENTIRE allocations array on every call --
// workloadView calls it once per (person x project) cell, an
// O(people x projects x allocations) heatmap render. Characterize its
// output before adding an optional pre-filtered `items` parameter so
// workloadView can pass a pre-indexed bucket instead.

function resetStore() {
  allocations.length = 0;
  state.resourceFilters = { system: "all", role: "all", outsource: "all", projectFocus: null, biz: "all", family: "all", dept: "all", status: "all", health: "all", peopleSort: "load" };
}

test("matrixCell renders '-' when there is no matching allocation", () => {
  resetStore();
  const html = matrixCell("Alice", "P1");
  assert.match(html, /load-empty/);
});

test("matrixCell renders ratio and load for a matching allocation", () => {
  resetStore();
  allocations.push({ person: "Alice", projectId: "P1", role: "后端", status: "产品开发", complexity: 3, timeRatio: 0.5, outsourced: false });
  const html = matrixCell("Alice", "P1");
  assert.match(html, /50%/, "should show the timeRatio as a rounded percentage");
});

test("matrixCell respects the current role resourceFilter", () => {
  resetStore();
  allocations.push({ person: "Alice", projectId: "P1", role: "后端", status: "产品开发", complexity: 3, timeRatio: 0.5, outsourced: false });
  state.resourceFilters.role = "前端";
  const html = matrixCell("Alice", "P1");
  assert.match(html, /load-empty/, "allocation with a non-matching role should be filtered out");
});

test("matrixCell uses an explicit pre-filtered items array instead of re-scanning the global allocations array", () => {
  resetStore();
  // Deliberately leave the global `allocations` array EMPTY -- if matrixCell
  // still auto-filters instead of using the passed-in items, this will
  // render '-' instead of the expected 50%.
  const alloc = { person: "Alice", projectId: "P1", role: "后端", status: "产品开发", complexity: 3, timeRatio: 0.5, outsourced: false };
  const html = matrixCell("Alice", "P1", [alloc]);
  assert.match(html, /50%/, "should use the explicitly-passed items even though the global allocations array is empty");
});
