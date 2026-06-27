export const healthValues = ["R", "Y", "G"];

/**
 * cndate = Chinese date string like "2026年7月31日", parsed by importers.js
 * xldate = Excel serial date integer (days since 1899-12-30), also parsed by importers.js
 */
export const projectTemplateSchema = [
  { key: "projectId", targetKey: "id", label: "项目ID", required: true, type: "string" },
  { key: "projectName", targetKey: "name", label: "项目", required: true, type: "string" },
  { key: "category", label: "分类", required: false, type: "string" },
  { key: "dept", label: "部门组织", required: false, type: "string" },
  { key: "biz", label: "业务部门", required: false, type: "string" },
  { key: "contact", label: "业务部门对接人", required: false, type: "string" },
  { key: "family", label: "产品族名称", required: false, type: "string" },
  { key: "gate", label: "门禁状态", required: false, type: "string" },
  { key: "health", label: "健康度(R/Y/G)", required: false, type: "health", values: healthValues },
  { key: "stage", label: "当前阶段(G0-G6)", required: false, type: "string" },
  { key: "complexity", label: "复杂度", required: false, type: "number" },
  { key: "status", label: "项目状态", required: false, type: "string" },
  { key: "init", label: "立项状态", required: false, type: "string" },
  { key: "level", label: "建议分级", required: false, type: "string" },
  { key: "basis", label: "分级依据", required: false, type: "string" },
  { key: "suggestedPm", label: "建议项目经理(交付经理)", required: false, type: "string" },
  { key: "pm", label: "当前PM", required: false, type: "string" },
  { key: "product", label: "产品经理", required: false, type: "string" },
  { key: "tech", label: "技术负责人", required: false, type: "string" },
  { key: "plannedStart", targetKey: "planned_start_date", label: "计划立项完成时间", required: false, type: "cndate" },
  { key: "plannedEnd", targetKey: "planned_end_date", label: "计划上线", required: false, type: "cndate" },
  { key: "plannedUat", label: "计划UAT", required: false, type: "cndate" },
  { key: "deviationDays", label: "偏差天数", required: false, type: "number" },
  { key: "weeklyRisk", label: "本周关键风险", required: false, type: "string" },
  { key: "roi", label: "ROI预估", required: false, type: "string" },
  { key: "notes", label: "决议/备注", required: false, type: "string" },
  { key: "related", label: "关联", required: false, type: "string" },
];

export const projectExtrasKeys = [
  "contact",
  "stage",
  "basis",
  "suggestedPm",
  "plannedUat",
  "deviationDays",
  "weeklyRisk",
  "roi",
  "notes",
  "related",
];

export const milestoneWideTemplateSchema = [
  { key: "projectId", label: "项目ID", required: true, type: "string" },
  { key: "projectName", label: "项目名称", required: true, type: "string" },
  { key: "family", label: "产品族", required: false, type: "string" },
  { key: "product", label: "产品经理", required: false, type: "string" },
  { key: "level", label: "建议分级", required: false, type: "string" },
  { key: "init", label: "立项状态", required: false, type: "string" },
  { key: "stage", label: "当前阶段（G0~G6）", required: false, type: "string" },
  { key: "G0_plan_start", label: "G0计划开始", required: false, type: "xldate" },
  { key: "G0_plan_end", label: "G0计划结束", required: false, type: "xldate" },
  { key: "G0_act_start", label: "G0实际开始", required: false, type: "xldate" },
  { key: "G0_act_end", label: "G0实际结束", required: false, type: "xldate" },
  { key: "G0_status", label: "G0状态", required: false, type: "string" },
  { key: "G0_note", label: "G0备注", required: false, type: "string" },
  { key: "G1_plan_start", label: "G1计划开始", required: false, type: "xldate" },
  { key: "G1_plan_end", label: "G1计划结束", required: false, type: "xldate" },
  { key: "G1_act_start", label: "G1实际开始", required: false, type: "xldate" },
  { key: "G1_act_end", label: "G1实际结束", required: false, type: "xldate" },
  { key: "G1_status", label: "G1状态", required: false, type: "string" },
  { key: "G1_note", label: "G1备注", required: false, type: "string" },
  { key: "G2_plan_start", label: "G2计划开始", required: false, type: "xldate" },
  { key: "G2_plan_end", label: "G2计划结束", required: false, type: "xldate" },
  { key: "G2_act_start", label: "G2实际开始", required: false, type: "xldate" },
  { key: "G2_act_end", label: "G2实际结束", required: false, type: "xldate" },
  { key: "G2_status", label: "G2状态", required: false, type: "string" },
  { key: "G2_note", label: "G2备注", required: false, type: "string" },
  { key: "G3_plan_start", label: "G3计划开始", required: false, type: "xldate" },
  { key: "G3_plan_end", label: "G3计划结束", required: false, type: "xldate" },
  { key: "G3_act_start", label: "G3实际开始", required: false, type: "xldate" },
  { key: "G3_act_end", label: "G3实际结束", required: false, type: "xldate" },
  { key: "G3_status", label: "G3状态", required: false, type: "string" },
  { key: "G3_note", label: "G3备注", required: false, type: "string" },
  { key: "G4_plan_start", label: "G4计划开始", required: false, type: "xldate" },
  { key: "G4_plan_end", label: "G4计划结束", required: false, type: "xldate" },
  { key: "G4_act_start", label: "G4实际开始", required: false, type: "xldate" },
  { key: "G4_act_end", label: "G4实际结束", required: false, type: "xldate" },
  { key: "G4_status", label: "G4状态", required: false, type: "string" },
  { key: "G4_note", label: "G4备注", required: false, type: "string" },
  { key: "G5_plan_start", label: "G5计划开始", required: false, type: "xldate" },
  { key: "G5_plan_end", label: "G5计划结束", required: false, type: "xldate" },
  { key: "G5_act_start", label: "G5实际开始", required: false, type: "xldate" },
  { key: "G5_act_end", label: "G5实际结束", required: false, type: "xldate" },
  { key: "G5_status", label: "G5状态", required: false, type: "string" },
  { key: "G5_note", label: "G5备注", required: false, type: "string" },
  { key: "G6_plan_start", label: "G6计划开始", required: false, type: "xldate" },
  { key: "G6_plan_end", label: "G6计划结束", required: false, type: "xldate" },
  { key: "G6_act_start", label: "G6实际开始", required: false, type: "xldate" },
  { key: "G6_act_end", label: "G6实际结束", required: false, type: "xldate" },
  { key: "G6_status", label: "G6状态", required: false, type: "string" },
  { key: "G6_note", label: "G6备注", required: false, type: "string" },
];

export const milestoneTemplateSchema = milestoneWideTemplateSchema; // backward-compat alias

export const overrideTemplateSchema = [
  { key: "projectId", label: "项目编号", required: true, type: "string", example: "P-2401" },
  { key: "overrideHealth", targetKey: "override", label: "覆盖健康度", required: true, type: "health", example: "R", values: healthValues },
  { key: "overrideNote", label: "覆盖原因", required: false, type: "string", example: "UAT 环境阻塞，PMO 标记红灯" },
  { key: "updatedBy", label: "更新人", required: false, type: "string", example: "PMO Admin" },
  { key: "updatedAt", label: "更新时间", required: false, type: "date", example: "2026-06-06" },
];

export const resourceTemplateSchema = [
  { key: "allocationId", targetKey: "id", label: "分配ID", required: true, type: "string" },
  { key: "projectId", label: "项目唯一键", required: true, type: "string" },
  { key: "projectName", label: "项目", required: true, type: "string" },
  { key: "role", label: "角色", required: true, type: "string" },
  { key: "person", label: "人员", required: true, type: "string" },
  { key: "timeRatio", label: "工时投入占比", required: true, type: "ratio" },
  { key: "outsourced", label: "是否外包", required: false, type: "boolean" },
];

export const templateSchemas = {
  project: projectTemplateSchema,
  milestone: milestoneTemplateSchema,
  override: overrideTemplateSchema,
  resource: resourceTemplateSchema,
};
