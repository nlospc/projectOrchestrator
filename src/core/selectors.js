import { allocations, milestones, projects } from "./data-store.js";
import { state } from "../state/app-state.js";
import { computeSegments } from "./milestones.js";
import { effectiveHealth, loadFor, parseDate } from "./utils.js";
import { busFactorRows, keyPeopleRiskRows } from "../views/resource.js";

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

export function cockpitMetrics(projectList = filteredProjects()) {
  const today = state.today ?? new Date();
  const projectIds = new Set(projectList.map(p => p.id));

  // 1.1 Delivery Confidence
  let red = 0, yellow = 0, green = 0;
  for (const p of projectList) {
    const rag = projectRag(p, today);
    if (rag === "R") red++;
    else if (rag === "Y") yellow++;
    else if (rag === "G") green++;
  }
  const total = red + yellow + green;
  const index = total ? green / total : 0;

  // 1.2 Act-Now Risk List
  const riskProjects = projectList.filter(p => {
    const rag = projectRag(p, today);
    return rag === "R" || rag === "Y";
  });
  const actNow = [];
  for (const p of riskProjects) {
    const ms = milestones
      .filter(m => m.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const segs = computeSegments(ms, p, today);
    let maxSlip = 0;
    let worstMilestone = ms[0]?.name || "";
    for (const seg of segs) {
      let slip = 0;
      if (seg.scenario === 4) {
        slip = Math.round((today - new Date(seg.milestone.planned_end_date)) / 86400000);
      } else if (seg.scenario === 2) {
        slip = seg.deviationDays || 0;
      }
      if (slip > maxSlip) {
        maxSlip = slip;
        worstMilestone = seg.milestone?.name || worstMilestone;
      }
    }
    actNow.push({
      projectId: p.id,
      projectName: p.name,
      owner: p.pm || "",
      dept: p.dept || "",
      milestoneName: worstMilestone,
      slipDays: maxSlip,
      rag: projectRag(p, today),
      impactScore: maxSlip * (p.complexity || 3),
    });
  }
  actNow.sort((a, b) => b.impactScore - a.impactScore);

  // 1.3 Delivery Wave
  const upcoming = milestones.filter(m =>
    !m.actual_end_date && projectIds.has(m.projectId)
  );
  const daysUntil = d => Math.round((new Date(d) - today) / 86400000);
  const d30 = upcoming.filter(m => daysUntil(m.planned_end_date) <= 30).length;
  const d60 = upcoming.filter(m => daysUntil(m.planned_end_date) <= 60).length;
  const d90 = upcoming.filter(m => daysUntil(m.planned_end_date) <= 90).length;

  // 1.4 Concentration Risk
  const stats = personStats(projectList);
  const bfRows = busFactorRows();
  const bf1Count = bfRows.filter(r => r.bf <= 1).length;
  const overAllocated = stats.filter(p => p.ratio > 1).length;
  const overloaded = stats.filter(p => p.load >= 1.2).length;
  const keyPersons = keyPeopleRiskRows(bfRows).slice(0, 5).map(kp => {
    const personInfo = stats.find(s => s.person === kp.person);
    return {
      person: kp.person,
      role: personInfo?.role || "",
      ratio: personInfo?.ratio || 0,
      load: kp.load,
      singlePoint: kp.singlePoint,
    };
  });

  // 1.5 Org Heatmap
  const orgMap = new Map();
  for (const p of projectList) {
    const rag = projectRag(p, today);
    if (rag === "gray") continue;
    const biz = p.biz || "未分类";
    const entry = orgMap.get(biz) || { biz, red: 0, yellow: 0, green: 0 };
    if (rag === "R") entry.red++;
    else if (rag === "Y") entry.yellow++;
    else if (rag === "G") entry.green++;
    orgMap.set(biz, entry);
  }
  const orgHeatmap = [...orgMap.values()].sort((a, b) => b.red - a.red || b.yellow - a.yellow);

  // 1.6 Phase Distribution
  const PHASE_BUCKETS = [
    { label: "设计", statuses: ["需求调研", "产品设计"] },
    { label: "开发", statuses: ["产品开发"] },
    { label: "测试", statuses: ["产品自测", "UAT"] },
    { label: "运维/上线", statuses: ["部署上线", "系统运维"] },
  ];
  const phases = PHASE_BUCKETS.map(b => ({
    label: b.label,
    count: projectList.filter(p => b.statuses.includes(p.status)).length,
  }));

  // 1.7 Workforce Utilization
  const low = stats.filter(p => p.load < 0.6).length;
  const mid = stats.filter(p => p.load >= 0.6 && p.load < 1.2).length;
  const high = stats.filter(p => p.load >= 1.2).length;

  return {
    confidence: { index, red, yellow, green, delta: null },
    actNow: actNow.slice(0, 6),
    wave: { d30, d60, d90 },
    concentration: { bf1Count, overAllocated, overloaded, keyPersons },
    orgHeatmap,
    phases,
    workforce: { low, mid, high },
  };
}
