/**
 * Resource-filter cascade: selecting a system auto-fills the matching
 * product family; selecting a family resets system if it no longer
 * belongs to that family. Extracted from shell.js's change handler so
 * the decision logic is testable without a DOM.
 */
export function applyResourceFilterCascade(rfKey, rfVal, resourceFilters, allocations, projects) {
  resourceFilters[rfKey] = rfVal;

  if (rfKey === "system" && rfVal !== "all") {
    const hit = allocations.find((a) => a.system === rfVal);
    const proj = hit ? projects.find((p) => p.id === hit.projectId) : null;
    if (proj?.family) resourceFilters.family = proj.family;
  } else if (rfKey === "family" && rfVal !== "all" && resourceFilters.system !== "all") {
    const hit = allocations.find((a) => a.system === resourceFilters.system);
    const proj = hit ? projects.find((p) => p.id === hit.projectId) : null;
    if (!proj || proj.family !== rfVal) resourceFilters.system = "all";
  }

  return resourceFilters;
}
