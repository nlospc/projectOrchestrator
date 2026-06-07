import { milestones, projects } from "../data/mock-data.js";
import { $, badge, detail, effectiveHealth, healthLabel, monthEnd, monthLabel, monthStart, parseDate, addMonths } from "../core/utils.js";
import { dashboardMetrics, filteredProjects } from "../core/selectors.js";

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
      ${kpi("本月应完成里程碑", metrics.due, "测试/UAT/上线窗口")}
      ${kpi("已延期里程碑", metrics.delayed, "红灯里程碑段", "R")}
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
        <h2>近期里程碑</h2>
        <div class="stack compact-list">
          ${metrics.risks.length ? metrics.risks.slice(0, 6).map((m) => riskRow(m)).join("") : '<p class="muted">当前筛选范围内暂无近期里程碑风险。</p>'}
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

export function riskRow(milestone) {
  const project = projects.find((p) => p.id === milestone.projectId);
  return `<button class="risk-row clickable" data-open-project="${project.id}">
    <span><strong>${project.name}</strong><br><span class="muted">${milestone.name} · 延期 ${milestone.delay} 天 · ${milestone.note}</span></span>
    ${badge(milestone.state)}
  </button>`;
}

export function personRow(person) {
  return `<div class="person-row">
    <span><strong>${person.person}</strong><br><span class="muted">${person.role} · ${person.projects.length} 个项目 · 投入 ${(person.ratio * 100).toFixed(0)}%</span></span>
    <span class="badge ${person.load >= 1.2 ? "R" : person.load >= 0.6 ? "Y" : "G"}">${person.load.toFixed(2)}</span>
  </div>`;
}

export function projectsView() {
  const list = filteredProjects();
  return `<section class="panel project-monitor">
      <div class="project-monitor-head">
        <div>
          <h2>关键里程碑监控</h2>
          <p class="muted">左侧按部门组织和业务部门分组，右侧为可横向滚动的连续里程碑甘特图。</p>
        </div>
        <input id="project-search" placeholder="搜索项目、编号、负责人" />
      </div>
      <div class="table-wrap" id="project-timeline-wrap">${timeline(list)}</div>
    </section>`;
}

export function projectRows(list) {
  return list.map((project) => `<tr class="clickable" data-open-project="${project.id}">
    <td>${project.id}</td><td><strong>${project.name}</strong></td><td>${project.family}</td><td>${project.biz}</td><td>${project.pm}</td><td>${project.status}</td><td>${project.complexity}</td><td>${badge(project.health)}</td><td>${project.override ? badge(project.override) : '<span class="badge gray">无覆盖</span>'}</td><td>${project.overrideNote || "按系统状态展示"}</td>
  </tr>`).join("");
}

export function timeline(list) {
  const projectIds = new Set(list.map((project) => project.id));
  const scopedMilestones = milestones.filter((milestone) => projectIds.has(milestone.projectId));
  if (!scopedMilestones.length) {
    return `<div class="monitor-board-empty">当前筛选条件下没有里程碑数据。</div>`;
  }
  const firstDate = monthStart(new Date(Math.min(...scopedMilestones.map((milestone) => parseDate(milestone.plannedStart).getTime()))));
  const lastDate = monthEnd(new Date(Math.max(...scopedMilestones.map((milestone) => parseDate(milestone.plannedEnd).getTime()))));
  const months = [];
  for (let cursor = firstDate; cursor <= lastDate; cursor = addMonths(cursor, 1)) {
    months.push(new Date(cursor));
  }
  const rangeMs = lastDate.getTime() - firstDate.getTime();
  const positionFor = (start, end) => {
    const startMs = parseDate(start).getTime();
    const endMs = parseDate(end).getTime();
    const left = Math.max(0, ((startMs - firstDate.getTime()) / rangeMs) * 100);
    const width = Math.max(3.5, ((endMs - startMs) / rangeMs) * 100);
    return { left: left.toFixed(3), width: Math.min(width, 100 - left).toFixed(3) };
  };
  const markerFor = (date) => (((parseDate(date).getTime() - firstDate.getTime()) / rangeMs) * 100).toFixed(3);
  const current = new Date(2026, 5, 6);
  const showToday = current >= firstDate && current <= lastDate;
  const todayLeft = showToday ? (((current.getTime() - firstDate.getTime()) / rangeMs) * 100).toFixed(3) : "";
  const groups = groupProjects(list);
  const rows = groups.flatMap((group) => [{ type: "group", group }, ...group.projects.map((project) => ({ type: "project", project }))]);
  return `<div class="monitor-board">
    <div class="project-list-pane">
      <div class="project-list-head">项目列表</div>
      ${rows.map((row) => row.type === "group" ? groupRow(row.group) : projectListRow(row.project)).join("")}
    </div>
    <div class="gantt-pane">
      <div class="gantt-scroll">
        <div class="gantt-canvas" style="--month-count:${months.length}">
          <div class="gantt-head">
            ${months.map((month) => `<span>${monthLabel(month)}</span>`).join("")}
            ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
          </div>
          ${rows.map((row) => row.type === "group" ? ganttGroupRow(row.group, months) : ganttProjectRow(row.project, months, positionFor, markerFor, showToday, todayLeft)).join("")}
        </div>
      </div>
    </div>
  </div>`;
}

export function groupProjects(list) {
  const map = new Map();
  list.forEach((project) => {
    const key = `${project.dept}||${project.biz}`;
    if (!map.has(key)) {
      map.set(key, { dept: project.dept, biz: project.biz, projects: [] });
    }
    map.get(key).projects.push(project);
  });
  return [...map.values()];
}

export function groupRow(group) {
  return `<div class="project-group-row">
    <strong>${group.dept}</strong>
    <span>${group.biz} · ${group.projects.length} 个项目</span>
  </div>`;
}

export function projectListRow(project) {
  return `<button class="project-list-row" data-open-project="${project.id}" title="${project.name}">
    <span class="project-name">${project.name}</span>
    <span class="health-dot ${effectiveHealth(project)}">${healthLabel(effectiveHealth(project))}</span>
    <span class="project-meta">${project.id} 路 ${project.pm} 路 ${project.status}</span>
  </button>`;
}

export function ganttGroupRow(group, months) {
  return `<div class="gantt-group-row">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
  </div>`;
}

export function ganttProjectRow(project, months, positionFor, markerFor, showToday, todayLeft) {
  const items = milestones.filter((milestone) => milestone.projectId === project.id);
  const first = items[0];
  const last = items[items.length - 1];
  const lanePosition = positionFor(first.plannedStart, last.plannedEnd);
  const laneStart = parseDate(first.plannedStart).getTime();
  const laneEnd = parseDate(last.plannedEnd).getTime();
  const laneRange = laneEnd - laneStart;
  return `<div class="gantt-project-row">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
    ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
    <div class="gantt-lane" style="left:${lanePosition.left}%;width:${lanePosition.width}%">
      ${items.map((milestone, index) => {
        const start = parseDate(milestone.plannedStart).getTime();
        const end = parseDate(milestone.plannedEnd).getTime();
        const width = Math.max(7, ((end - start) / laneRange) * 100).toFixed(3);
        const actualEnd = milestone.actualEnd ? parseDate(milestone.actualEnd).getTime() : 0;
        const actualLate = actualEnd > end;
        const actualLeft = milestone.actualEnd ? Math.max(0, Math.min(100, ((actualEnd - start) / (end - start)) * 100)).toFixed(2) : "";
        return `<button class="gantt-segment ${milestone.state} ${index === 0 ? "first" : ""} ${index === items.length - 1 ? "last" : ""}" data-open-project="${project.id}" title="${milestone.name}: ${milestone.plannedStart} 至 ${milestone.plannedEnd} · ${milestone.note}" style="width:${width}%">
          <span class="gantt-segment-label">${milestone.name}</span>
          <span class="gantt-node plan" style="left:100%" title="计划完成：${milestone.name} · ${milestone.plannedEnd}">P</span>
          ${milestone.actualEnd ? `<span class="gantt-node ${actualLate ? "late" : "done"}" style="left:${actualLate ? "100" : actualLeft}%" title="${actualLate ? "延期完成" : "正常/提前完成"}：${milestone.name} · ${milestone.actualEnd}">${actualLate ? "!" : "A"}</span>` : ""}
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

export function groupedProjectRows(projectList, field) {
  const rows = new Map();
  projectList.forEach((project) => {
    const key = project[field] || "未归类";
    rows.set(key, (rows.get(key) || 0) + 1);
  });
  return [...rows.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function openProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  const projectMilestones = milestones.filter((item) => item.projectId === projectId);
  $("#drawer").innerHTML = `<div class="drawer-header">
    <div><p class="eyebrow">${project.id} · ${project.family || "Project"}</p><h2>${project.name}</h2></div>
    <button class="ghost-button" data-close-drawer>关闭</button>
  </div>
  <div class="detail-grid">
    ${detail("业务部门", project.biz)}
    ${detail("当前 PM", project.pm)}
    ${detail("产品经理", project.product)}
    ${detail("技术负责人", project.tech)}
    ${detail("当前阶段", project.status)}
    ${detail("复杂度", project.complexity)}
    ${detail("系统健康", badge(project.health))}
    ${detail("展示健康", badge(effectiveHealth(project)))}
  </div>
  <div class="grid two" style="margin-top:16px">
    <section class="panel"><h2>里程碑明细</h2><div class="table-wrap"><table><thead><tr><th>里程碑</th><th>计划开始</th><th>计划结束</th><th>实际开始</th><th>实际结束</th><th>偏差</th><th>状态</th><th>备注</th></tr></thead><tbody>${projectMilestones.map((m) => `<tr><td>${m.name}</td><td>${m.plannedStart}</td><td>${m.plannedEnd}</td><td>${m.actualStart || "-"}</td><td>${m.actualEnd || "-"}</td><td>${m.delay} 天</td><td>${badge(m.state)}</td><td>${m.note}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="panel"><h2>PMO 手动覆盖</h2><label>健康度<select><option>红灯</option><option selected>黄灯</option><option>绿灯</option></select></label><label style="margin-top:10px">覆盖原因<textarea rows="5">${project.overrideNote || "说明 PMO 判断依据，保存后覆盖系统计算状态。"}</textarea></label><div class="actions" style="margin-top:12px"><button class="primary-button" data-action="save-override">保存覆盖</button></div><div class="panel" style="margin-top:16px;background:var(--surface-2);box-shadow:none"><h3>历史记录</h3><p class="muted">${project.override ? `PMO Admin 于 2026-06-06 标记为 ${healthLabel(project.override)}。` : "暂无手动覆盖记录。"}</p><p class="muted">数据来源：${project.batch}</p></div></section>
  </div>`;
  $("#drawer-backdrop").hidden = false;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}
