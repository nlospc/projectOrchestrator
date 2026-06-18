export const gradeDefinitions = [
  { value: "S", color: "red",    label: "S级", meaning: "复杂度≥7 / 战略关键 / 总监督导",    checkCycle: "双周门禁" },
  { value: "A", color: "orange", label: "A级", meaning: "复杂度5-6 / 跨部门 / 双周门禁",     checkCycle: "双周门禁" },
  { value: "B", color: "yellow", label: "B级", meaning: "复杂度3-4 / 单系统 / 月度门禁",     checkCycle: "月度门禁" },
  { value: "C", color: "green",  label: "C级", meaning: "复杂度≤2 / 运维 / 季度复盘",        checkCycle: "季度复盘" },
  { value: "D", color: "gray",   label: "D级", meaning: "暂停项目 / 待集中决议",              checkCycle: "—"       },
];

export const healthDefinitions = [
  { value: "R", color: "red",    label: "红灯", meaning: "里程碑偏差>15% 或 关键资源缺位 或 业务方升级" },
  { value: "Y", color: "yellow", label: "黄灯", meaning: "里程碑偏差5-15% 或 资源紧张 或 风险待跟踪"   },
  { value: "G", color: "green",  label: "绿灯", meaning: "按计划推进，无关键风险"                      },
];

export const gateDefinitions = [
  { value: "G0", label: "需求受理", deliverables: "需求调研报告 + 初步价值判断 + 需求评审" },
  { value: "G1", label: "立项",     deliverables: "立项书 + 商业目标 + 预算 + 排期 + 干系人" },
  { value: "G2", label: "方案评审", deliverables: "技术方案 + 架构 + UI/UX + 安全合规" },
  { value: "G3", label: "开发就绪", deliverables: "WBS + 资源到位 + 开发环境就绪" },
  { value: "G4", label: "UAT通过",  deliverables: "测试报告 + 缺陷收敛 + 业务签字" },
  { value: "G5", label: "上线验收", deliverables: "上线检查清单 + 回滚方案 + 运维交接" },
  { value: "G6", label: "价值复盘", deliverables: "上线后30/90天KPI回看 + 经验沉淀" },
];

export const gradeByValue  = Object.fromEntries(gradeDefinitions.map((d) => [d.value, d]));
export const healthByValue = Object.fromEntries(healthDefinitions.map((d) => [d.value, d]));
export const gateByValue   = Object.fromEntries(gateDefinitions.map((d) => [d.value, d]));
