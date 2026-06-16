import { allocations, milestones, projects } from "./data-store.js";
import { state } from "../state/app-state.js";
import { computeSegments } from "./milestones.js";
import { effectiveHealth, loadFor, parseDate } from "./utils.js";

// ─── Role-category mapping for projectResourceSummary ────────────────────────
// Roles not listed here fall into "开发" (catch-all for technical staff).
const ROLE_TO_CATEGORY = {
  "产品经理": "产品",
  "UI/UX":   "产品",
  "项目经理": "项目",
};
function roleCategory(role) {
  return ROLE_TO_CATEGORY[role] ?? "开发";
}

// ─── Existing selectors (unchanged) ──────────────────────────────────────────

export function filteredProjects() {
  return projects.filter((project) => {
    const filters = state.filters;
    if (!filters.includeArchived && project.archived) return false;
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

// ─── T5: New selectors ────────────────────────────────────────────────────────

/**
 * Compute project-level RAG from milestone segments.
 *
 * R — any milestone is scenario④ (overdue, A absent) OR scenario② with
 *     deviationDays > state.settings.delayRedThresholdDays
 * Y — any milestone is scenario⑤ (eroded), and no R condition fires
 * G — all milestones are scenario① or ③
 * gray — project.archived === true OR no milestones
 *
 * @param {object} project
 * @param {Date}   today
 * @returns {"R"|"Y"|"G"|"gray"}
 */
export function projectRag(project, today) {
  if (project.archived) return "gray";
  const ms = milestones
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (ms.length === 0) return "gray";

  const threshold = state.settings?.delayRedThresholdDays ?? 7;
  const segments = computeSegments(ms, project, today);

  let hasYellow = false;
  for (const seg of segments) {
    if (seg.scenario === 4) return "R";
    if (seg.scenario === 2 && seg.deviationDays > threshold) return "R";
    if (seg.scenario === 5) hasYellow = true;
  }
  return hasYellow ? "Y" : "G";
}

/**
 * Return overflow bounds if the last milestone's segEnd exceeds
 * project.planned_end_date, otherwise null.
 *
 * @param {object} project
 * @param {Date}   today
 * @returns {{ overflowStart: Date, overflowEnd: Date } | null}
 */
export function projectOverflowSegment(project, today) {
  if (!project.planned_end_date) return null;
  const ms = milestones
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (ms.length === 0) return null;

  const segments = computeSegments(ms, project, today);
  const maxSegEnd = segments.reduce(
    (max, seg) => (seg.segEnd > max ? seg.segEnd : max),
    new Date(0)
  );
  const projectEnd = new Date(project.planned_end_date);
  if (maxSegEnd <= projectEnd) return null;
  return { overflowStart: projectEnd, overflowEnd: maxSegEnd };
}

/**
 * Count allocated headcount by role category for a project.
 * Keyed on project.id ↔ allocation.projectId.
 * Returns zeros when no allocations match (v1.0 seed uses legacy projectId strings).
 *
 * @param {object} project
 * @returns {{ 产品: number, 项目: number, 开发: number }}
 */
export function projectResourceSummary(project) {
  const cats = { 产品: new Set(), 项目: new Set(), 开发: new Set() };
  for (const a of allocations) {
    if (a.projectId !== project.id) continue;
    const cat = roleCategory(a.role);
    cats[cat].add(a.person);
  }
  return { 产品: cats.产品.size, 项目: cats.项目.size, 开发: cats.开发.size };
}

// ─── Fixed dashboardMetrics ───────────────────────────────────────────────────

export function dashboardMetrics(list) {
  const today = state.today ?? new Date();
  const projectIds = new Set(list.map((p) => p.id));

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

  const projectMilestones = milestones
    .filter((m) => projectIds.has(m.projectId))
    .sort((a, b) => new Date(a.planned_end_date) - new Date(b.planned_end_date));

  // due = milestones whose planned_end_date falls in the current calendar month
  const due = projectMilestones.filter((m) => {
    const d = new Date(m.planned_end_date);
    return d >= monthStart && d <= monthEnd;
  }).length;

  const stats = personStats(list);

  // risks = projects in R or Y RAG (replaces old milestone.state === "R/Y" scan)
  const risks = list.filter((p) => {
    const rag = projectRag(p, today);
    return rag === "R" || rag === "Y";
  });

  return {
    stats,
    red:      list.filter((p) => projectRag(p, today) === "R").length,
    yellow:   list.filter((p) => projectRag(p, today) === "Y").length,
    green:    list.filter((p) => projectRag(p, today) === "G").length,
    due,
    overload: stats.filter((person) => person.load >= 1.2).length,
    risks,
  };
}
