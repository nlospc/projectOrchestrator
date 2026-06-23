export const routeGroups = [
  {
    label: "项目",
    routes: [
      ["cockpit", "执行驾驶舱"],
      ["dashboard", "项目总览"],
      ["projects", "项目里程碑"],
    ],
  },
  {
    label: "资源",
    routes: [
      ["resource", "资源总览"],
      ["matrix", "人员 x 项目"],
      ["workload", "人员负载"],
      ["busfactor", "Bus Factor"],
      ["people", "人员索引"],
    ],
  },
  {
    label: "管理",
    routes: [
      ["upload", "数据上传"],
      ["settings", "设置"],
    ],
  },
];

export const routes = routeGroups.flatMap((group) => group.routes);
export const projectFilterRoutes = ["dashboard", "projects"];
