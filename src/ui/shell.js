import { projectFilterRoutes, routeGroups, routes } from "../config/routes.js";
import { filteredProjects, personStats } from "../core/selectors.js";
import { $ } from "../core/utils.js";
import { projects } from "../data/mock-data.js";
import { state } from "../state/app-state.js";
import { downloadProjectTemplate, downloadResourceTemplate, settingsView, uploadView } from "../views/admin.js";
import { dashboardView, drawerTabContent, openProject, projectsView, timeline } from "../views/projects.js";
import { appendComment, updateMilestone } from "../core/mutations.js";
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

const routeViews = {
  dashboard: dashboardView,
  projects: projectsView,
  resource: resourceOverviewView,
  matrix: matrixView,
  workload: workloadView,
  busfactor: busFactorView,
  people: peopleView,
  upload: uploadView,
  settings: settingsView,
};

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
}

function goToRoute(nextRoute) {
  if (!routes.some(([id]) => id === nextRoute)) return;
  state.route = nextRoute;
  window.location.hash = nextRoute;
  render();
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

  document.addEventListener("click", async (event) => {
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
    if (actionName === "mock-upload") return toast("????? Excel??? 8 ??????");
    if (actionName === "mock-project-upload") return toast("??????? Excel?Project ? Milestone Sheet ?????");
    if (actionName === "mock-resource-upload") return toast(`??????? Excel?${personStats().length} ?????????`);
    if (actionName === "download-resource-template") return downloadResourceTemplate();
    if (actionName === "download-project-template") return downloadProjectTemplate();
    if (actionName === "export-workload-csv") return exportWorkloadCsv();
    if (actionName === "export-bf-projects") return exportBusFactorProjects();
    if (actionName === "export-bf-people") return exportBusFactorPeople();
    if (actionName === "save-settings") return toast("??????");
    if (actionName === "add-milestone-template") return toast("???????????");
    if (actionName === "save-override") return toast("??? PMO ????????");

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
        updateMilestone(milestoneId, { [field]: newValue }, result.reason);
        refreshDrawerTab();
        toast("计划日期已更新");
      } catch (err) {
        toast(err.message);
        refreshDrawerTab();
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
        appendComment(projectId, input.value.trim());
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

  window.addEventListener("hashchange", () => {
    const nextRoute = window.location.hash.replace("#", "") || "dashboard";
    if (routes.some(([id]) => id === nextRoute)) {
      state.route = nextRoute;
      render();
    }
  });

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

  document.addEventListener("change", (event) => {
    // ── T7: actual date inputs ─────────────────────────────────────────────
    const { actualStart, actualEnd } = event.target.dataset;
    const milestoneIdForActual = actualStart ?? actualEnd;
    if (milestoneIdForActual) {
      const field = actualStart ? "actual_start_date" : "actual_end_date";
      const newValue = event.target.value || null;
      try {
        updateMilestone(milestoneIdForActual, { [field]: newValue });
        refreshDrawerTab();
        toast(newValue ? "日期已更新" : "日期已清除");
      } catch (err) {
        toast(err.message);
        // Revert the input to the stored value
        const m = milestones.find(x => x.id === milestoneIdForActual);
        event.target.value = m?.[field] || "";
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
    state.resourceFilters = { system: "all", role: "all", outsource: "all", projectFocus: null };
    render();
  });
}

export function initApp() {
  bindFilters();
  bindEvents();
  render();
}
