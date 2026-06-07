import { projectFilterRoutes, routeGroups, routes } from "../config/routes.js";
import { filteredProjects, personStats } from "../core/selectors.js";
import { $ } from "../core/utils.js";
import { projects } from "../data/mock-data.js";
import { state } from "../state/app-state.js";
import { downloadProjectTemplate, downloadResourceTemplate, settingsView, uploadView } from "../views/admin.js";
import { dashboardView, openProject, projectsView, timeline } from "../views/projects.js";
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

  fillSelect("#filter-dept", ["all", ...uniqueValues(sourceProjects.map((project) => project.dept))], "????");
  fillSelect("#filter-biz", ["all", ...uniqueValues(sourceProjects.map((project) => project.biz))], "????");
  fillSelect("#filter-status", ["all", ...uniqueValues(sourceProjects.map((project) => project.status))], "????");
  fillSelect("#filter-pm", ["all", ...uniqueValues(sourceProjects.map((project) => project.pm))], "?? PM");

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
  document.body.dataset.route = state.route;
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

  document.addEventListener("click", (event) => {
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
    const resourceFilter = event.target.closest("[data-resource-filter]");
    if (!resourceFilter) return;
    state.resourceFilters[resourceFilter.dataset.resourceFilter] = resourceFilter.value;
    render();
  });

  $("#reset-filters").addEventListener("click", () => {
    state.filters = { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all" };
    state.resourceFilters = { system: "all", role: "all", outsource: "all" };
    render();
  });
}

export function initApp() {
  bindFilters();
  bindEvents();
  render();
}
