import { projectFilterRoutes, routeGroups, routes } from "../config/routes.js";
import { filteredProjects, personStats } from "../core/selectors.js";
import { $ } from "../core/utils.js";
import { apiImportAllocations, apiImportMilestones, apiImportOverrides, apiImportProjects, apiUpsertPerson, apiDeletePerson, apiSaveSettings, appSettings, bootstrap, milestones, personInfo, projects } from "../core/data-store.js";
import { parseMilestoneCsv, parseMilestoneXlsx, parseOverrideCsv, parseProjectCsv, parseResourceAllocationCsv, parseResourceAllocationXlsx } from "../core/importers.js";
import { state } from "../state/app-state.js";
import { downloadProjectTemplate, downloadResourceTemplate, personInfoView, reconciliationView, settingsView, uploadView } from "../views/admin.js";
import { dashboardView, drawerTabContent, openProject, projectsView, timeline } from "../views/projects.js";
import { cockpitView } from "../views/cockpit.js";
import { appendComment, setProjectOverride, updateMilestone } from "../core/mutations.js";
import { openReasonModal } from "../ui/reason-modal.js";
import {
  busFactorView,
  exportBusFactorPeople,
  exportBusFactorProjects,
  exportWorkloadCsv,
  matrixView,
  openPerson,
  peopleCard,
  peopleView,
  resourceOverviewView,
  workloadView,
} from "../views/resource.js";

const globalFilterConfig = {
  period: "#filter-period",
  dept: "#filter-dept",
  biz: "#filter-biz",
  status: "#filter-status",
  health: "#filter-health",
  pm: "#filter-pm",
};

let eventsBound = false;
let filtersBound = false;
let suppressSyncUntil = 0;

function triggerDownload(path) {
  const link = document.createElement("a");
  link.href = path;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function initNav() {
  $("#nav").innerHTML = routeGroups
    .map((group) =>       `<div class="nav-group">
        <div class="nav-group-label">${group.label}</div>
        ${group.routes.map(([id, label]) => `<button data-route="${id}" class="${state.route === id ? "active" : ""}">${label}</button>`).join("")}
      </div>`
    )
    .join("");
}

function fillSelect(selector, values, allLabel) {
  const element = $(selector);
  element.innerHTML = values
    .map((value) => `<option value="${value}">${value === "all" ? allLabel : value}</option>`)
    .join("");
}

function syncFiltersFromState() {
  const sourceProjects = projects;
  const uniqueValues = (items) => [...new Set(items)].filter(Boolean);

  fillSelect("#filter-dept", ["all", ...uniqueValues(sourceProjects.map((project) => project.dept))], "全部组织");
  fillSelect("#filter-biz", ["all", ...uniqueValues(sourceProjects.map((project) => project.biz))], "全部业务部门");
  fillSelect("#filter-status", ["all", ...uniqueValues(sourceProjects.map((project) => project.status))], "全部项目状态");
  fillSelect("#filter-pm", ["all", ...uniqueValues(sourceProjects.map((project) => project.pm))], "全部项目经理");

  Object.entries(globalFilterConfig).forEach(([key, selector]) => {
    const element = $(selector);
    if (element) element.value = state.filters[key];
  });
}

function bindFilters() {
  if (filtersBound) return;
  filtersBound = true;
  Object.entries(globalFilterConfig).forEach(([key, selector]) => {
    const element = $(selector);
    if (!element) return;
    element.addEventListener("change", () => {
      state.filters[key] = element.value;
      render();
    });
  });
}

function closeDrawer() {
  const drawer = $("#drawer");
  const backdrop = $("#drawer-backdrop");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  window.setTimeout(() => {
    element.hidden = true;
  }, 2200);
}

function setUploadStatus(kind, tone, message) {
  state.uploads[kind] = { tone, message };
  if (state.route === "upload") render();
}

const importHandlers = {
  project: {
    label: "Project Excel",
    parse: parseProjectCsv,
    send: apiImportProjects,
  },
  milestone: {
    label: "Milestone Excel",
    parse: (text) => parseMilestoneCsv(text),
    parseXlsx: (workbook) => {
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      return parseMilestoneXlsx(aoa);
    },
    send: apiImportMilestones,
  },
  override: {
    label: "Override CSV",
    parse: (text) => parseOverrideCsv(text),
    send: apiImportOverrides,
  },
  resource: {
    label: "Resource Excel",
    parse: (text) => parseResourceAllocationCsv(text, projects),
    parseXlsx: (workbook) => {
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      return parseResourceAllocationXlsx(aoa, personInfo, projects);
    },
    send: apiImportAllocations,
  },
};

async function readCsvFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;
  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return utf8;
  }
}

async function readXlsxFile(file) {
  const data = await file.arrayBuffer();
  if (!window.XLSX) throw new Error("Excel 解析组件未加载");
  return window.XLSX.read(data, { type: "array" });
}

async function previewImport(kind, rows) {
  const response = await fetch(`/api/import/${kind}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

async function loadImportHistory() {
  const container = document.getElementById("import-history-list");
  if (!container) return;
  try {
    const response = await fetch("/api/import/history");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { batches } = await response.json();
    if (!batches.length) {
      container.innerHTML = '<p class="muted">暂无导入记录</p>';
      return;
    }
    const table = document.createElement("table");
    table.className = "def-table";
    table.innerHTML = "<thead><tr><th>时间</th><th>类型</th><th>文件名</th><th>行数</th><th>操作人</th></tr></thead>";
    const body = document.createElement("tbody");
    batches.forEach((batch) => {
      const row = document.createElement("tr");
      const cells = [
        new Date(batch.imported_at).toLocaleString("zh-CN"),
        null,
        batch.filename || "-",
        batch.row_count,
        batch.imported_by || "-",
      ];
      cells.forEach((value, i) => {
        const cell = document.createElement("td");
        if (i === 1) {
          const badge = document.createElement("span");
          badge.className = `history-kind-badge ${batch.kind}`;
          badge.textContent = batch.kind;
          cell.appendChild(badge);
        } else {
          cell.textContent = String(value);
        }
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    container.replaceChildren(table);
  } catch (error) {
    container.textContent = `加载失败：${error.message}`;
  }
}

async function loadLinkProposals() {
  const container = document.getElementById('link-proposed-list');
  if (!container) return;
  try {
    const res = await fetch('/api/links');
    if (!res.ok) { container.innerHTML = `<p class="muted">加载失败</p>`; return; }
    const { links } = await res.json();
    const proposed = links.filter((l) => l.status === 'proposed');
    if (proposed.length === 0) {
      container.innerHTML = `<p class="muted">暂无待确认提案</p>`;
      return;
    }
    container.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>资源团队</th><th>候选项目</th><th>置信度</th><th>操作</th></tr></thead>
      <tbody>${proposed.map((l) => `<tr>
        <td>${escapeHtml(l.resourceKey)}</td>
        <td>${l.projectId ? escapeHtml(projects.find(p => p.id === l.projectId)?.name || l.projectId) : '<span class="muted">未找到</span>'}</td>
        <td>${l.confidence != null ? Math.round(l.confidence * 100) + '%' : '—'}</td>
        <td>
          <button class="ghost-button" data-action="link-confirm" data-link-id="${escapeHtml(l.id)}" data-project-id="${escapeHtml(l.projectId || '')}">确认</button>
          <button class="ghost-button" data-action="link-reject" data-link-id="${escapeHtml(l.id)}">驳回</button>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch (err) {
    if (container) container.innerHTML = `<p class="muted">加载失败：${escapeHtml(err.message)}</p>`;
  }
}

const routeViews = {
  cockpit: cockpitView,
  dashboard: dashboardView,
  projects: projectsView,
  resource: resourceOverviewView,
  matrix: matrixView,
  workload: workloadView,
  busfactor: busFactorView,
  people: peopleView,
  upload: uploadView,
  settings: settingsView,
  links: reconciliationView,
  personnel: personInfoView,
};

function setupMonitorBoardScrollSync() {
  adjustMonitorBoardHeight();
  window.addEventListener("resize", () => adjustMonitorBoardHeight());
}

function adjustMonitorBoardHeight() {
  const monitorBoard = document.querySelector("[data-monitor-board]");
  if (!monitorBoard) return;

  const rect = monitorBoard.getBoundingClientRect();
  const topOffset = rect.top;

  const availableHeight = window.innerHeight - topOffset - 22;
  const constrainedHeight = Math.max(420, availableHeight);

  monitorBoard.style.maxHeight = `${constrainedHeight}px`;
}

export function render() {
  initNav();
  syncFiltersFromState();
  const routeLabel = routes.find(([id]) => id === state.route)?.[1] || "Dashboard";
  const showProjectFilters = projectFilterRoutes.includes(state.route);
  document.body.dataset.activeRoute = state.route;
  $("#page-title").textContent = routeLabel;
  $("#section-eyebrow").textContent = state.route === "dashboard" ? "Project Office" : "PMO Prototype";
  document.body.classList.toggle("settings-route", state.route === "settings");
  document.body.classList.toggle("no-filter-route", !showProjectFilters);
  const globalFilter = $(".filter-bar");
  if (globalFilter) globalFilter.hidden = !showProjectFilters;
  const view = $("#view");
  view.innerHTML = (routeViews[state.route] || dashboardView)();
  if (state.route === "upload") loadImportHistory();
  if (state.route === 'links') loadLinkProposals();
  if (state.route === "projects") {
    setupMonitorBoardScrollSync();
  }
}

function goToRoute(nextRoute) {
  if (!routes.some(([id]) => id === nextRoute)) return;
  state.route = nextRoute;
  window.location.hash = nextRoute;
  render();
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function collectSettingsPayload() {
  const inputs = document.querySelectorAll("[data-settings-path]");
  const payload = JSON.parse(JSON.stringify(appSettings.payload));
  inputs.forEach((el) => {
    const path = el.dataset.settingsPath.split(".");
    if (path.some((k) => FORBIDDEN_KEYS.has(k))) return;
    let node = payload;
    for (let i = 0; i < path.length - 1; i++) {
      if (!node[path[i]] || typeof node[path[i]] !== "object") node[path[i]] = {};
      node = node[path[i]];
    }
    const key = path[path.length - 1];
    const raw = el.value;
    if (el.type === "number") {
      const num = Number(raw);
      node[key] = Number.isFinite(num) ? num : null;
    } else {
      node[key] = raw;
    }
  });
  return payload;
}

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  function refreshDrawerTab() {
    const content = document.getElementById("drawer-tab-content");
    if (content && state.drawer.projectId) {
      content.innerHTML = drawerTabContent(state.drawer.projectId, state.drawer.activeTab, state.today);
    }
  }

  function refreshProjectTimeline() {
    const wrap = document.getElementById("project-timeline-wrap");
    if (!wrap) return;
    const term = document.getElementById("project-search")?.value.trim().toLowerCase() ?? "";
    const rows = filteredProjects().filter((project) =>
      !term || [project.id, project.name, project.pm, project.product, project.tech].join(" ").toLowerCase().includes(term)
    );
    wrap.innerHTML = timeline(rows);
    setupMonitorBoardScrollSync();
  }

  function suppressAutoSync(durationMs = 15000) {
    suppressSyncUntil = Math.max(suppressSyncUntil, Date.now() + durationMs);
  }

  document.addEventListener("click", async (event) => {
    const sysFilterRow = event.target.closest("[data-resource-filter-system]");
    if (sysFilterRow) {
      state.resourceFilters.system = sysFilterRow.dataset.resourceFilterSystem;
      goToRoute("resource");
      return;
    }

    const groupByToggle = event.target.closest("[data-groupby-toggle]");
    if (groupByToggle) {
      const menu = groupByToggle.parentElement?.querySelector("[data-groupby-menu]");
      if (!menu) return;
      const nextOpen = menu.hidden;
      document.querySelectorAll("[data-groupby-menu]").forEach((item) => { item.hidden = true; });
      menu.hidden = !nextOpen;
      groupByToggle.setAttribute("aria-expanded", String(nextOpen));
      return;
    }

    const groupByOption = event.target.closest("[data-groupby-option]");
    if (groupByOption) {
      state.filters.groupBy = groupByOption.dataset.groupbyOption;
      render();
      return;
    }

    if (!event.target.closest(".gantt-group-control")) {
      document.querySelectorAll("[data-groupby-menu]").forEach((menu) => { menu.hidden = true; });
      document.querySelectorAll("[data-groupby-toggle]").forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
      });
    }

    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      goToRoute(routeButton.dataset.route);
      return;
    }

    const action = event.target.closest("[data-action]");
    const actionName = action?.dataset.action;
    if (actionName === "health-filter") {
      state.filters.health = action.dataset.value;
      $("#filter-health").value = action.dataset.value;
      goToRoute("projects");
      return;
    }
    if (actionName === "clear-project-focus") {
      state.resourceFilters.projectFocus = null;
      render();
      return;
    }
    if (actionName === "mock-upload") return toast("已从 Excel 导入 8 个项目");
    if (actionName === "mock-project-upload") return toast("已从 Excel 导入 Project 和 Milestone Sheet 数据");
    if (actionName === "mock-resource-upload") return toast(`已从 Excel 导入 ${personStats().length} 条资源记录`);
    if (actionName === "download-resource-template") return downloadResourceTemplate();
    if (actionName === "download-project-template") return downloadProjectTemplate();
    if (actionName === "export-projects-csv") return triggerDownload("/api/export/projects");
    if (actionName === "export-milestones-csv") return triggerDownload("/api/export/milestones");
    if (actionName === "export-overrides-csv") return triggerDownload("/api/export/overrides");
    if (actionName === "export-allocations-csv") return triggerDownload("/api/export/allocations");
    if (actionName === "export-person-info-csv") return triggerDownload("/api/export/person-info");
    if (actionName === "export-all-xlsx") return triggerDownload("/api/export/all.xlsx");
    if (actionName === "export-all-csv") {
      triggerDownload("/api/export/projects");
      window.setTimeout(() => triggerDownload("/api/export/milestones"), 80);
      window.setTimeout(() => triggerDownload("/api/export/overrides"), 160);
      window.setTimeout(() => triggerDownload("/api/export/allocations"), 240);
      return;
    }
    if (actionName === "export-workload-csv") return exportWorkloadCsv();
    if (actionName === "export-bf-projects") return exportBusFactorProjects();
    if (actionName === "export-bf-people") return exportBusFactorPeople();
    if (actionName === "save-settings") {
      const payload = collectSettingsPayload();
      try {
        await apiSaveSettings(payload);
        toast("设置已保存");
        render();
      } catch (err) {
        toast(`保存失败：${err.message}`);
      }
      return;
    }
    if (actionName === "add-milestone-template") return toast("里程碑节点已新增");
    if (actionName === 'link-load') {
      loadLinkProposals();
      return;
    }
    if (actionName === 'link-propose') {
      try {
        const res = await fetch('/api/links/propose', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast(`匹配完成：${data.proposed} 条提案`);
        loadLinkProposals();
      } catch (err) { toast(`匹配失败：${err.message}`); }
      return;
    }
    if (actionName === 'link-confirm') {
      try {
        const res = await fetch(`/api/links/${action.dataset.linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed', projectId: action.dataset.projectId || null, confirmedBy: 'PMO Admin' }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await bootstrap();
        render();
        toast('已确认关联');
      } catch (err) { toast(`操作失败：${err.message}`); }
      return;
    }
    if (actionName === 'link-reject') {
      try {
        const res = await fetch(`/api/links/${action.dataset.linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', confirmedBy: 'PMO Admin' }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        loadLinkProposals();
        toast('已驳回');
      } catch (err) { toast(`操作失败：${err.message}`); }
      return;
    }
    if (actionName === 'link-manual') {
      const resourceKey = action.dataset.resourceKey;
      const select = document.querySelector(`.link-project-select[data-resource-key="${CSS.escape(resourceKey)}"]`);
      const projectId = select?.value;
      if (!projectId) { toast('请先选择项目'); return; }
      try {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceKey, projectId, confirmedBy: 'PMO Admin' }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await bootstrap();
        render();
        toast('手动关联成功');
      } catch (err) { toast(`关联失败：${err.message}`); }
      return;
    }
    if (actionName === "save-override") {
      const projectId = action.dataset.projectId;
      const value = document.getElementById("override-health-select")?.value ?? "";
      const note = document.getElementById("override-note-input")?.value ?? "";
      try {
        await setProjectOverride(projectId, value, note);
        openProject(projectId);
        toast(value ? "已保存手动覆盖" : "已清除手动覆盖");
      } catch (err) {
        toast(err.message);
      }
      return;
    }

    // ── Personnel CRUD ─────────────────────────────────────────────────────
    if (actionName === "person-edit-toggle") {
      const row = action.closest("tr");
      const name = action.dataset.name;
      const isEditing = row?.classList.contains("editing");
      document.querySelectorAll("tr.editing").forEach((r) => r.classList.remove("editing"));
      if (!isEditing && row) row.classList.add("editing");
      return;
    }
    if (actionName === "person-save") {
      const name = action.dataset.name;
      const row = action.closest("tr");
      const roleInput = row?.querySelector(".person-role-input");
      const outsourcedInput = row?.querySelector(".person-outsourced-input");
      try {
        await apiUpsertPerson({ name, role: roleInput?.value ?? '', outsourced: outsourcedInput?.checked ?? false });
        row?.classList.remove("editing");
        render();
        toast(`已保存 ${name}`);
      } catch (err) { toast(err.message); }
      return;
    }
    if (actionName === "person-delete") {
      const name = action.dataset.name;
      if (!window.confirm(`确认删除 ${name}？`)) return;
      try {
        await apiDeletePerson(name);
        render();
        toast(`已删除 ${name}`);
      } catch (err) { toast(err.message); }
      return;
    }
    if (actionName === "person-add-save") {
      const nameInput = document.getElementById("new-person-name");
      const roleInput = document.getElementById("new-person-role");
      const outsourcedInput = document.getElementById("new-person-outsourced");
      const name = nameInput?.value?.trim() ?? '';
      if (!name) return toast("姓名不能为空");
      try {
        await apiUpsertPerson({ name, role: roleInput?.value ?? '', outsourced: outsourcedInput?.checked ?? false });
        if (nameInput) nameInput.value = '';
        if (roleInput) roleInput.value = '';
        if (outsourcedInput) outsourcedInput.checked = false;
        render();
        toast(`已添加 ${name}`);
      } catch (err) { toast(err.message); }
      return;
    }

    // ── T7: drawer tab switch ──────────────────────────────────────────────
    const tabBtn = event.target.closest("[data-drawer-tab]");
    if (tabBtn) {
      state.drawer.activeTab = tabBtn.dataset.drawerTab;
      document.querySelectorAll(".drawer-tab-btn").forEach(btn => {
        const active = btn.dataset.drawerTab === state.drawer.activeTab;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      refreshDrawerTab();
      return;
    }

    // ── T7: inline planned-date edit flow ─────────────────────────────────
    const editPlannedBtn = event.target.closest("[data-edit-planned]");
    if (editPlannedBtn) {
      const [milestoneId, field] = editPlannedBtn.dataset.editPlanned.split(":");
      const m = milestones.find(x => x.id === milestoneId);
      if (!m) return;
      const cell = document.querySelector(`[data-planned-cell="${milestoneId}:${field}"]`);
      if (!cell) return;
      const current = m[field] || "";
      cell.innerHTML = `
        <input type="date" id="planned-date-edit" value="${current}" style="width:130px">
        <button class="small-button" data-confirm-planned="${milestoneId}:${field}">确认</button>
        <button class="small-button" data-cancel-planned>取消</button>`;
      return;
    }

    const confirmPlannedBtn = event.target.closest("[data-confirm-planned]");
    if (confirmPlannedBtn) {
      const [milestoneId, field] = confirmPlannedBtn.dataset.confirmPlanned.split(":");
      const m = milestones.find(x => x.id === milestoneId);
      const input = document.getElementById("planned-date-edit");
      const newValue = input?.value;
      if (!newValue || !m) return;
      const result = await openReasonModal({
        field,
        oldValue: m[field],
        newValue,
        required: true,
      });
      if (!result) { refreshDrawerTab(); return; }
      try {
        await updateMilestone(milestoneId, { [field]: newValue }, result.reason);
        refreshDrawerTab();
        refreshProjectTimeline();
        toast("计划日期已更新");
      } catch (err) {
        toast(err.message);
        refreshDrawerTab();
        refreshProjectTimeline();
      }
      return;
    }

    if (event.target.closest("[data-cancel-planned]")) {
      refreshDrawerTab();
      return;
    }

    // ── T7: comment submit ────────────────────────────────────────────────
    const submitCommentBtn = event.target.closest("[data-submit-comment]");
    if (submitCommentBtn) {
      const projectId = submitCommentBtn.dataset.submitComment;
      const input = document.getElementById("comment-input");
      if (!input?.value.trim()) return toast("评论内容不能为空");
      try {
        await appendComment(projectId, input.value.trim());
        state.drawer.activeTab = "comments";
        refreshDrawerTab();
        toast("评论已提交");
      } catch (err) {
        toast(err.message);
      }
      return;
    }

    // ── T9 stub: goto matrix with projectFocus ────────────────────────────
    const gotoMatrixBtn = event.target.closest("[data-goto-matrix]");
    if (gotoMatrixBtn) {
      state.resourceFilters.projectFocus = gotoMatrixBtn.dataset.gotoMatrix;
      closeDrawer();
      goToRoute("matrix");
      return;
    }

    const projectButton = event.target.closest("[data-open-project]");
    if (projectButton) return openProject(projectButton.dataset.openProject);

    const personButton = event.target.closest("[data-open-person]");
    if (personButton) return openPerson(personButton.dataset.openPerson);

    if (event.target.closest("[data-close-drawer]") || event.target.id === "drawer-backdrop") {
      closeDrawer();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest("label")?.querySelector("input[type='file'][data-import]")) {
      suppressAutoSync();
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("label")?.querySelector("input[type='file'][data-import]")) {
      suppressAutoSync();
    }
  });

  window.addEventListener("hashchange", () => {
    const nextRoute = window.location.hash.replace("#", "") || "dashboard";
    if (routes.some(([id]) => id === nextRoute)) {
      state.route = nextRoute;
      render();
    }
  });

  // ── Multi-user re-sync ───────────────────────────────────────────────────
  // The DB is shared across PMO users, so this tab's cache can go stale. Re-pull
  // the whole bootstrap when the tab regains focus (cheap for a cockpit), and
  // immediately after a `REV_CONFLICT` write (someone else saved first).
  let syncing = false;
  let lastSyncAt = Date.now();
  async function syncFromServer({ force = false } = {}) {
    if (syncing) return;
    if (!force && Date.now() < suppressSyncUntil) return;
    if (!force && Date.now() - lastSyncAt < 1500) return; // de-dupe focus+visibility
    syncing = true;
    try {
      await bootstrap();
      lastSyncAt = Date.now();
      render();
      refreshDrawerTab();
    } catch {
      // Network blip — keep showing the current cache rather than blanking out.
    } finally {
      syncing = false;
    }
  }
  window.addEventListener("focus", () => syncFromServer());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncFromServer(); });
  window.addEventListener("pmo:stale", () => syncFromServer({ force: true }));

  document.addEventListener("input", (event) => {
    if (event.target.id === "project-search") {
      const term = event.target.value.trim().toLowerCase();
      const rows = filteredProjects().filter((project) =>
        [project.id, project.name, project.pm, project.product, project.tech].join(" ").toLowerCase().includes(term)
      );
      $("#project-timeline-wrap").innerHTML = timeline(rows);
      return;
    }
    if (event.target.id === "people-search") {
      const term = event.target.value.trim().toLowerCase();
      const rows = personStats().filter((person) =>
        [person.person, person.role, person.dept].join(" ").toLowerCase().includes(term)
      );
      $("#people-grid").innerHTML = rows.map((person) => peopleCard(person)).join("");
    }
  });

  document.addEventListener("change", async (event) => {
    // ── CSV/Excel import (admin upload dropzones) ──────────────────────────
    const importKind = event.target.dataset.import;
    if (importKind) {
      const file = event.target.files?.[0];
      if (!file) {
        suppressSyncUntil = 0;
        return;
      }
      suppressAutoSync();
      const handler = importHandlers[importKind];
      if (!handler) {
        suppressSyncUntil = 0;
        return;
      }
      setUploadStatus(importKind, "busy", `正在读取 ${file.name}...`);
      try {
        const extension = file.name.split(".").pop()?.toLowerCase();
        let parsed;
        if (extension === "xlsx" || extension === "xls") {
          const workbook = await readXlsxFile(file);
          if (!workbook.SheetNames[0]) throw new Error("Excel 文件中没有工作表");
          if (handler.parseXlsx) {
            setUploadStatus(importKind, "busy", `正在解析 ${handler.label}...`);
            parsed = handler.parseXlsx(workbook);
          } else {
            const text = window.XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
            setUploadStatus(importKind, "busy", `正在解析 ${handler.label}...`);
            parsed = handler.parse(text);
          }
        } else {
          const text = await readCsvFile(file);
          setUploadStatus(importKind, "busy", `正在解析 ${handler.label}...`);
          parsed = handler.parse(text);
        }
        if (parsed.errors.length) {
          const e = parsed.errors[0];
          throw new Error(`第 ${e.row} 行 ${e.field}：${e.message}`);
        }
        const unknownRoles = parsed.warnings.filter((warning) => warning.code === "unknown-role");
        if (unknownRoles.length) {
          const lines = unknownRoles
            .map((warning) => `第 ${warning.row} 行 · 人员「${warning.person || "—"}」· 角色「${warning.role || "—"}」`)
            .join("\n");
          window.alert(
            `⚠ 检测到 ${unknownRoles.length} 个未知角色（不在权重矩阵中）。\n` +
              `这些记录的负荷将按 0 计算，不计入工作量统计：\n\n${lines}\n\n` +
              `如需计入，请先在角色权重矩阵中补充该角色，或修正角色名称。`
          );
        }
        setUploadStatus(importKind, "busy", `校验通过，正在生成差异预览...`);
        const diff = await previewImport(importKind, parsed.validRows);
        const confirmation = `即将导入：新增 ${diff.added} 行，变更 ${diff.changed} 行，删除 ${diff.removed} 行，不变 ${diff.unchanged} 行。确认导入？`;
        setUploadStatus(importKind, "busy", confirmation);
        if (!window.confirm(confirmation)) {
          setUploadStatus(importKind, "idle", `已取消导入 · ${file.name}`);
          return;
        }
        setUploadStatus(importKind, "busy", `正在导入 ${parsed.validRows.length} 行...`);
        const result = await handler.send(parsed.validRows, file.name);
        render();
        const warn = parsed.warnings.length ? `（${parsed.warnings.length} 条警告）` : "";
        setUploadStatus(importKind, "success", `已全量覆盖 ${result.count} 行${warn} · ${file.name}`);
        toast(`已全量覆盖 ${result.count} 行${warn}`);
      } catch (err) {
        setUploadStatus(importKind, "error", `导入失败：${err.message}`);
        toast(`导入失败：${err.message}`);
      } finally {
        event.target.value = ""; // allow re-selecting the same file
        suppressSyncUntil = 0;
      }
      return;
    }

    // ── T7: actual date inputs ─────────────────────────────────────────────
    const { actualStart, actualEnd } = event.target.dataset;
    const milestoneIdForActual = actualStart ?? actualEnd;
    if (milestoneIdForActual) {
      const field = actualStart ? "actual_start_date" : "actual_end_date";
      const newValue = event.target.value || null;
      try {
        await updateMilestone(milestoneIdForActual, { [field]: newValue });
        refreshDrawerTab();
        refreshProjectTimeline();
        toast(newValue ? "日期已更新" : "日期已清除");
      } catch (err) {
        toast(err.message);
        // Revert the input to the stored value
        const m = milestones.find(x => x.id === milestoneIdForActual);
        event.target.value = m?.[field] || "";
        refreshProjectTimeline();
      }
      return;
    }

    const projectFilter = event.target.closest("[data-project-filter]");
    if (projectFilter) {
      const key = projectFilter.dataset.projectFilter;
      state.filters[key] = projectFilter.type === "checkbox" ? projectFilter.checked : projectFilter.value;
      render();
      return;
    }

    const resourceFilter = event.target.closest("[data-resource-filter]");
    if (!resourceFilter) return;
    state.resourceFilters[resourceFilter.dataset.resourceFilter] = resourceFilter.value;
    render();
  });

  $("#reset-filters").addEventListener("click", () => {
    state.filters = { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all", groupBy: "none", includeArchived: false };
    state.resourceFilters = { system: "all", role: "all", outsource: "all", projectFocus: null, biz: "all", dept: "all", status: "all", health: "all" };
    render();
  });
}

export function initApp() {
  bindFilters();
  bindEvents();
  render();
}
