import { allocations, projects } from "../core/data-store.js";
import { roleWeights, statusWeights } from "../data/mock-data.js";
import { csvValue, downloadTextFile } from "../core/files.js";
import { $, badge, detail, escapeHtml, kpi, loadClass, loadFor, unique } from "../core/utils.js";
import { personStats, projectAllocations, resourceProjects } from "../core/selectors.js";
import { state } from "../state/app-state.js";

export function resourceOverviewView() {
  const list = resourceProjects();
  const stats = personStats(list);
  const all = projectAllocations(list);
  const people = resourcePeopleStats(list);
  const overallocated = people.filter((p) => p.ratio > 1).sort((a, b) => b.ratio - a.ratio);
  const projectCount = list.length;
  const activeProjects = list.filter((p) => p.status !== '项目暂停').length;
  const high = stats.filter((p) => p.load >= 1.2).length;
  const mid = stats.filter((p) => p.load >= 0.6 && p.load < 1.2).length;
  const low = stats.filter((p) => p.load < 0.6).length;
  const totalPeople = people.length;
  const outsourcedCount = people.filter((p) => p.outsourced).length;
  const internalCount = totalPeople - outsourcedCount;
  const internalPct = totalPeople ? Math.round((internalCount / totalPeople) * 100) : 0;
  const externalPct = totalPeople ? 100 - internalPct : 0;
  const busyPeople = [...people].sort((a, b) => b.load - a.load).slice(0, 10);
  const roleCompositionRows = roleComposition(all);
  const systems = systemRows(list);
  const maxSysPeople = Math.max(...systems.map((s) => s.people.length), 1);
  const bfRows = busFactorRows();
  const bf1Count = bfRows.filter((r) => r.risk === 'R').length;

  return `<div class="resource-workspace resource-overview-v2">
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">总人数</span>
        <span class="hero-value">${totalPeople}</span>
        <span class="hero-sub">内部 ${internalCount} · 外包 ${outsourcedCount} (${externalPct}%)</span>
      </div>
      <div class="hero-card clickable" data-route="matrix">
        <span class="hero-label">覆盖系统</span>
        <span class="hero-value">${systems.length}</span>
        <span class="hero-sub">系统/平台</span>
      </div>
      <div class="hero-card clickable" data-route="matrix">
        <span class="hero-label">参与项目</span>
        <span class="hero-value">${projectCount}</span>
        <span class="hero-sub">活跃 ${activeProjects} 个</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">高负荷人员</span>
        <span class="hero-value${high > 0 ? ' text-danger' : ''}">${high}</span>
        <span class="hero-sub">load ≥ 1.2</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">超分配人员</span>
        <span class="hero-value${overallocated.length > 0 ? ' text-danger' : ''}">${overallocated.length}</span>
        <span class="hero-sub">Σ 工时 > 100%</span>
      </div>
    </div>

    ${resourceFilterBar()}

    <div class="resource-section-label">系统/平台 资源分布</div>
    <div class="panel-row full">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">按系统/平台 — 人员投入排名</span>
          <span class="panel-badge info">Top ${Math.min(systems.length, 12)} / ${systems.length} 系统</span>
        </div>
        <div class="sys-dist-head">
          <span>系统</span><span>人员规模</span><span>人数</span><span>项目</span><span>投入率</span>
        </div>
        <div class="sys-dist-list">
          ${systems.slice(0, 12).map((row) => `<div class="sys-dist-row" data-resource-filter-system="${escapeHtml(row.system)}">
            <span class="sys-dist-name" title="${escapeHtml(row.system)}">${escapeHtml(row.system)}</span>
            <span class="sys-dist-bar"><span class="sys-dist-bar-fill" style="width:${Math.max(4, Math.round((row.people.length / maxSysPeople) * 100))}%"></span></span>
            <span class="sys-dist-meta"><strong>${row.people.length}</strong></span>
            <span class="sys-dist-meta">${row.projects.length}</span>
            <span class="sys-dist-meta">${Math.round(row.ratio * 100)}%</span>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="resource-section-label">技能构成 & 人力来源</div>
    <div class="panel-row">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">角色构成</span>
          <span class="panel-badge info">${roleCompositionRows.length} 个角色</span>
        </div>
        ${rolePieChart(roleCompositionRows)}
      </div>
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">内部 / 外包 & 人力利用率</span>
        </div>
        <div class="panel-sub-label">人力来源构成</div>
        <div class="source-split-bar">
          <div class="source-split-seg internal" style="width:${internalPct}%">${internalCount} 内部</div>
          <div class="source-split-seg external" style="width:${externalPct}%">${outsourcedCount} 外包</div>
        </div>
        <div class="source-split-legend">
          <span><span class="source-split-dot" style="background:var(--primary)"></span> 内部 ${internalPct}%</span>
          <span><span class="source-split-dot" style="background:var(--primary-2)"></span> 外包 ${externalPct}%</span>
        </div>
        <hr class="panel-divider">
        <div class="panel-sub-label">人力利用率分布</div>
        <div class="workforce-grid">
          <div class="workforce-stat">
            <div class="workforce-value" style="color: var(--green);">${low}</div>
            <div class="workforce-bar"><div class="workforce-fill G" style="width: ${totalPeople ? Math.round((low / totalPeople) * 100) : 0}%;"></div></div>
            <div class="workforce-label">正常负荷<br><span>&lt; 0.6</span></div>
          </div>
          <div class="workforce-stat">
            <div class="workforce-value" style="color: var(--yellow);">${mid}</div>
            <div class="workforce-bar"><div class="workforce-fill Y" style="width: ${totalPeople ? Math.round((mid / totalPeople) * 100) : 0}%;"></div></div>
            <div class="workforce-label">中等负荷<br><span>0.6 – 1.2</span></div>
          </div>
          <div class="workforce-stat">
            <div class="workforce-value" style="color: var(--red);">${high}</div>
            <div class="workforce-bar"><div class="workforce-fill R" style="width: ${totalPeople ? Math.round((high / totalPeople) * 100) : 0}%;"></div></div>
            <div class="workforce-label">超负荷<br><span>≥ 1.2</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="resource-section-label">集中度 & 负荷热点</div>
    <div class="panel-row">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">集中度风险</span>
          ${bf1Count > 0 || overallocated.length > 0 ? '<span class="panel-badge warn">需关注</span>' : '<span class="panel-badge info">正常</span>'}
        </div>
        <div class="conc-stats">
          <div class="conc-stat clickable" data-route="busfactor">
            <div class="conc-stat-value${bf1Count > 0 ? ' danger' : ''}">${bf1Count}</div>
            <div class="conc-stat-label">BF=1 项目<br>(单点故障)</div>
          </div>
          <div class="conc-stat clickable" data-route="workload">
            <div class="conc-stat-value${overallocated.length > 0 ? ' warning' : ''}">${overallocated.length}</div>
            <div class="conc-stat-label">超分配人员<br>(投入 &gt; 100%)</div>
          </div>
          <div class="conc-stat clickable" data-route="workload">
            <div class="conc-stat-value${high > 0 ? ' danger' : ''}">${high}</div>
            <div class="conc-stat-label">超负荷人员<br>(负荷 ≥ 1.2)</div>
          </div>
        </div>
        <hr class="panel-divider">
        <div class="panel-sub-label">超分配告警 — 工时占比 > 100%</div>
        ${overallocated.length ? `<div class="overalloc-chip-list">
          ${overallocated.slice(0, 5).map((p) => `<button class="overalloc-chip ${p.ratio >= 1.5 ? 'severe' : 'moderate'}" data-open-person="${escapeHtml(p.person)}">${escapeHtml(p.person)} ${Math.round(p.ratio * 100)}%</button>`).join('')}
          ${overallocated.length > 5 ? `<span class="muted" style="align-self:center">+${overallocated.length - 5} 人</span>` : ''}
        </div>` : '<p class="muted">当前筛选范围内没有超分配人员。</p>'}
      </div>
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">忙闲排行 Top 10</span>
          <button class="panel-badge info" style="cursor:pointer;border:none;background:var(--gray-bg);color:var(--muted)" data-route="workload">→ 查看热力</button>
        </div>
        <div class="busy-list">
          ${busyPeople.map((person, index) => busyRankingRow(person, index, busyPeople[0]?.load || 1)).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

export function systemRows(list = resourceProjects()) {
  const rows = new Map();
  projectAllocations(list).forEach((allocation) => {
    const key = allocation.system || "未归属系统";
    const current = rows.get(key) || { system: key, projects: new Set(), people: new Set(), ratio: 0, load: 0 };
    current.projects.add(allocation.projectId);
    current.people.add(allocation.person);
    current.ratio += allocation.timeRatio;
    current.load += loadFor(allocation);
    rows.set(key, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects], people: [...row.people] })).sort((a, b) => b.load - a.load);
}

export function roleRows(list = resourceProjects()) {
  const rows = new Map();
  projectAllocations(list).forEach((allocation) => {
    const current = rows.get(allocation.role) || { role: allocation.role, people: new Set(), projects: new Set(), ratio: 0, load: 0, outsourced: 0, records: 0 };
    current.people.add(allocation.person);
    current.projects.add(allocation.projectId);
    current.ratio += allocation.timeRatio;
    current.load += loadFor(allocation);
    current.outsourced += allocation.outsourced ? 1 : 0;
    current.records += 1;
    rows.set(allocation.role, current);
  });
  return [...rows.values()].map((row) => ({ ...row, people: [...row.people], projects: [...row.projects] })).sort((a, b) => b.load - a.load);
}

export function resourcePeopleStats(projectList = resourceProjects()) {
  const rows = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const load = loadFor(allocation);
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
    current.load += load;
    current.outsourced = current.outsourced || allocation.outsourced;
    rows.set(allocation.person, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects] }));
}

export function resourceKpi(label, value, hint, status = "") {
  return `<article class="kpi resource-kpi ${status ? `resource-kpi-${status}` : ""}">
    <span>${label}</span><strong>${value}</strong><small>${hint}</small>
  </article>`;
}

export function loadLevel(value) {
  if (value >= 1.2) return { key: "R", label: "高负荷" };
  if (value >= 0.6) return { key: "Y", label: "中负荷" };
  return { key: "G", label: "低负荷" };
}

export function personChip(person, interactive = true) {
  const tag = interactive ? "button" : "span";
  const name = escapeHtml(person.person);
  const action = interactive ? ` data-open-person="${name}"` : "";
  return `<${tag} class="person-chip ${person.outsourced ? "external" : ""}"${action}>
    ${name}${person.outsourced ? '<span>外包</span>' : ""}
  </${tag}>`;
}

export function overallocatedCard(person) {
  return `<div class="overalloc-card">
    ${personChip(person)}
    <div class="overalloc-meta"><strong>${Math.round(person.ratio * 100)}%</strong><span>${person.projects.length} 项目</span></div>
  </div>`;
}

export function busyRankingRow(person, index, maxLoad) {
  const level = loadLevel(person.load);
  const width = Math.max(4, Math.round((person.load / Math.max(maxLoad, 1)) * 100));
  return `<button class="busy-row" data-open-person="${person.person}">
    <span class="rank">${index + 1}</span>
    <span class="busy-person">${personChip(person, false)}${person.ratio > 1 ? '<span class="over-tag">超分配</span>' : ""}</span>
    <span class="bar-track"><span class="bar-fill ${level.key}" style="width:${width}%"></span></span>
    <strong class="mono">${person.load.toFixed(2)}</strong>
    <span class="badge ${level.key}">${level.label}</span>
    <span class="muted">${person.projects.length} 项目</span>
  </button>`;
}

export function benchmarkParticipationMatrix() {
  const statuses = Object.keys(statusWeights);
  const rows = Object.entries(roleWeights);
  return `<div class="table-wrap benchmark-table"><table>
    <thead><tr><th>角色 / 阶段</th>${statuses.map((status) => `<th>${status}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([role, weights]) => `<tr><td><strong>${role}</strong></td>${statuses.map((status) => {
      const value = weights[status] ?? (status === "项目暂停" ? 0 : 0);
      return `<td><span class="bench-cell ${benchmarkClass(value)}">${Math.round(value * 100)}%</span></td>`;
    }).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

export function benchmarkClass(value) {
  if (value >= 0.7) return "high";
  if (value >= 0.3) return "medium";
  return "low";
}

export function groupedProjectRows(projectList, field) {
  const rows = new Map();
  projectList.forEach((project) => {
    const key = project[field] || "未归类";
    rows.set(key, (rows.get(key) || 0) + 1);
  });
  return [...rows.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function roleComposition(allocationsList) {
  const rows = new Map();
  allocationsList.forEach((allocation) => {
    const current = rows.get(allocation.role) || new Set();
    current.add(allocation.person);
    rows.set(allocation.role, current);
  });
  return [...rows.entries()].map(([label, people]) => ({ label, value: people.size })).sort((a, b) => b.value - a.value);
}

export function distributionList(rows) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return `<div class="distribution-list">${rows.map((row) => `<div class="distribution-row">
    <span>${row.label}</span>
    <div class="bar-track"><div class="bar-fill G" style="width:${Math.max(4, Math.round((row.value / max) * 100))}%"></div></div>
    <strong class="mono">${row.value}</strong>
  </div>`).join("")}</div>`;
}

export function rolePieChart(rows) {
  if (!rows.length) return '<p class="muted">当前筛选范围内暂无角色数据。</p>';
  const palette = ["#4c7a95", "#5f8f73", "#b88745", "#9b6b7c", "#6d78a8", "#8a7653", "#4f8f8a", "#a06454", "#6f6b85", "#72825b"];
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const radius = 78;
  const center = 90;
  let start = -Math.PI / 2;
  const paths = rows.map((row, index) => {
    const angle = (row.value / total) * Math.PI * 2;
    const end = start + angle;
    const large = angle > Math.PI ? 1 : 0;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    start = end;
    return `<path d="M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${palette[index % palette.length]}"></path>`;
  }).join("");
  return `<div class="role-pie-layout">
    <div class="role-pie-wrap">
      <svg class="role-pie-chart" viewBox="0 0 180 180" role="img" aria-label="角色构成饼图">${paths}<circle cx="${center}" cy="${center}" r="42" class="role-pie-hole"></circle></svg>
      <div class="role-pie-total"><strong>${total}</strong><span>人员</span></div>
    </div>
    <div class="role-pie-legend">${rows.map((row, index) => {
      const pct = Math.round((row.value / total) * 100);
      return `<div class="role-pie-legend-row"><span class="legend-dot" style="background:${palette[index % palette.length]}"></span><strong>${row.label}</strong><span>${row.value}</span><small>${pct}%</small></div>`;
    }).join("")}</div>
  </div>`;
}

export function barChart(rows, id) {
  const visible = rows.slice(0, 8);
  const max = Math.max(...visible.map((row) => row.value), 1);
  const width = 360;
  const height = 150;
  const gap = 8;
  const barWidth = visible.length ? (width - gap * (visible.length - 1)) / visible.length : width;
  return `<svg class="resource-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${id}">
    <line x1="0" y1="${height - 24}" x2="${width}" y2="${height - 24}" class="chart-axis"></line>
    ${visible.map((row, index) => {
      const barHeight = Math.max(6, Math.round((row.value / max) * 92));
      const x = index * (barWidth + gap);
      const y = height - 24 - barHeight;
      return `<g>
        <rect x="${x}" y="${y}" width="${Math.max(8, barWidth)}" height="${barHeight}" rx="4" class="chart-bar-rect"></rect>
        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" class="chart-value">${row.value}</text>
        <text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" class="chart-label">${escapeHtml(String(row.label)).slice(0, 6)}</text>
      </g>`;
    }).join("")}
  </svg>`;
}

export function workloadSummaryTable(rows) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>排名</th><th>人员</th><th>角色</th><th>来源</th><th>项目数</th><th>工时占比</th><th>计算负荷</th><th>等级</th><th>超分配</th></tr></thead>
    <tbody>${rows.map((person, index) => {
      const level = loadLevel(person.load);
      return `<tr class="clickable" data-open-person="${person.person}"><td>${index + 1}</td><td><strong>${person.person}</strong></td><td>${person.role}</td><td>${person.outsourced ? "外包" : "内部"}</td><td>${person.projects.length}</td><td>${Math.round(person.ratio * 100)}%</td><td>${person.load.toFixed(2)}</td><td><span class="badge ${level.key}">${level.label}</span></td><td>${person.ratio > 1 ? '<span class="over-tag">是</span>' : '<span class="muted">否</span>'}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

export function businessProjectGroups(projectList = resourceProjects()) {
  const grouped = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const biz = allocation.biz || "未归属业务部门";
    const group = grouped.get(biz) || new Map();
    const current = group.get(allocation.projectId) || {
      projectId: allocation.projectId,
      projectName: allocation.projectName,
      system: allocation.system,
      cat: allocation.cat,
      biz,
      status: allocation.status,
      complexity: allocation.complexity,
      roles: new Map(),
      totalRatio: 0,
      totalLoad: 0,
    };
    const people = current.roles.get(allocation.role) || new Map();
    people.set(allocation.person, allocation.outsourced);
    current.roles.set(allocation.role, people);
    current.totalRatio += allocation.timeRatio;
    current.totalLoad += loadFor(allocation);
    group.set(allocation.projectId, current);
    grouped.set(biz, group);
  });
  return [...grouped.entries()].map(([biz, projectsMap]) => ({
    biz,
    projects: [...projectsMap.values()].sort((a, b) => b.totalLoad - a.totalLoad),
  })).sort((a, b) => b.projects.length - a.projects.length || a.biz.localeCompare(b.biz));
}

export function businessProjectGroupsView(groups) {
  if (!groups.length) return '<p class="muted">当前筛选范围内暂无人员项目分组。</p>';
  return `<div class="business-group-list">${groups.map((group) => `<details class="business-group" open>
    <summary><strong>${group.biz}</strong><span class="muted">${group.projects.length} 个项目</span></summary>
    <div class="table-wrap business-project-table"><table>
      <thead><tr><th>系统 / 项目</th><th>阶段</th><th>复杂度</th><th>产品</th><th>项目</th><th>Agent</th><th>技术</th><th>测试</th><th>运维 / 其他</th><th>投入</th></tr></thead>
      <tbody>${group.projects.map((project) => `<tr>
        <td><strong>${escapeHtml(project.projectName)}</strong><br><span class="muted">${escapeHtml(project.system)} · ${escapeHtml(project.cat)}</span></td>
        <td>${escapeHtml(project.status)}</td>
        <td>${project.complexity}</td>
        <td>${rolePeopleCell(project, ["产品经理", "Product Manager", "产品"])}</td>
        <td>${rolePeopleCell(project, ["项目经理", "PM", "Project Manager"])}</td>
        <td>${rolePeopleCell(project, ["Agent开发", "Agent", "AI Agent", "智能体"])}</td>
        <td>${rolePeopleCell(project, ["技术负责人", "Tech Lead", "开发", "架构师"])}</td>
        <td>${rolePeopleCell(project, ["测试", "QA", "测试负责人"])}</td>
        <td>${otherRolePeopleCell(project, ["产品经理", "Product Manager", "产品", "项目经理", "PM", "Project Manager", "Agent开发", "Agent", "AI Agent", "智能体", "技术负责人", "Tech Lead", "开发", "架构师", "测试", "QA", "测试负责人"])}</td>
        <td><strong>${Math.round(project.totalRatio * 100)}%</strong><br><span class="muted">${project.totalLoad.toFixed(2)}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </details>`).join("")}</div>`;
}

export function rolePeopleCell(project, aliases) {
  const entries = [...project.roles.entries()].filter(([role]) => aliases.some((alias) => role.includes(alias)));
  return peopleFromRoleEntries(entries);
}

export function otherRolePeopleCell(project, knownAliases) {
  const entries = [...project.roles.entries()].filter(([role]) => !knownAliases.some((alias) => role.includes(alias)));
  return peopleFromRoleEntries(entries);
}

export function peopleFromRoleEntries(entries) {
  const people = [];
  entries.forEach(([, peopleMap]) => peopleMap.forEach((outsourced, person) => people.push({ person, outsourced })));
  if (!people.length) return '<span class="muted">-</span>';
  return `<div class="people-chip-list">${people.slice(0, 4).map((item) => personChip(item, true)).join("")}${people.length > 4 ? `<span class="muted">+${people.length - 4}</span>` : ""}</div>`;
}

export function matrixView() {
  const focus = state.resourceFilters.projectFocus;
  const focusProject = focus ? projects.find(p => p.id === focus) : null;

  let list = resourceProjects();
  let focusBanner = "";
  if (focus) {
    const focusedAllocs = allocations.filter(a =>
      a.projectId === focus ||
      (focusProject && a.projectName === focusProject.name)
    );
    list = list.filter(p =>
      p.id === focus ||
      (focusProject && p.name === focusProject.name) ||
      focusedAllocs.some(a => a.projectId === p.id)
    );
    const projectLabel = focusProject
      ? escapeHtml(`${focusProject.code || focus} · ${focusProject.name}`)
      : escapeHtml(focus);
    focusBanner = `<div class="project-focus-banner">
      <span>当前聚焦项目：<strong>${projectLabel}</strong></span>
      <button class="ghost-button" data-action="clear-project-focus">清除聚焦</button>
    </div>`;
  }

  const groups = businessProjectGroups(list);
  const allAllocs = projectAllocations(list);
  const systemCount = new Set(allAllocs.map(a => a.system).filter(Boolean)).size;
  const activeProjects = list.filter(p => p.status !== '项目暂停').length;
  const peopleCount = new Set(allAllocs.map(a => a.person)).size;
  const bizCount = groups.length;
  const avgComplexity = allAllocs.length
    ? (allAllocs.reduce((s, a) => s + (a.complexity || 0), 0) / allAllocs.length).toFixed(1)
    : '–';

  return `<div class="resource-workspace people-project-workspace">
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">覆盖系统</span>
        <span class="hero-value">${systemCount}</span>
        <span class="hero-sub">系统 / 平台</span>
      </div>
      <div class="hero-card clickable" data-route="resource">
        <span class="hero-label">参与项目</span>
        <span class="hero-value">${list.length}</span>
        <span class="hero-sub">活跃 ${activeProjects} 个</span>
      </div>
      <div class="hero-card clickable" data-route="people">
        <span class="hero-label">矩阵人数</span>
        <span class="hero-value">${peopleCount}</span>
        <span class="hero-sub">人员 × 项目</span>
      </div>
      <div class="hero-card clickable">
        <span class="hero-label">业务部门</span>
        <span class="hero-value">${bizCount}</span>
        <span class="hero-sub">分组</span>
      </div>
      <div class="hero-card">
        <span class="hero-label">平均复杂度</span>
        <span class="hero-value">${avgComplexity}</span>
        <span class="hero-sub">1–5 标度</span>
      </div>
    </div>

    ${focusBanner}
    ${resourceFilterBar()}

    <section class="panel cockpit-panel benchmark-panel">
      <div class="panel-header">
        <span class="panel-title">角色 × 项目阶段 参与度</span>
        <div class="rv-seg-legend">
          <span><i class="rv-seg-swatch G"></i>高参与</span>
          <span><i class="rv-seg-swatch Y"></i>中参与</span>
          <span><i class="rv-seg-swatch" style="background:var(--gray-bg)"></i>低参与</span>
        </div>
      </div>
      <p class="panel-hint">矩阵为 R2 V7 负荷公式中的角色阶段权重来源：复杂度 × 状态权重 × 角色参与度。</p>
      ${benchmarkParticipationMatrix()}
    </section>

    <section class="panel cockpit-panel business-groups-panel">
      <div class="panel-header">
        <span class="panel-title">业务部门分组项目人员</span>
        <span class="panel-badge info">${groups.reduce((sum, group) => sum + group.projects.length, 0)} 个项目</span>
      </div>
      ${groups.length
        ? businessProjectGroupsView(groups)
        : focus
          ? `<p class="muted" style="padding:16px">资源数据中暂无与该 PMO 项目直接关联的记录（allocation.projectId 尚未与 PMO 项目 ID 对齐）。</p>`
          : '<p class="muted" style="padding:16px">当前筛选范围内暂无人员项目分组。</p>'
      }
    </section>
  </div>`;
}

export function resourceFilterBar() {
  const systems = ["all", ...unique(allocations.map((allocation) => allocation.system))];
  const roles = ["all", ...unique(allocations.map((allocation) => allocation.role))];
  return `<section class="resource-filter-panel">
    <span class="tag">资源筛选</span>
    <label>系统<select data-resource-filter="system">${systems.map((value) => `<option value="${value}" ${state.resourceFilters.system === value ? "selected" : ""}>${value === "all" ? "全部系统" : value}</option>`).join("")}</select></label>
    <label>角色<select data-resource-filter="role">${roles.map((value) => `<option value="${value}" ${state.resourceFilters.role === value ? "selected" : ""}>${value === "all" ? "全部角色" : value}</option>`).join("")}</select></label>
    <label>人员类型<select data-resource-filter="outsource">
      <option value="all" ${state.resourceFilters.outsource === "all" ? "selected" : ""}>全部人员</option>
      <option value="internal" ${state.resourceFilters.outsource === "internal" ? "selected" : ""}>内部</option>
      <option value="external" ${state.resourceFilters.outsource === "external" ? "selected" : ""}>外包</option>
    </select></label>
  </section>`;
}

export function roleCoverageTable(rows) {
  const maxLoad = Math.max(...rows.map((row) => row.load), 1);
  return `<div class="table-wrap"><table>
    <thead><tr><th>角色</th><th>人员数</th><th>项目数</th><th>投入比例</th><th>总负荷</th><th>外包占比</th><th>负荷分布</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td><strong>${row.role}</strong></td><td>${row.people.length}</td><td>${row.projects.length}</td><td>${Math.round(row.ratio * 100)}%</td><td>${row.load.toFixed(2)}</td><td>${Math.round((row.outsourced / row.records) * 100)}%</td><td><div class="bar-track"><div class="bar-fill ${row.load >= 8 ? "R" : row.load >= 4 ? "Y" : "G"}" style="width:${Math.max(4, Math.round((row.load / maxLoad) * 100))}%"></div></div></td></tr>`).join("")}</tbody>
  </table></div>`;
}

export function systemProjectView() {
  const list = resourceProjects();
  const systems = systemRows(list);
  const projectsBySystem = new Map();
  list.forEach((project) => {
    const key = project.system || "未归属系统";
    projectsBySystem.set(key, [...(projectsBySystem.get(key) || []), project]);
  });
  return `<section class="panel matrix-panel">
    <div class="matrix-toolbar">
      <h2>系统 x 项目</h2>
      <div class="inline-actions"><span class="badge G">项目数</span><span class="badge Y">投入比例</span><span class="badge R">总负荷</span></div>
    </div>
    <div class="table-wrap system-project-table"><table>
      <thead><tr><th>系统</th><th>项目覆盖</th><th>人员数</th><th>投入比例</th><th>总负荷</th><th>高负荷项目</th></tr></thead>
      <tbody>${systems.map((row) => {
        const projects = projectsBySystem.get(row.system) || [];
        const heavy = projects.map((project) => {
          const total = allocations.filter((allocation) => allocation.projectId === project.id).reduce((sum, allocation) => sum + loadFor(allocation), 0);
          return { project, total };
        }).sort((a, b) => b.total - a.total).slice(0, 3);
        return `<tr><td><strong>${row.system}</strong></td><td>${projects.map((project) => `<span class="tag">${project.name}</span>`).join("")}</td><td>${row.people.length}</td><td>${Math.round(row.ratio * 100)}%</td><td>${row.load.toFixed(2)}</td><td>${heavy.map((item) => `${item.project.name} ${item.total.toFixed(1)}`).join(" / ")}</td></tr>`;
      }).join("")}</tbody>
    </table></div>
  </section>`;
}

export function matrixCell(person, projectId) {
  const items = allocations.filter((a) => {
    const resourceFilters = state.resourceFilters;
    return (
      a.person === person &&
      a.projectId === projectId &&
      (resourceFilters.role === "all" || a.role === resourceFilters.role) &&
      (resourceFilters.outsource === "all" ||
        (resourceFilters.outsource === "internal" && !a.outsourced) ||
        (resourceFilters.outsource === "external" && a.outsourced))
    );
  });
  if (!items.length) return `<td><span class="load-empty">-</span></td>`;
  const ratio = items.reduce((sum, item) => sum + item.timeRatio, 0);
  const load = items.reduce((sum, item) => sum + loadFor(item), 0);
  return `<td><button class="cell ${loadClass(load)}" data-open-person="${person}"><strong>${Math.round(ratio * 100)}%</strong><small>${load.toFixed(2)}</small></button></td>`;
}

export function workloadView() {
  const list = resourceProjects();
  const stats = personStats(list);
  const projectIds = list.map((project) => project.id);
  const all = projectAllocations(list);
  const high = stats.filter((person) => person.load >= 1.2).length;
  const totalRatio = all.reduce((sum, allocation) => sum + allocation.timeRatio, 0);
  const outsourcedRatio = all.length ? Math.round((all.filter((allocation) => allocation.outsourced).length / all.length) * 100) : 0;

  return `<div class="resource-workspace workload-heatmap-workspace">
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">当前人数</span>
        <span class="hero-value">${stats.length}</span>
        <span class="hero-sub">筛选范围内</span>
      </div>
      <div class="hero-card clickable" data-route="matrix">
        <span class="hero-label">项目数</span>
        <span class="hero-value">${list.length}</span>
        <span class="hero-sub">热力列</span>
      </div>
      <div class="hero-card clickable">
        <span class="hero-label">总投入比例</span>
        <span class="hero-value">${Math.round(totalRatio * 100)}<small>%</small></span>
        <span class="hero-sub">Excel 工时投入占比</span>
      </div>
      <div class="hero-card clickable" data-route="people">
        <span class="hero-label">高负载人员</span>
        <span class="hero-value${high > 0 ? ' text-danger' : ''}">${high}</span>
        <span class="hero-sub">load >= 1.2</span>
      </div>
      <div class="hero-card clickable">
        <span class="hero-label">外包占比</span>
        <span class="hero-value">${outsourcedRatio}<small>%</small></span>
        <span class="hero-sub">资源分配记录</span>
      </div>
    </div>

    ${resourceFilterBar()}

    <div class="panel cockpit-panel">
      <div class="panel-header">
        <span class="panel-title">人员 x 项目 负荷热力</span>
        <div class="rv-seg-legend">
          <span><i class="rv-seg-swatch G"></i>低 &lt; 0.6</span>
          <span><i class="rv-seg-swatch Y"></i>中 0.6-1.2</span>
          <span><i class="rv-seg-swatch R"></i>高 >= 1.2</span>
        </div>
      </div>
      <p class="panel-hint">单元格显示投入比例 / 计算负荷；点击单元格或人员行查看贡献明细。</p>
      <div class="rv-heatmap-wrap">
        <table class="rv-heatmap">
          <thead><tr>
            <th class="rv-corner">人员 / 项目</th>
            ${list.map((project) => `<th><span>${escapeHtml(project.name)}</span>${project.system ? `<small>${escapeHtml(project.system)}</small>` : ''}</th>`).join('')}
          </tr></thead>
          <tbody>${stats.map((person) => `<tr class="clickable" data-open-person="${escapeHtml(person.person)}">
            <td class="rv-rowhead"><strong>${escapeHtml(person.person)}</strong><span>${escapeHtml(person.role)}${person.outsourced ? ' · 外包' : ' · 内部'}</span></td>
            ${projectIds.map((id) => matrixCell(person.person, id)).join('')}
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
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

export function donutChart(rows) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  let offset = 25;
  const circles = rows.map((row) => {
    const pct = (row.value / total) * 100;
    const circle = `<circle class="donut-segment ${row.key}" cx="21" cy="21" r="15.9" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"></circle>`;
    offset -= pct;
    return circle;
  }).join("");
  return `<div class="donut-wrap"><svg class="donut-chart" viewBox="0 0 42 42" role="img"><circle class="donut-bg" cx="21" cy="21" r="15.9"></circle>${circles}</svg><div class="donut-total"><strong>${rows.reduce((sum, row) => sum + row.value, 0)}</strong><span>项目</span></div></div>`;
}

export function horizontalRiskBars(rows) {
  if (!rows.length) return '<p class="muted">当前筛选范围内没有关键人风险。</p>';
  const max = Math.max(...rows.map((row) => row.load), 1);
  return `<div class="bf-bars">${rows.map((row, index) => `<button class="bf-bar-row" data-open-person="${row.person}"><span class="rank">${index + 1}</span><strong>${row.person}</strong><span class="bar-track"><span class="bar-fill ${row.singlePoint ? "R" : "Y"}" style="width:${Math.max(4, Math.round((row.load / max) * 100))}%"></span></span><span class="mono">${row.load.toFixed(2)}</span><span class="muted">${row.projectCount} 项</span></button>`).join("")}</div>`;
}

export function busFactorRedlineCard(row) {
  const name = escapeHtml(row.project.name);
  const system = escapeHtml(row.project.system);
  const status = escapeHtml(row.project.status);
  const person = escapeHtml(row.topPerson);
  return `<article class="bf-risk-card"><div><span class="badge R">BF=1</span><h3>${name}</h3><p class="muted">${system} · ${status}</p></div><div class="bf-risk-meta"><span>关键人 <strong>${person}</strong></span><span>Top 贡献 <strong>${Math.round(row.topShare * 100)}%</strong></span><span>总负荷 <strong>${row.total.toFixed(2)}</strong></span></div><p>${busFactorExplain(row)}</p></article>`;
}

export function busFactorCoverageHeatmap(rows) {
  const roles = unique(allocations.map((allocation) => allocation.role)).slice(0, 8);
  if (!rows.length || !roles.length) return '<p class="muted">暂无覆盖数据。</p>';
  return `<div class="table-wrap coverage-heatmap"><table><thead><tr><th>项目 / 角色</th>${roles.map((role) => `<th>${escapeHtml(role)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${escapeHtml(row.project.name)}</strong><span class="muted">BF ${row.bf}</span></td>${roles.map((role) => {
    const count = row.roleCoverage.get(role)?.size || 0;
    const cls = count <= 0 ? "empty" : count === 1 ? "risk" : count === 2 ? "warn" : "ok";
    return `<td><span class="coverage-cell ${cls}">${count || "-"}</span></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function busFactorView() {
  const rows = busFactorRows();
  const singlePoint = rows.filter((row) => row.risk === 'R').length;
  const medium = rows.filter((row) => row.risk === 'Y').length;
  const healthy = rows.filter((row) => row.risk === 'G').length;
  const keyPeople = keyPeopleRiskRows(rows);
  const pieRows = [
    { label: 'BF=1', value: singlePoint, key: 'R' },
    { label: 'BF=2', value: medium, key: 'Y' },
    { label: 'BF≥3', value: healthy, key: 'G' },
  ];
  const redline = rows.filter((row) => row.bf <= 1);
  return `<div class="resource-workspace busfactor-dashboard">
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">Bus Factor 红线</span>
        <span class="hero-value${singlePoint > 0 ? ' text-danger' : ''}">${singlePoint}</span>
        <span class="hero-sub">BF=1 单点故障项目</span>
      </div>
      <div class="hero-card clickable hero-alert-y">
        <span class="hero-label">BF=2</span>
        <span class="hero-value${medium > 0 ? ' text-urgent' : ''}">${medium}</span>
        <span class="hero-sub">双备份但脆弱</span>
      </div>
      <div class="hero-card clickable">
        <span class="hero-label">BF≥3</span>
        <span class="hero-value">${healthy}</span>
        <span class="hero-sub">覆盖健康</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">关键人节点</span>
        <span class="hero-value${keyPeople.length > 0 ? ' text-danger' : ''}">${keyPeople.length}</span>
        <span class="hero-sub">出现在风险项目 Top 贡献</span>
      </div>
      <div class="hero-card">
        <span class="hero-label">风险口径</span>
        <span class="hero-value">50<small>%</small></span>
        <span class="hero-sub">累计贡献阈值</span>
      </div>
    </div>

    ${resourceFilterBar()}

    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="ghost-button" data-action="export-bf-projects">项目 BF 清单 ↓</button>
      <button class="ghost-button" data-action="export-bf-people">关键人风险榜 ↓</button>
    </div>

    <div class="panel-row">
      <div class="panel cockpit-panel">
        <div class="panel-header"><span class="panel-title">Bus Factor 全景分布</span></div>
        ${donutChart(pieRows)}
        ${distributionList(pieRows)}
      </div>
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">关键人风险榜 Top 10</span>
          ${keyPeople.length > 0 ? '<span class="panel-badge warn">需关注</span>' : '<span class="panel-badge info">正常</span>'}
        </div>
        ${horizontalRiskBars(keyPeople.slice(0, 10))}
      </div>
    </div>

    <div class="panel cockpit-panel">
      <div class="panel-header">
        <span class="panel-title">BF=1 红线项目</span>
        <span class="muted" style="font-size:12px">优先做知识备份、角色补位和交付拆分</span>
      </div>
      ${redline.length ? `<div class="bf-card-grid">${redline.map((row) => busFactorRedlineCard(row)).join('')}</div>` : '<p class="muted">当前筛选范围内没有 BF=1 红线项目。</p>'}
    </div>

    <div class="panel cockpit-panel">
      <div class="panel-header">
        <span class="panel-title">角色 × 项目覆盖热力</span>
        <span class="muted" style="font-size:12px">单角色单人覆盖会形成隐性 Bus Factor 风险</span>
      </div>
      ${busFactorCoverageHeatmap(rows.slice(0, 8))}
    </div>

    <div class="panel cockpit-panel">
      <div class="panel-header">
        <span class="panel-title">项目 Bus Factor 明细</span>
        <span class="panel-badge info">${rows.length} 个项目</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>项目</th><th>总负荷</th><th>Bus Factor</th><th>关键贡献人</th><th>Top 贡献占比</th><th>参与人数</th><th>单人覆盖角色</th><th>项目健康</th><th>风险解释</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td><strong>${row.project.name}</strong><br><span class="muted">${row.project.system}</span></td><td>${row.total.toFixed(2)}</td><td><strong>${row.bf}</strong></td><td>${row.contributors.slice(0, 3).map((c) => `${c.person} ${c.load.toFixed(2)}`).join(' / ')}</td><td>${Math.round(row.topShare * 100)}%</td><td>${row.peopleCount}</td><td>${row.singleRoles.length ? row.singleRoles.join(' / ') : '<span class="muted">-</span>'}</td><td>${badge(row.project.health)}</td><td>${busFactorExplain(row)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
  </div>`;
}

export function busFactorExplain(row) {
  if (row.risk === "R") return "一个人累计贡献已经达到项目 50% 关键负荷，关键人离开会导致项目停摆风险。";
  if (row.risk === "Y") return "两个人即可覆盖 50% 关键负荷，存在排期冲突和知识集中风险。";
  return "达到 50% 关键负荷需要三人及以上，当前覆盖相对健康。";
}

export function rolesView() {
  const rows = roleRows();
  return `<div class="resource-workspace">
    ${resourceFilterBar()}
    <section class="panel">
    <div class="matrix-toolbar">
      <h2>角色覆盖</h2>
      <div class="inline-actions"><span class="badge G">人员</span><span class="badge Y">项目</span><span class="badge R">负荷</span></div>
    </div>
    ${roleCoverageTable(rows)}
  </section>
  </div>`;
}

export function peopleView() {
  const list = resourceProjects();
  const people = resourcePeopleStats(list);
  const totalPeople = people.length;
  const outsourcedCount = people.filter(p => p.outsourced).length;
  const internalCount = totalPeople - outsourcedCount;
  const externalPct = totalPeople ? Math.round((outsourcedCount / totalPeople) * 100) : 0;
  const high = people.filter(p => p.load >= 1.2).length;
  const overallocated = people.filter(p => p.ratio > 1).length;
  const avgProjects = totalPeople ? (people.reduce((s, p) => s + p.projects.length, 0) / totalPeople).toFixed(1) : '0';

  return `<div class="resource-workspace people-index-workspace">
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">总人数</span>
        <span class="hero-value">${totalPeople}</span>
        <span class="hero-sub">内部 ${internalCount} · 外包 ${outsourcedCount} (${externalPct}%)</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">内部 / 外包</span>
        <span class="hero-value">${internalCount}<small> / ${outsourcedCount}</small></span>
        <span class="hero-sub">内部占比 ${totalPeople ? Math.round((internalCount / totalPeople) * 100) : 0}%</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">超负荷人员</span>
        <span class="hero-value${high > 0 ? ' text-danger' : ''}">${high}</span>
        <span class="hero-sub">负荷 ≥ 1.2</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">超分配人员</span>
        <span class="hero-value${overallocated > 0 ? ' text-danger' : ''}">${overallocated}</span>
        <span class="hero-sub">Σ 工时 &gt; 100%</span>
      </div>
      <div class="hero-card">
        <span class="hero-label">平均参与项目</span>
        <span class="hero-value">${avgProjects}</span>
        <span class="hero-sub">每人</span>
      </div>
    </div>

    ${resourceFilterBar()}

    <div class="panel cockpit-panel">
      <div class="rv-people-toolbar">
        <div class="panel-header" style="gap:10px"><span class="panel-title">人员索引</span><span class="panel-badge info">${totalPeople} 人</span></div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div class="rv-sort">
            <button class="rv-sort-chip active" data-people-sort="load">负荷 ↓</button>
            <button class="rv-sort-chip" data-people-sort="ratio">工时占比</button>
            <button class="rv-sort-chip" data-people-sort="projects">项目数</button>
            <button class="rv-sort-chip" data-people-sort="name">姓名</button>
          </div>
          <input class="rv-people-search" id="people-search" placeholder="搜索人员、角色、部门…">
        </div>
      </div>
      <div class="rv-people-grid" id="people-grid">
        ${people.sort((a, b) => b.load - a.load).map(person => peopleCard(person)).join('')}
      </div>
    </div>
  </div>`;
}

export function peopleCard(person) {
  const level = loadLevel(person.load);
  const maxLoad = 2.5;
  const barWidth = Math.max(4, Math.round((person.load / maxLoad) * 100));
  return `<button class="rv-person-card" data-open-person="${escapeHtml(person.person)}">
    <div class="rv-person-top">
      <div>
        <div class="rv-person-name">${escapeHtml(person.person)}${person.outsourced ? ' <span class="rv-ext-tag">外包</span>' : ''}</div>
        <div class="rv-person-sub">${escapeHtml(person.role)} · ${escapeHtml(person.dept)}</div>
      </div>
      <span class="rv-lamp ${level.key}"></span>
    </div>
    <div class="rv-person-loadbar"><span class="${level.key}" style="width:${barWidth}%"></span></div>
    <div class="rv-person-meta">
      <span>${person.projects.length} 个项目</span>
      <strong>${Math.round(person.ratio * 100)}%</strong>
      <span class="badge ${level.key}">${level.label}</span>
    </div>
  </button>`;
}

export function openPerson(personName) {
  const items = allocations.filter((allocation) => allocation.person === personName).map((allocation) => {
    const project = projects.find((item) => item.id === allocation.projectId) || {
      id: allocation.projectId,
      name: allocation.projectName || allocation.projectId,
      status: allocation.status,
      complexity: allocation.complexity,
      health: allocation.status === "项目暂停" ? "R" : allocation.status === "UAT" ? "Y" : "G",
    };
    return { ...allocation, project, load: loadFor(allocation) };
  });
  if (!items.length) return;
  const totalLoad = items.reduce((sum, item) => sum + item.load, 0);
  const totalRatio = items.reduce((sum, item) => sum + item.timeRatio, 0);
  const primary = items[0];
  $("#drawer").innerHTML = `<div class="drawer-header">
    <div><p class="eyebrow">Resource Detail</p><h2>${personName}</h2></div>
    <button class="ghost-button" data-close-drawer>关闭</button>
  </div>
  <div class="detail-grid">
    ${detail("主要角色", primary.role)}
    ${detail("部门组织", primary.dept)}
    ${detail("来源", primary.outsourced ? "外包" : "内部")}
    ${detail("参与项目", items.length)}
    ${detail("总投入比例", `${Math.round(totalRatio * 100)}%`)}
    ${detail("计算负荷", totalLoad.toFixed(2))}
    ${detail("负荷等级", badge(totalLoad >= 1.2 ? "R" : totalLoad >= 0.6 ? "Y" : "G"))}
    ${detail("算法", "R2 workload")}
  </div>
  <section class="panel" style="margin-top:16px">
    <h2>项目负荷贡献拆解</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>项目</th><th>阶段</th><th>复杂度</th><th>角色</th><th>投入比例</th><th>负荷贡献</th><th>项目健康</th></tr></thead>
      <tbody>${items.map((item) => `<tr><td><strong>${item.project.name}</strong></td><td>${item.project.status}</td><td>${item.project.complexity}</td><td>${item.role}</td><td>${Math.round(item.timeRatio * 100)}%</td><td>${item.load.toFixed(2)}</td><td>${badge(item.project.health)}</td></tr>`).join("")}</tbody>
    </table></div>
  </section>`;
  $("#drawer-backdrop").hidden = false;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

export function exportWorkloadCsv() {
  const rows = resourcePeopleStats().sort((a, b) => b.load - a.load);
  const header = ["人员", "角色", "部门", "人员类型", "项目数", "工时占比", "计算负荷", "负荷等级", "是否超分配"];
  const lines = [
    header.map(csvValue).join(","),
    ...rows.map((person) => {
      const level = loadLevel(person.load);
      return [
        person.person,
        person.role,
        person.dept,
        person.outsourced ? "外包" : "内部",
        person.projects.length,
        `${Math.round(person.ratio * 100)}%`,
        person.load.toFixed(4),
        level.label,
        person.ratio > 1 ? "是" : "否",
      ].map(csvValue).join(",");
    }),
  ];
  downloadTextFile("PMO_资源负荷_R2口径.csv", lines.join("\n"));
}

export function exportBusFactorProjects() {
  const header = ["项目", "系统", "阶段", "总负荷", "Bus Factor", "关键贡献人", "Top贡献占比", "参与人数", "单人覆盖角色", "风险解释"];
  const lines = [header.map(csvValue).join(","), ...busFactorRows().map((row) => [
    row.project.name,
    row.project.system,
    row.project.status,
    row.total.toFixed(4),
    row.bf,
    row.topPerson,
    `${Math.round(row.topShare * 100)}%`,
    row.peopleCount,
    row.singleRoles.join(" / "),
    busFactorExplain(row),
  ].map(csvValue).join(","))];
  downloadTextFile("PMO_Bus_Factor_项目清单.csv", lines.join("\n"));
}

export function exportBusFactorPeople() {
  const header = ["人员", "风险项目数", "BF1项目数", "关键贡献负荷", "相关项目"];
  const lines = [header.map(csvValue).join(","), ...keyPeopleRiskRows(busFactorRows()).map((row) => [
    row.person,
    row.projectCount,
    row.singlePoint,
    row.load.toFixed(4),
    [...row.projects].join(" / "),
  ].map(csvValue).join(","))];
  downloadTextFile("PMO_Bus_Factor_关键人风险榜.csv", lines.join("\n"));
}
