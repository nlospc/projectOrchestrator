import { routes } from "../config/routes.js";

export const state = {
  route: window.location.hash.replace("#", "") || "dashboard",
  selectedProjectId: null,
  filters: { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all" },
  resourceFilters: { system: "all", role: "all", outsource: "all" },
};

if (!routes.some(([id]) => id === state.route)) {
  state.route = "dashboard";
}

if (!routes.some(([id]) => id === state.route)) {
  state.route = "dashboard";
}
