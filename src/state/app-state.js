import { routes } from "../config/routes.js";

export const state = {
  route: window.location.hash.replace("#", "") || "cockpit",
  selectedProjectId: null,
  filters: { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all", groupBy: "family", includeArchived: false },
  resourceFilters: { system: "all", role: "all", outsource: "all", projectFocus: null, biz: "all", family: "all", dept: "all", status: "all", health: "all" },
  drawer: { projectId: null, scrollToMilestoneId: null, activeTab: "milestones" },
  uploads: {},
  settings: { delayRedThresholdDays: 7, redOverdueDays: 7 },
  today: (() => {
    const param = new URLSearchParams(window.location.search).get("today");
    return param ? new Date(param) : new Date(new Date().toISOString().slice(0, 10));
  })(),
};

if (!routes.some(([id]) => id === state.route)) {
  state.route = "cockpit";
}

if (!routes.some(([id]) => id === state.route)) {
  state.route = "cockpit";
}
