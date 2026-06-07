import { allocations, projects } from "../data/mock-data.js";
import { state } from "../state/app-state.js";
import { effectiveHealth, loadFor, parseDate } from "./utils.js";

export function filteredProjects() {
  return projects.filter((project) => {
    const filters = state.filters;
    return (
      (filters.dept === "all" || project.dept === filters.dept) &&
      (filters.biz === "all" || project.biz === filters.biz) &&
      (filters.status === "all" || project.status === filters.status) &&
      (filters.health === "all" || effectiveHealth(project) === filters.health) &&
      (filters.pm === "all" || project.pm === filters.pm)
    );
  });
}

export function resourceProjects() {
  const rows = new Map();
  allocations.forEach((allocation) => {
    if (!rows.has(allocation.projectId)) {
      rows.set(allocation.projectId, {
        id: allocation.projectId,
        name: allocation.projectName || allocation.projectId,
        cat: allocation.cat,
        dept: allocation.dept,
        biz: allocation.biz,
        system: allocation.system,
        status: allocation.status,
        complexity: allocation.complexity,
        health: allocation.status === "项目暂停" ? "R" : allocation.status === "UAT" ? "Y" : "G",
      });
    }
  });
  return [...rows.values()].filter((project) => {
    const filters = state.filters;
    const resourceFilters = state.resourceFilters;
    return (
      (filters.dept === "all" || project.dept === filters.dept) &&
      (filters.biz === "all" || project.biz === filters.biz) &&
      (filters.status === "all" || project.status === filters.status) &&
      (filters.health === "all" || project.health === filters.health) &&
      (resourceFilters.system === "all" || project.system === resourceFilters.system)
    );
  });
}

export function projectAllocations(projectList = resourceProjects()) {
  const ids = new Set(projectList.map((project) => project.id));
  const names = new Set(projectList.map((project) => project.name).filter(Boolean));
  return allocations.filter((allocation) => {
    const inScope = ids.has(allocation.projectId) || names.has(allocation.projectName);
    const resourceFilters = state.resourceFilters;
    return (
      inScope &&
      (resourceFilters.role === "all" || allocation.role === resourceFilters.role) &&
      (resourceFilters.outsource === "all" ||
        (resourceFilters.outsource === "internal" && !allocation.outsourced) ||
        (resourceFilters.outsource === "external" && allocation.outsourced))
    );
  });
}

export function personStats(projectList = resourceProjects()) {
  const rows = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const value = loadFor(allocation);
    const current = rows.get(allocation.person) || {
      person: allocation.person,
      role: allocation.role,
      dept: allocation.dept,
      outsourced: allocation.outsourced,
      projects: new Set(),
      ratio: 0,
      load: 0,
    };
    current.projects.add(allocation.projectId);
    current.ratio += allocation.timeRatio;
    current.load += value;
    current.outsourced = current.outsourced || allocation.outsourced;
    rows.set(allocation.person, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects] })).sort((a, b) => b.load - a.load);
}

export function dashboardMetrics(list) {
  const projectIds = new Set(list.map((project) => project.id));
  const projectMilestones = milestones
    .filter((milestone) => projectIds.has(milestone.projectId))
    .sort((a, b) => parseDate(a.plannedEnd) - parseDate(b.plannedEnd));
  const stats = personStats(list);
  return {
    stats,
    red: list.filter((project) => effectiveHealth(project) === "R").length,
    yellow: list.filter((project) => effectiveHealth(project) === "Y").length,
    green: list.filter((project) => effectiveHealth(project) === "G").length,
    due: projectMilestones.filter((milestone) => ["M5", "M6", "M7"].some((suffix) => milestone.id.endsWith(suffix))).length,
    delayed: projectMilestones.filter((milestone) => milestone.state === "R").length,
    overload: stats.filter((person) => person.load >= 1.2).length,
    risks: projectMilestones.filter((milestone) => ["R", "Y"].includes(milestone.state)),
  };
}
