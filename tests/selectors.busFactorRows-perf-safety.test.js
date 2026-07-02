import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { projects, allocations } from "../src/core/data-store.js";
import { busFactorRows } from "../src/core/selectors.js";
import { state } from "../src/state/app-state.js";

// P2 investigation note (not a fix): busFactorRows() calls
// projectAllocations([project]) once PER project (O(projects x
// allocations)). Before attempting to optimize this to a single grouped
// pass, this test characterizes the actual matching semantics -- which
// turned out to be subtler than assumed:
//
// 1. resourceProjects() keys each row by the RAW allocation.projectId when
//    there's no confirmed link, not by any canonical project.id.
// 2. projectAllocations([project]) matches by projectId OR by projectName,
//    so two DIFFERENT unlinked rows that happen to share a display name
//    (projectName) end up matching each other's allocations too --
//    contributors get double-counted across both rows.
//
// This second point is a genuine pre-existing quirk, not something this
// session introduced or was asked to fix. A correct O(P+A) rewrite would
// need to faithfully reproduce this cross-row double-counting, which is
// disproportionate risk for the realistic dataset sizes this app handles.
// Decision: busFactorRows() is left as-is; this test documents the quirk
// as a regression lock in case someone "fixes" it accidentally later.

function resetStore() {
  projects.length = 0;
  allocations.length = 0;
  state.resourceFilters = { system: "all", role: "all", outsource: "all", projectFocus: null, biz: "all", family: "all", dept: "all", status: "all", health: "all", peopleSort: "load" };
}

test("busFactorRows keeps each project's contributors isolated when projectIds are distinct and unambiguous", () => {
  resetStore();
  const p1 = { id: "P1", name: "P1" };
  const p2 = { id: "P2", name: "P2" };
  projects.push(p1, p2);
  allocations.push(
    { projectId: "P1", person: "Alice", role: "后端", status: "产品开发", complexity: 3, timeRatio: 1 },
    { projectId: "P2", person: "Bob", role: "前端", status: "产品开发", complexity: 3, timeRatio: 1 },
  );

  const rows = busFactorRows();
  const row1 = rows.find(r => r.project.id === "P1");
  const row2 = rows.find(r => r.project.id === "P2");
  assert.deepEqual(row1.contributors.map(c => c.person), ["Alice"]);
  assert.deepEqual(row2.contributors.map(c => c.person), ["Bob"]);
});

test("KNOWN QUIRK: unlinked allocations sharing a projectName double-count contributors across rows", () => {
  resetStore();
  // Two distinct raw resource keys, no confirmed links, same display name.
  allocations.push(
    { projectId: "KEY-1", projectName: "Alpha Project", person: "Alice", role: "后端", status: "产品开发", complexity: 3, timeRatio: 1 },
    { projectId: "KEY-2", projectName: "Alpha Project", person: "Bob", role: "前端", status: "产品开发", complexity: 3, timeRatio: 1 },
  );

  const rows = busFactorRows();
  const row1 = rows.find(r => r.project.id === "KEY-1");
  const row2 = rows.find(r => r.project.id === "KEY-2");
  // This IS today's actual behavior (not desired, just documented):
  // both rows see both contributors because the name match is symmetric.
  assert.deepEqual(row1.contributors.map(c => c.person).sort(), ["Alice", "Bob"]);
  assert.deepEqual(row2.contributors.map(c => c.person).sort(), ["Alice", "Bob"]);
});
