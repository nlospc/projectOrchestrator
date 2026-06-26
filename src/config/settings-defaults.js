export const DEFAULT_SETTINGS = {
  healthRules: {
    redRule: "任一关键里程碑红灯即项目红灯",
    yellowRule: "任一关键里程碑黄灯即项目黄灯",
    overridePriority: "PMO 手动覆盖优先于系统计算",
    deviationDays: 7,
  },
  loadThresholds: {
    low: 0.6,
    mid: 1.2,
    bfRisk: 1,
    bfTarget: 3,
  },
  milestoneTemplates: [],
  templateFields: {
    projectRequired: "项目编号、项目名称、健康度、复杂度、项目状态、当前PM",
    resourceRequired: "系统、项目、项目复杂度、项目状态、角色、人员、工时投入占比",
  },
};
