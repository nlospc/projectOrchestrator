import { comments, milestoneChangeLogs, milestones, projects } from "../core/data-store.js";
import {
  $, addMonths, addQuarters, addWeeks, badge, detail, effectiveHealth, escapeHtml, kpi,
  monthEnd, monthLabel, monthStart, quarterEnd, quarterLabel, quarterStart,
  weekEnd, weekLabel, weekStart,
} from "../core/utils.js";
import { computeSegments } from "../core/milestones.js";
import {
  filteredProjects, overviewMetrics,
  projectOverflowSegment, projectRag, projectResourceSummary,
  projectsViewMetrics,
} from "../core/selectors.js";
import { state } from "../state/app-state.js";

// ─── 管理概览 (Dashboard v2) ──────────────────────────────────────────────────

export function dashboardView() {
  const m = overviewMetrics();
  const { confidence, headline, decisions, signals, wave, concentration, workforce, deltas } = m;
  const ragTotal = confidence.red + confidence.yellow + confidence.green;
  const totalPeople = workforce.low + workforce.mid + workforce.high;

  return `
    <div class="headline-strip">
      <span class="headline-main">${headline.total} 个项目</span>
      <span class="headline-sep">·</span>
      <span class="headline-stat">
        信心 <span class="val">${headline.confPct}</span><span class="overview-kpi-unit">%</span>
        ${deltaChip(deltas.confidence_index, true)}
      </span>
      <span class="headline-sep">·</span>
      <span class="headline-stat">
        <span class="val${headline.decisionCount > 0 ? " danger" : ""}">${headline.decisionCount}</span> 个需本周决策
      </span>
      <span class="headline-sep">·</span>
      <span class="headline-stat">
        <span class="val${headline.d30 > 0 ? " warning" : ""}">${headline.d30}</span> 个里程碑 ≤30天
      </span>
    </div>

    <div class="overview-kpi-strip">
      <div class="overview-kpi-card accent">
        <span class="overview-kpi-label">交付信心指数</span>
        <div class="overview-kpi-main">
          <span class="overview-kpi-value">${headline.confPct}<span class="overview-kpi-unit">%</span></span>
          ${deltaChip(deltas.confidence_index, true)}
        </div>
        <span class="overview-kpi-sub">绿灯 ${confidence.green} · 黄灯 ${confidence.yellow} · 红灯 ${confidence.red}</span>
      </div>
      <div class="overview-kpi-card">
        <span class="overview-kpi-label">红灯项目</span>
        <div class="overview-kpi-main">
          <span class="overview-kpi-value" style="color:var(--red)">${confidence.red}</span>
          ${deltaChip(deltas.red, false)}
        </div>
        <span class="overview-kpi-sub">vs 上批次</span>
      </div>
      <div class="overview-kpi-card">
        <span class="overview-kpi-label">30天内到期里程碑</span>
        <div class="overview-kpi-main">
          <span class="overview-kpi-value" style="color:var(--orange)">${wave.d30}</span>
          ${deltaChip(deltas.wave_d30, false)}
        </div>
        <span class="overview-kpi-sub">未完成里程碑</span>
      </div>
      <div class="overview-kpi-card">
        <span class="overview-kpi-label">超负荷人员</span>
        <div class="overview-kpi-main">
          <span class="overview-kpi-value" style="color:var(--red)">${workforce.high}</span>
          ${deltaChip(deltas.overloaded, false)}
        </div>
        <span class="overview-kpi-sub">负荷 ≥ 1.2 / ${totalPeople} 人</span>
      </div>
      <div class="overview-kpi-card">
        <span class="overview-kpi-label">单点故障项目</span>
        <div class="overview-kpi-main">
          <span class="overview-kpi-value" style="color:var(--red)">${concentration.bf1Count}</span>
          ${deltaChip(deltas.bf1_count, false)}
        </div>
        <span class="overview-kpi-sub">Bus Factor = 1</span>
      </div>
    </div>

    <div class="overview-panels">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">需要你决策 · 风险项目</span>
          ${decisions.length ? `<span class="panel-badge warn">${decisions.length} 个需关注</span>` : '<span class="panel-badge ok">无风险</span>'}
        </div>
        ${decisions.length ? `<table class="decision-table">
          <thead><tr><th>项目</th><th>滑点里程碑</th><th>下一节点</th><th class="text-right">滑点</th></tr></thead>
          <tbody>${decisions.map((r, i) => `<tr class="clickable" data-open-project="${escapeHtml(r.projectId)}">
              <td><span class="risk-rank">${i + 1}</span><span class="rag-tag ${r.rag}"></span><span class="project-name">${escapeHtml(r.projectName)}</span><div class="owner-line">${escapeHtml(r.owner)} · ${escapeHtml(r.dept)}</div></td>
              <td><span class="milestone-name">${escapeHtml(r.milestoneName)}</span></td>
              <td><span class="next-date">${r.nextDate ? r.nextDate.slice(5) : "--"}</span></td>
              <td style="text-align:right"><span class="slip-chip${r.slipDays < 10 ? " moderate" : ""}">${r.slipDays}d</span></td>
            </tr>`).join("")}</tbody>
        </table>` : '<div class="empty-state"><span class="empty-icon">✓</span><p>当前筛选范围内暂无风险项目</p></div>'}
      </div>

      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">快速信号</span>
          <span class="panel-badge info">概览</span>
        </div>
        <div class="signal-grid">
          <div class="signal-row clickable" data-action="health-filter" data-value="">
            <div class="signal-label">
              <span class="signal-title">健康分布</span>
              <span class="signal-sub">RAG 红/黄/绿</span>
            </div>
            <div class="confidence-donut-wrap">
              ${overviewDonut(confidence, ragTotal)}
              <div class="rag-legend">
                <span class="rag-legend-item clickable" data-action="health-filter" data-value="R"><span class="rag-dot R"></span>${confidence.red} 红灯</span>
                <span class="rag-legend-item clickable" data-action="health-filter" data-value="Y"><span class="rag-dot Y"></span>${confidence.yellow} 黄灯</span>
                <span class="rag-legend-item clickable" data-action="health-filter" data-value="G"><span class="rag-dot G"></span>${confidence.green} 绿灯</span>
              </div>
            </div>
          </div>
          <div class="signal-row clickable" data-route="workload">
            <div class="signal-label">
              <span class="signal-title">超分配人员</span>
              <span class="signal-sub">投入度 &gt; 100%</span>
            </div>
            <span class="signal-value${signals.overAllocated > 0 ? " warning" : ""}">${signals.overAllocated}</span>
          </div>
          <div class="signal-row clickable" data-route="busfactor">
            <div class="signal-label">
              <span class="signal-title">关键人员风险</span>
              <span class="signal-sub">BF≤2 项目 SPOF 贡献者</span>
            </div>
            <span class="signal-value${signals.keyPersonCount > 0 ? " danger" : ""}">${signals.keyPersonCount}</span>
          </div>
          <div class="signal-row clickable" data-route="projects">
            <div class="signal-label">
              <span class="signal-title">60天内里程碑</span>
              <span class="signal-sub">含 ≤30天的 ${wave.d30} 个</span>
            </div>
            <span class="signal-value" style="color:var(--primary)">${signals.d60}</span>
          </div>
          <div class="signal-row clickable" data-route="workload">
            <div class="signal-label">
              <span class="signal-title">正常负荷人员</span>
              <span class="signal-sub">负荷 &lt; 0.6</span>
            </div>
            <span class="signal-value ok">${signals.healthyCount}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="snapshot-footer">
      <span>数据快照 · ${m.snapshot.importedAt ? m.snapshot.importedAt : "--"} · vs 上批次 ${m.snapshot.previousBatch || "--"}</span>
    </div>`;
}

function deltaChip(value, goodWhenPositive) {
  if (value == null) return "";
  if (value === 0) return '<span class="delta neutral">—</span>';
  const arrow = value > 0 ? "↑" : "↓";
  const abs = Math.abs(value);
  const isGood = goodWhenPositive ? value > 0 : value < 0;
  return `<span class="delta ${isGood ? "good" : "bad"}">${arrow}${abs}</span>`;
}

function overviewDonut(confidence, total) {
  if (!total) return "";
  const r = 15.915;
  const redPct = (confidence.red / total) * 100;
  const yellowPct = (confidence.yellow / total) * 100;
  const greenPct = (confidence.green / total) * 100;
  const offset = 25;
  return `<svg class="rag-donut" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--gray-bg)" stroke-width="3.5"></circle>
    ${redPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--red)" stroke-width="3.5" stroke-dasharray="${redPct} ${100 - redPct}" stroke-dashoffset="${offset}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${yellowPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--yellow)" stroke-width="3.5" stroke-dasharray="${yellowPct} ${100 - yellowPct}" stroke-dashoffset="${offset - redPct}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${greenPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-dasharray="${greenPct} ${100 - greenPct}" stroke-dashoffset="${offset - redPct - yellowPct}" transform="rotate(-90 18 18)"></circle>` : ""}
  </svg>`;
}

function projectsMiniDonut(metrics) {
  const total = metrics.red + metrics.yellow + metrics.green;
  if (!total) return "";
  const r = 15.915;
  const redPct = (metrics.red / total) * 100;
  const yellowPct = (metrics.yellow / total) * 100;
  const greenPct = (metrics.green / total) * 100;
  const offset = 25;
  return `<svg class="rag-donut-mini" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--gray-bg)" stroke-width="3"></circle>
    ${redPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--red)" stroke-width="3" stroke-dasharray="${redPct} ${100 - redPct}" stroke-dashoffset="${offset}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${yellowPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--yellow)" stroke-width="3" stroke-dasharray="${yellowPct} ${100 - yellowPct}" stroke-dashoffset="${offset - redPct}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${greenPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--green)" stroke-width="3" stroke-dasharray="${greenPct} ${100 - greenPct}" stroke-dashoffset="${offset - redPct - yellowPct}" transform="rotate(-90 18 18)"></circle>` : ""}
  </svg>`;
}

// ─── Projects Gantt view ──────────────────────────────────────────────────────

const SORT_OPTIONS = [
  ["default", "RAG + 偏差"],
  ["deviation", "最大偏差↓"],
  ["next-date", "最近里程碑↑"],
  ["name", "项目名称↑"],
];

export function projectsView() {
  const list = filteredProjects();
  const metrics = projectsViewMetrics(list);
  const { groupBy, includeArchived, granularity = "month", sortBy = "default" } = state.filters;
  const groupOptions = [
    ["none", "不分组"],
    ["dept", "按部门"],
    ["owner", "按负责人"],
    ["rag", "按状态"],
  ];
  const groupLabel = groupOptions.find(([value]) => value === groupBy)?.[1] ?? "不分组";
  const sortLabel = SORT_OPTIONS.find(([value]) => value === sortBy)?.[1] ?? "RAG + 偏差";
  return `<div class="projects-hero-strip">
    <div class="projects-hero-stat">
      <span class="hero-num">${metrics.total}</span>
      <span class="hero-unit">个项目</span>
    </div>
    <div class="hero-sep"></div>
    <div class="rag-mini-group">
      ${projectsMiniDonut(metrics)}
      <span class="rag-mini clickable" data-action="health-filter" data-value="R"><span class="dot R"></span>${metrics.red}</span>
      <span class="rag-mini clickable" data-action="health-filter" data-value="Y"><span class="dot Y"></span>${metrics.yellow}</span>
      <span class="rag-mini clickable" data-action="health-filter" data-value="G"><span class="dot G"></span>${metrics.green}</span>
    </div>
    <div class="hero-sep"></div>
    ${metrics.slippingCount > 0
      ? `<div class="hero-alert-chip slip">${metrics.slippingCount} 个滑点里程碑 · 最大 +${metrics.maxDeviation}d</div>`
      : ""}
    ${metrics.milestonesDue30 > 0
      ? `<div class="hero-alert-chip due">${metrics.milestonesDue30} 个 ≤30天到期</div>`
      : ""}
  </div>
  <section class="panel project-monitor">
      <div class="project-monitor-head">
        <div>
          <h2>关键里程碑监控</h2>
          <p class="muted">里程碑连续段甘特图 · 5场景算法 · 点击项目行查看详情</p>
        </div>
        <div class="project-search-wrap">
          <input id="project-search" placeholder="搜索项目、编号、负责人" autocomplete="off" />
          <button class="search-clear-btn" data-action="clear-search" hidden aria-label="清除搜索">✕</button>
        </div>
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
        <div class="gantt-toolbar-label gantt-group-control">
          <span>排序</span>
          <button class="gantt-group-toggle" type="button" data-sortby-toggle aria-haspopup="listbox" aria-expanded="false">
            ${sortLabel}
          </button>
          <div class="gantt-group-menu" data-sortby-menu role="listbox" hidden>
            ${SORT_OPTIONS.map(([value, label]) => `
              <button type="button"
                class="gantt-group-option${sortBy === value ? " active" : ""}"
                data-sortby-option="${value}"
                role="option"
                aria-selected="${sortBy === value}">
                ${label}
              </button>`).join("")}
          </div>
        </div>
        <label class="gantt-toolbar-label gantt-toolbar-check">
          <input type="checkbox" data-project-filter="includeArchived" ${includeArchived ? "checked" : ""}>
          包含已归档
        </label>
        <button class="ghost-button gantt-today-btn" type="button" data-action="center-today">今天</button>
        <div class="granularity-chips">
          <span class="granularity-chip${granularity === "week" ? " active" : ""}" data-granularity="week">周</span>
          <span class="granularity-chip${granularity === "month" ? " active" : ""}" data-granularity="month">月</span>
          <span class="granularity-chip${granularity === "quarter" ? " active" : ""}" data-granularity="quarter">季</span>
        </div>
      </div>
      <div class="seg-legend">
        <span style="font-weight:600;margin-right:4px">图例</span>
        <span class="seg-legend-item"><span class="seg-legend-swatch solid-green"></span>按期完成</span>
        <span class="seg-legend-item"><span class="seg-legend-swatch ghost-green"></span>未来在轨</span>
        <span class="seg-legend-item"><span class="seg-legend-swatch ghost-amber"></span>延期完成</span>
        <span class="seg-legend-item"><span class="seg-legend-swatch solid-red"></span>逾期未填</span>
        <span class="seg-legend-item"><span class="seg-legend-swatch solid-gray"></span>已归档</span>
      </div>
      <div class="table-wrap" id="project-timeline-wrap">${timeline(list)}</div>
    </section>`;
}

function getAxisConfig(granularity) {
  if (granularity === "week") {
    return { periodStart: weekStart, periodEnd: weekEnd, step: d => addWeeks(d, 1), label: weekLabel, tickMinPx: 72 };
  }
  if (granularity === "quarter") {
    return { periodStart: quarterStart, periodEnd: quarterEnd, step: d => addQuarters(d, 1), label: quarterLabel, tickMinPx: 240 };
  }
  return { periodStart: monthStart, periodEnd: monthEnd, step: d => addMonths(d, 1), label: d => `${monthLabel(d)} ${d.getFullYear()}`, tickMinPx: 132 };
}

export function timeline(list) {
  const today = state.today;

  if (!list.length) {
    return '<div class="monitor-board-empty">当前筛选条件下没有项目。</div>';
  }

  const allSegs = list.flatMap(p => {
    const ms = milestones
      .filter(m => m.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return ms.length ? computeSegments(ms, p, today) : [];
  });

  const startDates = [
    ...list.filter(p => p.planned_start_date).map(p => new Date(p.planned_start_date)),
    ...allSegs.map(s => s.segStart),
  ].filter(d => !isNaN(d));
  const endDates = [
    ...list.filter(p => p.planned_end_date).map(p => new Date(p.planned_end_date)),
    ...allSegs.map(s => s.segEnd),
    today,
  ].filter(d => !isNaN(d));

  if (!startDates.length || !endDates.length) {
    return '<div class="monitor-board-empty">里程碑数据缺少日期。</div>';
  }

  const axis = getAxisConfig(state.filters.granularity ?? "month");
  const tlStart = axis.periodStart(new Date(Math.min(...startDates.map(d => d.getTime()))));
  const tlEnd   = axis.periodEnd(new Date(Math.max(...endDates.map(d => d.getTime()))));
  const totalMs = tlEnd.getTime() - tlStart.getTime();

  const ticks = [];
  for (let c = new Date(tlStart); c <= tlEnd; c = axis.step(c)) {
    ticks.push(new Date(c));
  }

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

  const bodyCells = rows.map(row =>
    row.type === "group"
      ? groupRow(row.group) + ganttGroupRow(row.group, ticks)
      : projectListRow(row.project, today) +
        ganttProjectRow(row.project, ticks, today, pct, wPct, showToday, todayLeft)
  ).join("");

  return `<div class="monitor-board" data-monitor-board style="--month-count:${ticks.length};--tick-min-px:${axis.tickMinPx}px">
    <div class="monitor-grid">
      <div class="project-list-head mb-corner">项目列表</div>
      <div class="gantt-header mb-monthhead">
        <div class="gantt-head">
          ${ticks.map(t => `<span>${axis.label(t)}</span>`).join("")}
          ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
        </div>
      </div>
      ${bodyCells}
    </div>
  </div>`;
}

export function groupProjects(list, today = state.today) {
  const groupBy = state.filters?.groupBy ?? "none";

  function getKey(p) {
    if (groupBy === "dept")  return p.dept  || "未知部门";
    if (groupBy === "owner") return projectProductManagerName(p) || "未知负责人";
    if (groupBy === "rag")   return projectRag(p, today);
    return "__all__";
  }

  const RAG_ORD = { R: 0, Y: 1, G: 2, gray: 3 };

  function projectMaxDev(p) {
    const ms = milestones.filter(m => m.projectId === p.id).sort((a, b) => a.sortOrder - b.sortOrder);
    const segs = ms.length ? computeSegments(ms, p, today) : [];
    return Math.max(0, ...segs.filter(s => s.scenario === 2 || s.scenario === 4).map(s => s.deviationDays));
  }

  function sortWeight(p) {
    return [RAG_ORD[projectRag(p, today)] ?? 3, -projectMaxDev(p)];
  }

  function nextMilestoneDate(p) {
    const upcoming = milestones
      .filter(m => m.projectId === p.id && !m.actual_end_date)
      .sort((a, b) => new Date(a.planned_end_date) - new Date(b.planned_end_date));
    return upcoming.length ? new Date(upcoming[0].planned_end_date) : new Date(9999, 0, 1);
  }

  const sortBy = state.filters?.sortBy ?? "default";
  let sorted;
  if (sortBy === "name") {
    sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, "zh"));
  } else if (sortBy === "deviation") {
    sorted = [...list].sort((a, b) => projectMaxDev(b) - projectMaxDev(a));
  } else if (sortBy === "next-date") {
    sorted = [...list].sort((a, b) => nextMilestoneDate(a) - nextMilestoneDate(b));
  } else {
    sorted = [...list].sort((a, b) => {
      const [ra, da] = sortWeight(a);
      const [rb, db] = sortWeight(b);
      return ra !== rb ? ra - rb : da - db;
    });
  }

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
    yellowCount: ps.filter(p => projectRag(p, today) === "Y").length,
    greenCount: ps.filter(p => projectRag(p, today) === "G").length,
    projects: ps,
  }));
}

export function groupRow(group) {
  const rc = group.redCount || 0;
  const yc = group.yellowCount || 0;
  const gc = group.greenCount || 0;
  const dots = [
    rc > 0 ? `<span class="mini-rag"><span class="dot R"></span>${rc}</span>` : "",
    yc > 0 ? `<span class="mini-rag"><span class="dot Y"></span>${yc}</span>` : "",
    gc > 0 ? `<span class="mini-rag"><span class="dot G"></span>${gc}</span>` : "",
  ].filter(Boolean).join("");
  return `<div class="project-group-row">
    <strong>${escapeHtml(group.label)}</strong>
    <div class="group-meta">
      <span>${group.projects.length} 个项目</span>
      <div class="group-rag-dots">${dots}</div>
    </div>
  </div>`;
}

export function projectListRow(project, today = state.today) {
  const rag = projectRag(project, today);
  const tooltip = escapeHtml(`${project.code || project.id}: ${project.summary || project.name}`);
  const ownerName = escapeHtml(projectProductManagerName(project));
  const ms = milestones
    .filter(m => m.projectId === project.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const segs = ms.length ? computeSegments(ms, project, today) : [];
  const maxDev = Math.max(0, ...segs.filter(s => s.scenario === 2 || s.scenario === 4).map(s => s.deviationDays));
  const devChip = maxDev > 0
    ? `<span class="deviation-chip ${rag === "R" ? "slip" : "warn"}">+${maxDev}d</span>`
    : "";
  return `<button class="project-list-row${project.archived ? " archived-row" : ""}"
      data-open-project="${project.id}"
      title="${tooltip}">
    <span class="rag-lamp ${rag}"></span>
    <div class="project-info">
      <div class="project-name">${escapeHtml(project.name)}</div>
      <div class="project-sub">${escapeHtml(project.dept || "")} · ${escapeHtml(project.biz || "")}</div>
    </div>
    <div class="project-right">
      <span class="project-owner-name">${ownerName}</span>
      ${devChip}
    </div>
  </button>`;
}

function projectProductManagerName(project) {
  return normalizePersonList(project.product || project.owner?.name || project.pm || "");
}

function normalizePersonList(value) {
  return String(value || "")
    .replace(/[、,，]+/g, "、")
    .replace(/^、|、$/g, "");
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

  const isNarrow = parseFloat(width) < 3;
  return `<div class="gantt-segment seg-hue-${seg.hue} seg-tone-${seg.tone}${isNarrow ? " seg-narrow" : ""}"
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
    <div class="panel override-editor" style="margin:12px 0;padding:12px">
      <h3 style="margin-bottom:8px;font-size:14px">手动健康度覆盖</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="override-health-select">
          ${[["", "无覆盖（按系统）"], ["G", "G 绿"], ["Y", "Y 黄"], ["R", "R 红"]]
            .map(([v, label]) => `<option value="${v}"${(project.override || "") === v ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
        <input id="override-note-input" type="text" placeholder="覆盖原因（可选）"
          value="${escapeHtml(project.overrideNote || "")}" style="flex:1;min-width:160px">
        <button class="primary-button" data-action="save-override"
          data-project-id="${escapeHtml(projectId)}">保存覆盖</button>
      </div>
    </div>
    <div class="drawer-tabs" role="tablist">${tabButtons}</div>
    <div id="drawer-tab-content" role="tabpanel">
      ${drawerTabContent(projectId, state.drawer.activeTab, today)}
    </div>
    <div class="drawer-resource-card panel">
      <h3 style="margin-bottom:10px">资源摘要</h3>
      ${res.unmatched
        ? `<p class="muted" style="margin-bottom:12px">无资源数据 — 该项目暂未关联资源团队</p>`
        : `<div class="detail-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
            ${detail("产品", `${res.产品} 人`)}
            ${detail("项目管理", `${res.项目} 人`)}
            ${detail("开发", `${res.开发} 人`)}
          </div>`}
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
