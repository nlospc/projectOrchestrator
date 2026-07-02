import test from "node:test";
import assert from "node:assert/strict";
import { applyResourceFilterCascade } from "../src/core/resource-filters.js";

// R4: allocations expose `projectId` (see server/repositories/allocations.js
// rowToAllocation: `projectId: row.project_key`), NOT `project_key`. The
// cascade previously read `hit.project_key`, which is always undefined on
// the client-side allocation objects, so selecting a system never
// auto-filled family, and family never reset system.

function makeAllocation(system, projectId) {
  return { system, projectId };
}
function makeProject(id, family) {
  return { id, family };
}

test("selecting a system auto-sets the matching family", () => {
  const allocations = [makeAllocation("SYS-A", "P1")];
  const projects = [makeProject("P1", "FAM-X")];
  const resourceFilters = { system: "all", family: "all" };

  applyResourceFilterCascade("system", "SYS-A", resourceFilters, allocations, projects);

  assert.equal(resourceFilters.system, "SYS-A");
  assert.equal(resourceFilters.family, "FAM-X", "family should auto-fill from the selected system's project");
});

test("selecting a family that no longer matches the current system resets system to all", () => {
  const allocations = [makeAllocation("SYS-A", "P1")];
  const projects = [makeProject("P1", "FAM-X")];
  const resourceFilters = { system: "SYS-A", family: "all" };

  applyResourceFilterCascade("family", "FAM-OTHER", resourceFilters, allocations, projects);

  assert.equal(resourceFilters.system, "all", "system should reset when it no longer belongs to the chosen family");
  assert.equal(resourceFilters.family, "FAM-OTHER");
});

test("selecting a family that still matches the current system keeps system unchanged", () => {
  const allocations = [makeAllocation("SYS-A", "P1")];
  const projects = [makeProject("P1", "FAM-X")];
  const resourceFilters = { system: "SYS-A", family: "all" };

  applyResourceFilterCascade("family", "FAM-X", resourceFilters, allocations, projects);

  assert.equal(resourceFilters.system, "SYS-A", "system should stay selected when still consistent with the family");
});
