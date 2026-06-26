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
      (resourceFilters.system === "all" ||
        (resourceFilters.system === "未归属系统"
          ? !project.system
          : project.system === resourceFilters.system))
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

export function busFactorRows() {
  return resourceProjects().map((project) => {
    const peopleLoads = new Map();
    const roleCoverage = new Map();
    let total = 0;
    for (const allocation of projectAllocations([project])) {
      const load = loadFor(allocation);
      if (load <= 0) continue;
      total += load;
      peopleLoads.set(allocation.person, (peopleLoads.get(allocation.person) || 0) + load);
      const people = roleCoverage.get(allocation.role) || new Set();
      people.add(allocation.person);
      roleCoverage.set(allocation.role, people);
    }
    const contributors = [...peopleLoads.entries()].map(([person, load]) => ({ person, load })).sort((a, b) => b.load - a.load);
    let acc = 0;
    let bf = 0;
    for (const item of contributors) {
      acc += item.load;
      bf += 1;
      if (total > 0 && acc / total >= 0.5) break;
    }
    const top = contributors[0];
    const singleRoles = [...roleCoverage.entries()].filter(([, people]) => people.size === 1).map(([role]) => role);
    return {
      project,
      contributors,
      total,
      bf,
      peopleCount: contributors.length,
      topPerson: top?.person || "-",
      topLoad: top?.load || 0,
      topShare: total ? (top?.load || 0) / total : 0,
      singleRoles,
      roleCoverage,
      risk: bf <= 1 ? "R" : bf === 2 ? "Y" : "G",
    };
  }).sort((a, b) => a.bf - b.bf || b.topShare - a.topShare);
}

export function keyPeopleRiskRows(rows) {
  const people = new Map();
  rows.filter((row) => row.bf <= 2).forEach((row) => {
    row.contributors.slice(0, Math.max(1, row.bf)).forEach((item) => {
      const current = people.get(item.person) || { person: item.person, projects: new Set(), load: 0, singlePoint: 0 };
      current.projects.add(row.project.name);
      current.load += item.load;
      if (row.bf === 1) current.singlePoint += 1;
      people.set(item.person, current);
    });
  });
  return [...people.values()].map((item) => ({ ...item, projectCount: item.projects.size })).sort((a, b) => b.singlePoint - a.singlePoint || b.load - a.load);
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
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      let slip = 0;
      if (seg.scenario === 4) {
        slip = seg.deviationDays || 0;
      } else if (seg.scenario === 2) {
        slip = seg.deviationDays || 0;
      }
      if (slip > maxSlip) {
        maxSlip = slip;
        worstMilestone = ms[si]?.name || worstMilestone;
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

export function overviewMetrics() {
  const cm = cockpitMetrics();
  const total = cm.confidence.red + cm.confidence.yellow + cm.confidence.green;
  const confPct = total ? Math.round(cm.confidence.index * 100) : 0;

  // decisions: actNow items enriched with nextDate (planned_end_date of the slipping milestone)
  const decisions = cm.actNow.map(r => {
    const ms = milestones
      .filter(m => m.projectId === r.projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const upcoming = ms.find(m => !m.actual_end_date);
    const nextDate = upcoming ? upcoming.planned_end_date : null;
    return { ...r, nextDate };
  });

  return {
    ...cm,
    headline: {
      total,
      confPct,
      decisionCount: cm.actNow.length,
      d30: cm.wave.d30,
    },
    decisions,
    signals: {
      overAllocated: cm.concentration.overAllocated,
      keyPersonCount: cm.concentration.keyPersons.length,
      d60: cm.wave.d60,
      healthyCount: cm.workforce.low,
    },
    snapshot: { importedAt: null, previousBatch: null },
    deltas: {
      confidence_index: null,
      red: null,
      yellow: null,
      green: null,
      wave_d30: null,
      wave_d60: null,
      wave_d90: null,
      bf1_count: null,
      over_allocated: null,
      overloaded: null,
      workforce_low: null,
      workforce_mid: null,
      workforce_high: null,
      project_total: null,
    },
  };
}

export function projectsViewMetrics(projectList = filteredProjects()) {
  const today = state.today ?? new Date();
  let red = 0, yellow = 0, green = 0;
  for (const p of projectList) {
    const rag = projectRag(p, today);
    if (rag === 'R') red++;
    else if (rag === 'Y') yellow++;
    else if (rag === 'G') green++;
  }
  const total = red + yellow + green;

  let slippingCount = 0;
  let maxDeviation = 0;
  const projectIds = new Set(projectList.map(p => p.id));
  for (const p of projectList) {
    const ms = milestones
      .filter(m => m.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (!ms.length) continue;
    const segs = computeSegments(ms, p, today);
    for (const seg of segs) {
      if ((seg.scenario === 2 || seg.scenario === 4) && seg.deviationDays > 0) {
        slippingCount++;
        if (seg.deviationDays > maxDeviation) maxDeviation = seg.deviationDays;
      }
    }
  }

  const upcoming = milestones.filter(m =>
    !m.actual_end_date && projectIds.has(m.projectId)
  );
  const milestonesDue30 = upcoming.filter(m => {
    const days = Math.round((new Date(m.planned_end_date) - today) / 86400000);
    return days <= 30;
  }).length;

  return { total, red, yellow, green, slippingCount, maxDeviation, milestonesDue30 };
}
