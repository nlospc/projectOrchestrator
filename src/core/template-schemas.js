export const healthValues = ["R", "Y", "G"];

export const projectTemplateSchema = [
  { key: "projectId", targetKey: "id", label: "项目编号", required: true, type: "string", example: "P-2401" },
  { key: "projectName", targetKey: "name", label: "项目名称", required: true, type: "string", example: "临床试验资源驾驶舱" },
  { key: "health", label: "健康度", required: false, type: "health", example: "R", values: healthValues },
  { key: "complexity", label: "复杂度", required: false, type: "number", example: "5" },
  { key: "status", label: "项目状态", required: false, type: "string", example: "UAT" },
  { key: "pm", label: "当前PM", required: false, type: "string", example: "陈安" },
  { key: "category", label: "分类", required: false, type: "string", example: "数字化" },
  { key: "dept", label: "部门组织", required: false, type: "string", example: "研发中心" },
  { key: "biz", label: "业务部门", required: false, type: "string", example: "临床研究" },
  { key: "family", label: "产品族", required: false, type: "string", example: "R2" },
  { key: "gate", label: "门禁状态", required: false, type: "string", example: "Gate 4" },
  { key: "init", label: "立项状态", required: false, type: "string", example: "已立项" },
  { key: "level", label: "建议分级", required: false, type: "string", example: "A" },
  { key: "product", label: "产品经理", required: false, type: "string", example: "林琼" },
  { key: "tech", label: "技术负责人", required: false, type: "string", example: "周远" },
  { key: "batch", label: "数据批次", required: false, type: "string", example: "2026-W23" },
];

export const milestoneTemplateSchema = [
  { key: "milestoneId", targetKey: "id", label: "里程碑ID", required: true, type: "string", example: "P-2401-M1" },
  { key: "projectId", label: "项目编号", required: true, type: "string", example: "P-2401" },
  { key: "milestoneName", targetKey: "name", label: "里程碑名称", required: true, type: "string", example: "立项" },
  { key: "plannedStart", targetKey: "planned_start_date", label: "计划开始日期", required: true, type: "date", example: "2026-01-05" },
  { key: "plannedEnd", targetKey: "planned_end_date", label: "计划结束日期", required: true, type: "date", example: "2026-01-26" },
  { key: "state", label: "状态", required: true, type: "health", example: "G", values: healthValues },
  { key: "actualStart", targetKey: "actual_start_date", label: "实际开始日期", required: false, type: "date", example: "2026-01-08" },
  { key: "actualEnd", targetKey: "actual_end_date", label: "实际结束日期", required: false, type: "date", example: "2026-01-24" },
  { key: "note", label: "备注", required: false, type: "string", example: "按计划推进" },
];

export const overrideTemplateSchema = [
  { key: "projectId", label: "项目编号", required: true, type: "string", example: "P-2401" },
  { key: "overrideHealth", targetKey: "override", label: "覆盖健康度", required: true, type: "health", example: "R", values: healthValues },
  { key: "overrideNote", label: "覆盖原因", required: false, type: "string", example: "UAT 环境阻塞，PMO 标记红灯" },
  { key: "updatedBy", label: "更新人", required: false, type: "string", example: "PMO Admin" },
  { key: "updatedAt", label: "更新时间", required: false, type: "date", example: "2026-06-06" },
];

export const resourceTemplateSchema = [
  { key: "allocationId", targetKey: "id", label: "分配ID", required: true, type: "string", example: "R2-001" },
  { key: "system", label: "系统", required: true, type: "string", example: "PV" },
  { key: "projectId", label: "项目唯一键", required: true, type: "string", example: "PV / SRtracking" },
  { key: "projectName", label: "项目", required: true, type: "string", example: "SRtracking" },
  { key: "complexity", label: "项目复杂度", required: true, type: "number", example: "3" },
  { key: "status", label: "项目状态", required: true, type: "string", example: "UAT" },
  { key: "role", label: "角色", required: true, type: "string", example: "项目经理" },
  { key: "person", label: "人员", required: true, type: "string", example: "段子琦" },
  { key: "timeRatio", label: "工时投入占比", required: true, type: "ratio", example: "30%" },
  { key: "cat", label: "分类", required: false, type: "string", example: "临床" },
  { key: "dept", label: "部门组织", required: false, type: "string", example: "临床研究组织(CRO)" },
  { key: "biz", label: "业务部门", required: false, type: "string", example: "药物警戒部" },
  { key: "outsourced", label: "是否外包", required: false, type: "boolean", example: "否" },
];

export const templateSchemas = {
  project: projectTemplateSchema,
  milestone: milestoneTemplateSchema,
  override: overrideTemplateSchema,
  resource: resourceTemplateSchema,
};
