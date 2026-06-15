import { comments, milestoneChangeLogs, milestones, projects } from "../data/mock-data.js";
import {
  $, addMonths, badge, detail, effectiveHealth, escapeHtml,
  monthEnd, monthLabel, monthStart,
} from "../core/utils.js";
import { computeSegments } from "../core/milestones.js";
import {
  dashboardMetrics, filteredProjects,
  projectOverflowSegment, projectRag, projectResourceSummary,
} from "../core/selectors.js";
import { barChart, distributionList } from "./resource.js";
import { state } from "../state/app-state.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function dashboardView() {
  const list = filteredProjects();
  const metrics = dashboardMetrics(list);
  const categoryRows = groupedProjectRows(list, "category");
  const statusRows = groupedProjectRows(list, "status");
  return `
    <div class="grid kpi-grid dashboard-kpis">
      ${kpi("项目总数", list.length, "当前筛选范围内项目")}
      ${kpi("红灯项目", metrics.red, "点击查看红灯项目", "R", "health-filter", "R")}
      ${kpi("黄灯项目", metrics.yellow, "需要跟踪排期和资源", "Y", "health-filter", "Y")}
      ${kpi("本月里程碑", metrics.due, "计划完成日期落本月")}
      ${kpi("超负荷人员", metrics.overload, "投入度 ≥ 120%", "Y")}
    </div>
    <div class="dashboard-priority">
      <section class="panel health-panel">
        <h2>项目健康分布</h2>
        <div class="bar-stack">
          ${barLine("红灯", metrics.red, list.length, "R")}
          ${barLine("黄灯", metrics.yellow, list.length, "Y")}
          ${barLine("绿灯", metrics.green, list.length, "G")}
        </div>
      </section>
      <section class="panel risk-panel">
        <h2>风险项目</h2>
        <div class="stack compact-list">
          ${metrics.risks.length
            ? metrics.risks.slice(0, 6).map(p => riskRow(p)).join("")
            : '<p class="muted">当前筛选范围内暂无红/黄灯项目。</p>'}
        </div>
      </section>
    </div>
    <div class="dashboard-secondary">
      <section class="panel stage-panel">
        <h2>分类项目分布</h2>
        ${barChart(categoryRows, "dashboard-category")}
        ${distributionList(categoryRows)}
      </section>
      <section class="panel stage-panel">
        <h2>项目状态分布</h2>
        ${barChart(statusRows, "dashboard-status")}
        ${distributionList(statusRows)}
      </section>
    </div>`;
}

export function kpi(label, value, hint, status = "", action = "", actionValue = "") {
  return `<article class="kpi ${action ? "clickable" : ""}" ${action ? `data-action="${action}" data-value="${actionValue}"` : ""}>
    <span>${label}</span><strong>${value}</strong><small>${hint}</small>${status ? `<div style="margin-top:8px">${badge(status)}</div>` : ""}
  </article>`;
}

export function barLine(label, value, total, status) {
  const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
  return `<div class="bar-line"><strong>${label}</strong><div class="bar-track"><div class="bar-fill ${status}" style="width:${width}%"></div></div><span>${value}</span></div>`;
}

export function riskRow(project) {
  const rag = effectiveHealth(project);
  return `<button class="risk-row clickable" data-open-project="${project.id}">
    <span><strong>${escapeHtml(project.name)}</strong><br>
    <span class="muted">${escapeHtml(project.code || project.id)} · ${escapeHtml(project.dept)}</span></span>
    ${badge(rag)}
  </button>`;
}

export function personRow(person) {
  return `<div class="person-row">
    <span><strong>${person.person}</strong><br><span class="muted">${person.role} · ${person.projects.length} 个项目 · 投入 ${(person.ratio * 100).toFixed(0)}%</span></span>
    <span class="badge ${person.load >= 1.2 ? "R" : person.load >= 0.6 ? "Y" : "G"}">${person.load.toFixed(2)}</span>
  </div>`;
}

// ─── Projects Gantt view ──────────────────────────────────────────────────────

export function projectsView() {
  const list = filteredProjects();
  const { groupBy, includeArchived } = state.filters;
  const groupOptions = [
    ["none", "不分组"],
    ["dept", "按部门"],
    ["owner", "按负责人"],
    ["rag", "按状态"],
  ];
  const groupLabel = groupOptions.find(([value]) => value === groupBy)?.[1] ?? "不分组";
  return `<section class="panel project-monitor">
      <div class="project-monitor-head">
        <div>
          <h2>关键里程碑监控</h2>
          <p class="muted">里程碑连续段甘特图 · 5场景算法 · 点击项目行查看详情</p>
        </div>
        <input id="project-search" placeholder="搜索项目、编号、负责人" />
      </div>
      <div class="gantt-toolbar">
        <div class="gantt-toolbar-label gantt-group-control">
          <span>分组</span>
          <button class="gantt-group-toggle" type="button" data-groupby-toggle aria-haspopup="listbox" aria-expanded="false">
            ${groupLabel}
          </button>
          <div class="gantt-group-menu" data-groupby-menu role="listbox" hidden>
            ${groupOptions.map(([value, label]) => `
              <button type="button"
                class="gantt-group-option${groupBy === value ? " active" : ""}"
                data-groupby-option="${value}"
                role="option"
                aria-selected="${groupBy === value}">
                ${label}
              </button>`).join("")}
          </div>
        </div>
        <label class="gantt-toolbar-label gantt-toolbar-check">
          <input type="checkbox" data-project-filter="includeArchived" ${includeArchived ? "checked" : ""}>
          包含已归档
        </label>
        <div class="granularity-chips">
          <span class="granularity-chip active" title="当前视图模式">月</span>
          <span class="granularity-chip disabled" title="v1.1 功能">周</span>
          <span class="granularity-chip disabled" title="v1.1 功能">季度</span>
        </div>
      </div>
      <div class="table-wrap" id="project-timeline-wrap">${timeline(list)}</div>
    </section>`;
}

export function timeline(list) {
  const today = state.today;

  if (!list.length) {
    return '<div class="monitor-board-empty">当前筛选条件下没有项目。</div>';
  }

  // Gather all segments to extend axis to include actual-completion dates
  const allSegs = list.flatMap(p => {
    const ms = milestones
      .filter(m => m.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return ms.length ? computeSegments(ms, p, today) : [];
  });

  const startDates = list.map(p => new Date(p.planned_start_date)).filter(d => !isNaN(d));
  const endDates = [
    ...list.map(p => new Date(p.planned_end_date)),
    ...allSegs.map(s => s.segEnd),
    today,
  ].filter(d => !isNaN(d));

  if (!startDates.length || !endDates.length) {
    return '<div class="monitor-board-empty">里程碑数据缺少日期。</div>';
  }

  const tlStart = monthStart(new Date(Math.min(...startDates.map(d => d.getTime()))));
  const tlEnd   = monthEnd(new Date(Math.max(...endDates.map(d => d.getTime()))));
  const totalMs = tlEnd.getTime() - tlStart.getTime();

  const months = [];
  for (let c = new Date(tlStart); c <= tlEnd; c = addMonths(c, 1)) {
    months.push(new Date(c));
  }

  // pct: Date → percentage of full timeline width (number, unclamped)
  function pct(date) {
    return (date.getTime() - tlStart.getTime()) / totalMs * 100;
  }
  function wPct(a, b) {
    return Math.max(0.4, (b.getTime() - a.getTime()) / totalMs * 100);
  }

  const showToday = today >= tlStart && today <= tlEnd;
  const todayLeft = showToday ? pct(today).toFixed(2) : "";

  const groups = groupProjects(list, today);
  const rows = groups.flatMap(g => [
    ...(g.key !== "__all__" ? [{ type: "group", group: g }] : []),
    ...g.projects.map(p => ({ type: "project", project: p })),
  ]);

  return `<div class="monitor-board">
    <div class="project-list-pane">
      <div class="project-list-head">项目列表</div>
      ${rows.map(row =>
        row.type === "group"
          ? groupRow(row.group)
          : projectListRow(row.project, today)
      ).join("")}
    </div>
    <div class="gantt-pane">
      <div class="gantt-scroll">
        <div class="gantt-canvas" style="--month-count:${months.length}">
          <div class="gantt-head">
            ${months.map(m => `<span>${monthLabel(m)}</span>`).join("")}
            ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
          </div>
          ${rows.map(row =>
            row.type === "group"
              ? ganttGroupRow(row.group, months)
              : ganttProjectRow(row.project, months, today, pct, wPct, showToday, todayLeft)
          ).join("")}
        </div>
      </div>
    </div>
  </div>`;
}

export function groupProjects(list, today = state.today) {
  const groupBy = state.filters?.groupBy ?? "none";

  function getKey(p) {
    if (groupBy === "dept")  return p.dept  || "未知部门";
    if (groupBy === "owner") return p.owner?.name || p.pm || "未知负责人";
    if (groupBy === "rag")   return projectRag(p, today);
    return "__all__";
  }

  const RAG_ORD = { R: 0, Y: 1, G: 2, gray: 3 };

  function sortWeight(p) {
    const rag = projectRag(p, today);
    const ms = milestones
      .filter(m => m.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const segs = ms.length ? computeSegments(ms, p, today) : [];
    const maxDev = Math.max(0, ...segs.filter(s => s.scenario === 2 || s.scenario === 4).map(s => s.deviationDays));
    return [RAG_ORD[rag] ?? 3, -maxDev];
  }

  const sorted = [...list].sort((a, b) => {
    const [ra, da] = sortWeight(a);
    const [rb, db] = sortWeight(b);
    return ra !== rb ? ra - rb : da - db;
  });

  const map = new Map();
  for (const p of sorted) {
    const key = getKey(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }

  const RAG_LABELS = { R: "红灯", Y: "黄灯", G: "绿灯", gray: "已归档" };
  return [...map.entries()].map(([key, ps]) => ({
    key,
    label: groupBy === "rag" ? (RAG_LABELS[key] ?? key) : key,
    redCount: ps.filter(p => projectRag(p, today) === "R").length,
    projects: ps,
  }));
}

export function groupRow(group) {
  const redBadge = group.redCount
    ? ` · <span class="red-count">${group.redCount} 红灯</span>`
    : "";
  return `<div class="project-group-row">
    <strong>${escapeHtml(group.label)}</strong>
    <span>${group.projects.length} 个项目${redBadge}</span>
  </div>`;
}

export function projectListRow(project, today = state.today) {
  const rag = projectRag(project, today);
  const tooltip = escapeHtml(`${project.code || project.id}: ${project.summary || project.name}`);
  const ownerName = escapeHtml(project.owner?.name || project.pm || "");
  return `<button class="project-list-row${project.archived ? " archived-row" : ""}"
      data-open-project="${project.id}"
      title="${tooltip}">
    <span class="rag-lamp ${rag}"></span>
    <span class="project-name">${escapeHtml(project.name)}</span>
    <span class="project-owner">
      <span class="owner-avatar">${project.owner?.avatar || "👤"}</span>${ownerName}
    </span>
  </button>`;
}

export function ganttGroupRow(group, months) {
  return `<div class="gantt-group-row">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
  </div>`;
}

export function ganttProjectRow(project, months, today, pct, wPct, showToday, todayLeft) {
  const ms = milestones
    .filter(m => m.projectId === project.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!ms.length) {
    return `<div class="gantt-project-row${project.archived ? " archived-row" : ""}">
      <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
      <span class="seg-empty-label muted">未配置里程碑</span>
    </div>`;
  }

  const segments = computeSegments(ms, project, today);
  const overflow = projectOverflowSegment(project, today);
  const msById = Object.fromEntries(ms.map(m => [m.id, m]));

  const overflowDiv = overflow
    ? `<div class="row-overflow-stripe" style="left:${Math.max(0, pct(overflow.overflowStart)).toFixed(2)}%;width:${wPct(overflow.overflowStart, overflow.overflowEnd).toFixed(2)}%"></div>`
    : "";

  const segDivs = segments
    .map((seg, i) => renderSegment(seg, msById[seg.milestoneId], project.id, pct, wPct, i < segments.length - 1))
    .join("");

  return `<div class="gantt-project-row${project.archived ? " archived-row" : ""}">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
    ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
    ${overflowDiv}
    ${segDivs}
  </div>`;
}

// Compute anchor position as % within the segment (not the full timeline)
function segPct(anchorDate, segStart, segEnd) {
  const segMs = segEnd.getTime() - segStart.getTime();
  if (segMs <= 0) return 0;
  return (anchorDate.getTime() - segStart.getTime()) / segMs * 100;
}

function renderSegment(seg, milestone, projectId, pct, wPct, addDivider) {
  const left  = Math.max(0, pct(seg.segStart)).toFixed(2);
  const width = wPct(seg.segStart, seg.segEnd).toFixed(2);

  let styleVal = `left:${left}%;width:${width}%`;
  if (seg.tone === "mixed" && seg.overdueGrowSplitAt) {
    const segMs = seg.segEnd.getTime() - seg.segStart.getTime();
    const ghostPct = segMs > 0
      ? Math.max(0, Math.min(100,
          (seg.overdueGrowSplitAt.getTime() - seg.segStart.getTime()) / segMs * 100
        )).toFixed(1)
      : "50";
    styleVal += `;--ghost-pct:${ghostPct}%`;
  }

  const plannedPct = segPct(seg.plannedAnchorAt, seg.segStart, seg.segEnd).toFixed(1);
  const actualPct  = seg.actualAnchorAt
    ? segPct(seg.actualAnchorAt, seg.segStart, seg.segEnd).toFixed(1)
    : null;
  const plannedAnchorClass = actualPct === null ? " seg-anchor-incomplete" : "";
  const plannedAnchor = actualPct === null
    ? `<span class="seg-anchor seg-anchor-planned${plannedAnchorClass}" style="left:${plannedPct}%"
          title="计划完成：${escapeHtml(milestone?.planned_end_date || "")}">◇</span>`
    : "";

  const name  = milestone?.name || "";
  const title = buildSegTitle(seg, milestone);

  const divider = addDivider
    ? `<div class="seg-divider" style="left:${pct(seg.segEnd).toFixed(2)}%"></div>`
    : "";

  return `<div class="gantt-segment seg-hue-${seg.hue} seg-tone-${seg.tone}"
       style="${styleVal}"
       data-open-project="${escapeHtml(projectId)}"
       data-milestone-id="${escapeHtml(seg.milestoneId)}"
       title="${escapeHtml(title)}">
    <span class="seg-label">${escapeHtml(name)}</span>
    ${plannedAnchor}
    ${actualPct !== null
      ? `<span class="seg-anchor seg-anchor-actual" style="left:${actualPct}%"
              title="实际完成：${escapeHtml(milestone?.actual_end_date || "")}">◆</span>`
      : ""}
  </div>${divider}`;
}

const SCENARIO_LABEL = ["", "按期完成", "延期完成", "未来在轨", "逾期未填", "工期被侵蚀"];

function buildSegTitle(seg, milestone) {
  if (!milestone) return "";
  const scenarioStr = SCENARIO_LABEL[seg.scenario] ?? `场景${seg.scenario}`;
  const devStr = seg.deviationDays !== 0
    ? ` · ${Math.abs(seg.deviationDays)} 天${seg.deviationDays < 0 ? "提前" : "延迟"}`
    : "";
  return `${milestone.name} [${scenarioStr}]${devStr}`;
}

// ─── Admin table view ─────────────────────────────────────────────────────────

export function projectRows(list) {
  return list.map(project => `<tr class="clickable" data-open-project="${project.id}">
    <td>${project.id}</td><td><strong>${project.name}</strong></td><td>${project.family}</td><td>${project.biz}</td><td>${project.pm}</td><td>${project.status}</td><td>${project.complexity}</td><td>${badge(project.health)}</td><td>${project.override ? badge(project.override) : '<span class="badge gray">无覆盖</span>'}</td><td>${project.overrideNote || "按系统状态展示"}</td>
  </tr>`).join("");
}

export function groupedProjectRows(projectList, field) {
  const rows = new Map();
  projectList.forEach(project => {
    const key = project[field] || "未归类";
    rows.set(key, (rows.get(key) || 0) + 1);
  });
  return [...rows.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// ─── Drawer (T7) ─────────────────────────────────────────────────────────────

const TAB_LABELS = { milestones: "里程碑", history: "变更历史", comments: "评论" };
const PLANNED_FIELD_LABELS = {
  planned_start_date: "计划开始", planned_end_date: "计划完成",
  actual_start_date:  "实际开始", actual_end_date:  "实际完成", name: "名称",
};

export function openProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  const today = state.today;
  const rag = projectRag(project, today);
  const res = projectResourceSummary(project);

  state.drawer.projectId = projectId;
  if (!["milestones", "history", "comments"].includes(state.drawer.activeTab)) {
    state.drawer.activeTab = "milestones";
  }

  const tabButtons = ["milestones", "history", "comments"].map(tab => `
    <button role="tab" class="drawer-tab-btn${state.drawer.activeTab === tab ? " active" : ""}"
      data-drawer-tab="${tab}" aria-selected="${state.drawer.activeTab === tab}">
      ${TAB_LABELS[tab]}
    </button>`).join("");

  $("#drawer").innerHTML = `
    <div class="drawer-header">
      <div>
        <p class="eyebrow">${escapeHtml(project.code || project.id)} · ${escapeHtml(project.dept)}</p>
        <h2>${escapeHtml(project.name)}</h2>
      </div>
      <button class="ghost-button" data-close-drawer>关闭</button>
    </div>
    <div class="detail-grid drawer-info-grid">
      ${detail("业务", escapeHtml(project.biz))}
      ${detail("负责人", escapeHtml(project.owner?.name || project.pm || "—"))}
      ${detail("计划期间", `${project.planned_start_date || "?"} → ${project.planned_end_date || "?"}`)}
      ${detail("项目健康", badge(rag))}
      ${detail("手动覆盖", project.override ? badge(project.override) : '<span class="badge gray">无</span>')}
      ${detail("阶段", escapeHtml(project.status || "—"))}
    </div>
    <div class="drawer-tabs" role="tablist">${tabButtons}</div>
    <div id="drawer-tab-content" role="tabpanel">
      ${drawerTabContent(projectId, state.drawer.activeTab, today)}
    </div>
    <div class="drawer-resource-card panel">
      <h3 style="margin-bottom:10px">资源摘要</h3>
      <div class="detail-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
        ${detail("产品", `${res.产品} 人`)}
        ${detail("项目管理", `${res.项目} 人`)}
        ${detail("开发", `${res.开发} 人`)}
      </div>
      <button class="ghost-button" data-goto-matrix="${escapeHtml(projectId)}">查看资源详情 →</button>
    </div>
  `;
  $("#drawer-backdrop").hidden = false;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

// Renders the active tab's body — called by openProject and by shell.js on tab switch
export function drawerTabContent(projectId, activeTab, today = state.today) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return "";

  const ms = milestones
    .filter(m => m.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const msIds = new Set(ms.map(m => m.id));
  const msById = Object.fromEntries(ms.map(m => [m.id, m]));

  // ── Tab: 里程碑 ──────────────────────────────────────────────────────────
  if (activeTab === "milestones") {
    if (!ms.length) return '<p class="muted" style="padding:16px">该项目暂无里程碑数据。</p>';
    const segments = computeSegments(ms, project, today);
    const segByMid = Object.fromEntries(segments.map(s => [s.milestoneId, s]));
    const SCENARIO_ICON = ["", "①", "②", "③", "④", "⑤"];

    const rows = ms.map((m, i) => {
      const seg = segByMid[m.id];
      const icon = SCENARIO_ICON[seg?.scenario] ?? "—";
      const hue = seg?.hue ?? "gray";
      const dev = seg && seg.deviationDays !== 0
        ? `${seg.deviationDays > 0 ? "+" : ""}${seg.deviationDays}d`
        : "—";
      const devClass = seg && seg.deviationDays > 0 ? "text-red" : "muted";
      return `<tr>
        <td class="muted" style="width:28px">${i + 1}</td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td data-planned-cell="${escapeHtml(m.id)}:planned_start_date">${m.planned_start_date || "—"}</td>
        <td data-planned-cell="${escapeHtml(m.id)}:planned_end_date">${m.planned_end_date}</td>
        <td><input type="date" class="date-input-inline"
              data-actual-start="${escapeHtml(m.id)}"
              value="${m.actual_start_date || ""}"></td>
        <td><input type="date" class="date-input-inline"
              data-actual-end="${escapeHtml(m.id)}"
              value="${m.actual_end_date || ""}"></td>
        <td><span class="badge seg-badge-${hue}" title="${escapeHtml(buildSegTitle(seg, m))}">${icon}</span></td>
        <td class="${devClass}">${dev}</td>
        <td>
          <button class="small-button" data-edit-planned="${escapeHtml(m.id)}:planned_start_date">改开始</button>
          <button class="small-button" data-edit-planned="${escapeHtml(m.id)}:planned_end_date">改完成</button>
        </td>
      </tr>`;
    }).join("");

    return `<div class="table-wrap">
      <table class="milestone-detail-table">
        <thead><tr>
          <th>#</th><th>里程碑</th><th>计划开始</th><th>计划完成</th>
          <th>实际开始</th><th>实际完成</th>
          <th>场景</th><th>偏差</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  // ── Tab: 变更历史 ─────────────────────────────────────────────────────────
  if (activeTab === "history") {
    const logs = milestoneChangeLogs
      .filter(cl => msIds.has(cl.milestoneId))
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

    if (!logs.length) return '<p class="muted" style="padding:16px">暂无变更历史记录。</p>';

    const items = logs.map(cl => {
      const m = msById[cl.milestoneId];
      const at = new Date(cl.changedAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" });
      const fieldLabel = PLANNED_FIELD_LABELS[cl.field] ?? cl.field;
      return `<div class="history-item">
        <div class="history-meta muted">
          <span>${at}</span> · <span>${escapeHtml(m?.name || cl.milestoneId)}</span>
          · <span>${fieldLabel}</span>
        </div>
        <div class="history-change">
          <span class="badge gray">${escapeHtml(cl.oldValue ?? "—")}</span>
          <span class="muted">→</span>
          <span class="badge gray">${escapeHtml(cl.newValue ?? "—")}</span>
        </div>
        ${cl.reason ? `<p class="history-reason">${escapeHtml(cl.reason)}</p>` : ""}
      </div>`;
    }).join("");

    return `<div class="history-list">${items}</div>`;
  }

  // ── Tab: 评论 ─────────────────────────────────────────────────────────────
  if (activeTab === "comments") {
    const projectComments = comments
      .filter(c => c.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const commentItems = projectComments.length
      ? projectComments.map(c => {
          const at = new Date(c.createdAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" });
          return `<div class="comment-item">
            <div class="comment-meta">
              <strong>${escapeHtml(c.authorName)}</strong>
              <span class="muted">${at}</span>
            </div>
            <p class="comment-body">${escapeHtml(c.body)}</p>
          </div>`;
        }).join("")
      : '<p class="muted">暂无评论。</p>';

    return `<div class="comments-section">
      <div class="comment-list">${commentItems}</div>
      <div class="comment-form">
        <textarea id="comment-input" class="comment-textarea" rows="3"
          placeholder="添加评论…"></textarea>
        <div class="actions" style="margin-top:8px">
          <button class="primary-button" data-submit-comment="${escapeHtml(projectId)}">提交评论</button>
        </div>
      </div>
    </div>`;
  }

  return "";
}
