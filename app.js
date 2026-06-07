const routeGroups = [
  {
    label: "项目",
    routes: [
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

const routes = routeGroups.flatMap((group) => group.routes);
const projectFilterRoutes = ["dashboard", "projects"];

const statusWeights = {
  "需求调研": 0.1,
  "产品设计": 0.3,
  "产品开发": 1,
  "产品自测": 0.6,
  "UAT": 0.6,
  "部署上线": 0.3,
  "系统运维": 0.03,
  "项目暂停": 0,
};

const roleWeights = {
  "项目经理": { "需求调研": 0.6, "产品设计": 0.7, "产品开发": 0.7, "产品自测": 0.7, "UAT": 0.7, "部署上线": 0.6, "系统运维": 0.2 },
  "产品经理": { "需求调研": 1, "产品设计": 1, "产品开发": 0.8, "产品自测": 0.6, "UAT": 0.6, "部署上线": 0.3, "系统运维": 0.2 },
  "技术负责人": { "需求调研": 0.5, "产品设计": 0.8, "产品开发": 0.9, "产品自测": 0.7, "UAT": 0.7, "部署上线": 0.6, "系统运维": 0.3 },
  "前端": { "需求调研": 0.1, "产品设计": 0.3, "产品开发": 1, "产品自测": 0.6, "UAT": 0.6, "部署上线": 0.3, "系统运维": 0.2 },
  "后端": { "需求调研": 0.1, "产品设计": 0.3, "产品开发": 1, "产品自测": 0.6, "UAT": 0.6, "部署上线": 0.3, "系统运维": 0.2 },
  "测试": { "需求调研": 0.1, "产品设计": 0.2, "产品开发": 0.6, "产品自测": 1, "UAT": 1, "部署上线": 0.4, "系统运维": 0.1 },
  "运维": { "需求调研": 0, "产品设计": 0.1, "产品开发": 0.1, "产品自测": 0.3, "UAT": 0.3, "部署上线": 0.5, "系统运维": 1 },
  "Agent开发": { "需求调研": 0.2, "产品设计": 0.4, "产品开发": 1, "产品自测": 0.6, "UAT": 0.6, "部署上线": 0.3, "系统运维": 0.2 },
  "UI/UX": { "需求调研": 0.3, "产品设计": 0.9, "产品开发": 0.4, "产品自测": 0.2, "UAT": 0.2, "部署上线": 0.1, "系统运维": 0.1 },
  "模型": { "需求调研": 0.4, "产品设计": 0.6, "产品开发": 1, "产品自测": 0.8, "UAT": 0.7, "部署上线": 0.3, "系统运维": 0.2 },
  "架构师": { "需求调研": 0.5, "产品设计": 0.8, "产品开发": 0.8, "产品自测": 0.5, "UAT": 0.4, "部署上线": 0.4, "系统运维": 0.3 },
  "全栈开发工程师": { "需求调研": 0.2, "产品设计": 0.4, "产品开发": 1, "产品自测": 0.7, "UAT": 0.6, "部署上线": 0.4, "系统运维": 0.2 },
};

const projects = [
  { id: "P-2401", category: "数字化", dept: "研发中心", biz: "临床研究", family: "R2", name: "临床试验资源驾驶舱", health: "R", override: "R", overrideNote: "UAT 验收环境阻塞，PMO 标记红灯", gate: "Gate 4", complexity: 5, status: "UAT", init: "已立项", level: "A", pm: "陈安", product: "林琪", tech: "周远", batch: "2026-W23" },
  { id: "P-2402", category: "平台", dept: "技术平台部", biz: "数据平台", family: "DataHub", name: "项目组合数据中台", health: "Y", override: "", overrideNote: "", gate: "Gate 3", complexity: 4, status: "产品开发", init: "已立项", level: "A", pm: "何洁", product: "蒋宁", tech: "杨森", batch: "2026-W23" },
  { id: "P-2403", category: "流程", dept: "运营管理部", biz: "供应链", family: "SCM", name: "供应链里程碑监管", health: "G", override: "", overrideNote: "", gate: "Gate 2", complexity: 3, status: "产品设计", init: "已立项", level: "B", pm: "吴缨", product: "黄蕾", tech: "宋林", batch: "2026-W23" },
  { id: "P-2404", category: "AI", dept: "智能应用部", biz: "医学事务", family: "Agent", name: "医学资料智能审核", health: "Y", override: "Y", overrideNote: "模型评估完成，法规审批待排期", gate: "Gate 3", complexity: 5, status: "产品开发", init: "已立项", level: "A", pm: "赵川", product: "马晓", tech: "唐铮", batch: "2026-W23" },
  { id: "P-2405", category: "运维", dept: "信息技术部", biz: "商业运营", family: "CRM", name: "CRM 稳定性治理", health: "G", override: "", overrideNote: "", gate: "Gate 5", complexity: 2, status: "系统运维", init: "已立项", level: "C", pm: "陈安", product: "罗晨", tech: "梁越", batch: "2026-W23" },
  { id: "P-2406", category: "合规", dept: "质量合规部", biz: "质量管理", family: "QMS", name: "电子审计追踪升级", health: "R", override: "", overrideNote: "", gate: "Gate 4", complexity: 4, status: "部署上线", init: "已立项", level: "A", pm: "方思", product: "苏曼", tech: "杨森", batch: "2026-W23" },
];

const milestoneNames = ["立项", "需求确认", "方案设计", "开发完成", "测试完成", "UAT完成", "部署上线", "验收关闭"];
const milestones = [
  ["P-2401", ["G", "G", "G", "Y", "Y", "R", "R", "R"]],
  ["P-2402", ["G", "G", "Y", "Y", "Y", "Y", "Y", "Y"]],
  ["P-2403", ["G", "G", "G", "G", "G", "G", "G", "G"]],
  ["P-2404", ["G", "G", "Y", "Y", "Y", "Y", "Y", "Y"]],
  ["P-2405", ["G", "G", "G", "G", "G", "G", "G", "G"]],
  ["P-2406", ["G", "G", "G", "Y", "Y", "R", "R", "R"]],
].flatMap(([projectId, states]) =>
  states.map((state, index) => ({
    id: `${projectId}-M${index + 1}`,
    projectId,
    name: milestoneNames[index],
    plannedStart: `2026-${String(index + 1).padStart(2, "0")}-05`,
    plannedEnd: `2026-${String(index + 1).padStart(2, "0")}-26`,
    actualStart: index < 6 ? `2026-${String(index + 1).padStart(2, "0")}-08` : "",
    actualEnd: index < 5 ? `2026-${String(index + 1).padStart(2, "0")}-${state === "R" ? "30" : "24"}` : "",
    state,
    delay: state === "R" ? 12 : state === "Y" ? 4 : 0,
    note: state === "R" ? "已超过计划窗口，需要 PMO 干预" : state === "Y" ? "存在排期或资源风险" : "按计划推进",
  }))
);

const allocations = [
  {
    "id": "R2-001",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / SRtracking",
    "projectName": "SRtracking",
    "complexity": 3,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.04
  },
  {
    "id": "R2-002",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / SRtracking",
    "projectName": "SRtracking",
    "complexity": 3,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-003",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / SRtracking",
    "projectName": "SRtracking",
    "complexity": 3,
    "status": "UAT",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-004",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / SRtracking",
    "projectName": "SRtracking",
    "complexity": 3,
    "status": "UAT",
    "role": "Agent开发",
    "person": "鍒樺浗鎳?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-005",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Copilot",
    "projectName": "Copilot",
    "complexity": 4,
    "status": "部署上线",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.04
  },
  {
    "id": "R2-006",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Copilot",
    "projectName": "Copilot",
    "complexity": 4,
    "status": "部署上线",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-007",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Copilot",
    "projectName": "Copilot",
    "complexity": 4,
    "status": "部署上线",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-008",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Agent",
    "projectName": "Agent",
    "complexity": 5,
    "status": "产品开发",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.04
  },
  {
    "id": "R2-009",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Agent",
    "projectName": "Agent",
    "complexity": 5,
    "status": "产品开发",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-010",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "药物警戒部",
    "system": "PV",
    "projectId": "PV / Agent",
    "projectName": "Agent",
    "complexity": 5,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-011",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.06
  },
  {
    "id": "R2-012",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "产品经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-013",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-014",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-015",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-016",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "涓佸畤缁?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-017",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-018",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据对比",
    "projectName": "数据对比",
    "complexity": 2,
    "status": "部署上线",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.01
  },
  {
    "id": "R2-019",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.06
  },
  {
    "id": "R2-020",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "产品经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-021",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-022",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "Agent开发",
    "person": "寮犳槉鏄?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-023",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-024",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-025",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鐜嬮珮灞?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-026",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-027",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据上传",
    "projectName": "数据上传",
    "complexity": 3,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-028",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.06
  },
  {
    "id": "R2-029",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-030",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-031",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "Agent开发",
    "person": "寮犳槉鏄?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-032",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-033",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "UI/UX",
    "person": "娌堝ぉ楠?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-034",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-035",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鐜嬮珮灞?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-036",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-037",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据整合",
    "projectName": "数据整合",
    "complexity": 5,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-038",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.06
  },
  {
    "id": "R2-039",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-040",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-041",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "Agent开发",
    "person": "寮犳槉鏄?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-042",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "UI/UX",
    "person": "娌堝ぉ楠?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-043",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-044",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "涓佸畤缁?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-045",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-046",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 智能閫昏緫鏍告煡",
    "projectName": "智能閫昏緫鏍告煡",
    "complexity": 4,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-047",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.06
  },
  {
    "id": "R2-048",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-049",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-050",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "寮犳槉鏄?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-051",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-052",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "绔ュ皬搴?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-053",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-054",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / 数据映射",
    "projectName": "数据映射",
    "complexity": 3,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.03
  },
  {
    "id": "R2-055",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / Coding Tool",
    "projectName": "Coding Tool",
    "complexity": 2,
    "status": "系统运维",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-056",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床数据分析与可视化平台",
    "projectId": "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台 / Coding Tool",
    "projectName": "Coding Tool",
    "complexity": 2,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "涓佸畤缁?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-057",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-058",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "产品经理",
    "person": "鏈辨€濆",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-059",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-060",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.03
  },
  {
    "id": "R2-061",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-062",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "projectName": "鍖诲涓撲笟鎼滅储鍜屾柟妗堣緟鍔╃敓鎴愬钩鍙?绔炴爣PPT",
    "complexity": 6,
    "status": "系统运维",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.03
  },
  {
    "id": "R2-063",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲助手智能浣?",
    "projectName": "鍖诲助手智能浣?",
    "complexity": 6,
    "status": "UAT",
    "role": "Agent开发",
    "person": "鏉庢ⅵ鐝?",
    "outsourced": false,
    "timeRatio": 0.9
  },
  {
    "id": "R2-064",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / 鍖诲助手智能浣?",
    "projectName": "鍖诲助手智能浣?",
    "complexity": 6,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-065",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-066",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "Agent开发",
    "person": "鍒樺浗鎳?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-067",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-068",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "鍙剁粏寤?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-069",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-070",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.35
  },
  {
    "id": "R2-071",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND267",
    "projectName": "IND267",
    "complexity": 4,
    "status": "部署上线",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-072",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-073",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "Agent开发",
    "person": "鍒樺浗鎳?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-074",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-075",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-076",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.35
  },
  {
    "id": "R2-077",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND265",
    "projectName": "IND265",
    "complexity": 4,
    "status": "部署上线",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-078",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-079",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-080",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-081",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-082",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-083",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND266",
    "projectName": "IND266",
    "complexity": 3,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.03
  },
  {
    "id": "R2-084",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-085",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-086",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-087",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍙剁粏寤?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-088",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "模型",
    "person": "璋风传鍚?",
    "outsourced": false,
    "timeRatio": 0.9
  },
  {
    "id": "R2-089",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-090",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND264",
    "projectName": "IND264",
    "complexity": 3,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.03
  },
  {
    "id": "R2-091",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND263",
    "projectName": "IND263",
    "complexity": 3,
    "status": "部署上线",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-092",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND263",
    "projectName": "IND263",
    "complexity": 3,
    "status": "部署上线",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-093",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND263",
    "projectName": "IND263",
    "complexity": 3,
    "status": "部署上线",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-094",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND263",
    "projectName": "IND263",
    "complexity": 3,
    "status": "部署上线",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-095",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "ClinAI临研助手",
    "projectId": "ClinAI涓寸爺助手 / IND263",
    "projectName": "IND263",
    "complexity": 3,
    "status": "部署上线",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.02
  },
  {
    "id": "R2-096",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医疗器械部",
    "system": "IVD注册信息共享平台",
    "projectId": "IVD娉ㄥ唽淇℃伅鑽熶韩平台 / IVD娉ㄥ唽淇℃伅鑽熶韩平台",
    "projectName": "IVD注册信息共享平台",
    "complexity": 2,
    "status": "系统运维",
    "role": "产品经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-097",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医疗器械部",
    "system": "IVD注册信息共享平台",
    "projectId": "IVD娉ㄥ唽淇℃伅鑽熶韩平台 / IVD娉ㄥ唽淇℃伅鑽熶韩平台",
    "projectName": "IVD注册信息共享平台",
    "complexity": 2,
    "status": "系统运维",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-098",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医疗器械部",
    "system": "IVD注册信息共享平台",
    "projectId": "IVD娉ㄥ唽淇℃伅鑽熶韩平台 / IVD娉ㄥ唽淇℃伅鑽熶韩平台",
    "projectName": "IVD注册信息共享平台",
    "complexity": 2,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "鎻槉",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-099",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医疗器械部",
    "system": "IVD注册信息共享平台",
    "projectId": "IVD娉ㄥ唽淇℃伅鑽熶韩平台 / IVD娉ㄥ唽淇℃伅鑽熶韩平台",
    "projectName": "IVD注册信息共享平台",
    "complexity": 2,
    "status": "系统运维",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-100",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医疗器械部",
    "system": "IVD注册信息共享平台",
    "projectId": "IVD娉ㄥ唽淇℃伅鑽熶韩平台 / IVD娉ㄥ唽淇℃伅鑽熶韩平台",
    "projectName": "IVD注册信息共享平台",
    "complexity": 2,
    "status": "系统运维",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.01
  },
  {
    "id": "R2-101",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "CRA入排审核",
    "projectId": "CRA入排审核 / CRA入排审核",
    "projectName": "CRA入排审核",
    "complexity": 5,
    "status": "项目暂停",
    "role": "项目经理",
    "person": "黄敏敏",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-102",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "CRA入排审核",
    "projectId": "CRA入排审核 / CRA入排审核",
    "projectName": "CRA入排审核",
    "complexity": 5,
    "status": "项目暂停",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.01
  },
  {
    "id": "R2-103",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "CRA入排审核",
    "projectId": "CRA入排审核 / CRA入排审核",
    "projectName": "CRA入排审核",
    "complexity": 5,
    "status": "项目暂停",
    "role": "模型",
    "person": "鏉ㄤ匠娆?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-104",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "PV銆丷A銆丮W",
    "system": "AI翻译平台",
    "projectId": "AI缈昏瘧平台 / AI缈昏瘧平台",
    "projectName": "AI翻译平台",
    "complexity": 3,
    "status": "产品开发",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.2
  },
  {
    "id": "R2-105",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "PV銆丷A銆丮W",
    "system": "AI翻译平台",
    "projectId": "AI缈昏瘧平台 / AI缈昏瘧平台",
    "projectName": "AI翻译平台",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-106",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "PV銆丷A銆丮W",
    "system": "AI翻译平台",
    "projectId": "AI缈昏瘧平台 / AI缈昏瘧平台",
    "projectName": "AI翻译平台",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鏉ㄧ儴绾?",
    "outsourced": false,
    "timeRatio": 0.8
  },
  {
    "id": "R2-107",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "PV銆丷A銆丮W",
    "system": "AI翻译平台",
    "projectId": "AI缈昏瘧平台 / AI缈昏瘧平台",
    "projectName": "AI翻译平台",
    "complexity": 3,
    "status": "产品开发",
    "role": "测试",
    "person": "鍚存枃杈?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-108",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "PV銆丷A銆丮W",
    "system": "AI翻译平台",
    "projectId": "AI缈昏瘧平台 / AI缈昏瘧平台",
    "projectName": "AI翻译平台",
    "complexity": 3,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-109",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.2
  },
  {
    "id": "R2-110",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "产品经理",
    "person": "鐢板墤",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-111",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-112",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-113",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鎻槉",
    "outsourced": false,
    "timeRatio": 0.9
  },
  {
    "id": "R2-114",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "璋㈡櫤闇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-115",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "测试",
    "person": "榛勯箯绋?",
    "outsourced": false,
    "timeRatio": 0.7
  },
  {
    "id": "R2-116",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "中心信息管理",
    "projectId": "中心淇℃伅绠＄悊 / CS中心调研",
    "projectName": "CS中心调研",
    "complexity": 4,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.01
  },
  {
    "id": "R2-117",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ RPM Dashboard",
    "projectName": "RPM Dashboard",
    "complexity": 8,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.1
  },
  {
    "id": "R2-118",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ RPM Dashboard",
    "projectName": "RPM Dashboard",
    "complexity": 8,
    "status": "UAT",
    "role": "产品经理",
    "person": "鍙舵緧鏅?",
    "outsourced": false,
    "timeRatio": 0.6
  },
  {
    "id": "R2-119",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ RPM Dashboard",
    "projectName": "RPM Dashboard",
    "complexity": 8,
    "status": "UAT",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-120",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ RPM Dashboard",
    "projectName": "RPM Dashboard",
    "complexity": 8,
    "status": "UAT",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-121",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ RPM Dashboard",
    "projectName": "RPM Dashboard",
    "complexity": 8,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "浣曚慨寮?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-122",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ BI系统",
    "projectName": "BI系统",
    "complexity": 1,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "鎻槉",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-123",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ BI系统",
    "projectName": "BI系统",
    "complexity": 1,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "浣曚慨寮?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-124",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ BI系统",
    "projectName": "BI系统",
    "complexity": 1,
    "status": "系统运维",
    "role": "测试",
    "person": "榛勯箯绋?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-125",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ BI系统",
    "projectName": "BI系统",
    "complexity": 1,
    "status": "系统运维",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.01
  },
  {
    "id": "R2-126",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ MDM涓绘暟鎹鐞嗙郴缁?",
    "projectName": "MDM涓绘暟鎹鐞嗙郴缁?",
    "complexity": 2,
    "status": "项目暂停",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-127",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ MDM涓绘暟鎹鐞嗙郴缁?",
    "projectName": "MDM涓绘暟鎹鐞嗙郴缁?",
    "complexity": 2,
    "status": "项目暂停",
    "role": "全栈开发工程师",
    "person": "浣曚慨寮?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-128",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ MDM涓绘暟鎹鐞嗙郴缁?",
    "projectName": "MDM涓绘暟鎹鐞嗙郴缁?",
    "complexity": 2,
    "status": "项目暂停",
    "role": "测试",
    "person": "榛勯箯绋?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-129",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ MDM涓绘暟鎹鐞嗙郴缁?",
    "projectName": "MDM涓绘暟鎹鐞嗙郴缁?",
    "complexity": 2,
    "status": "项目暂停",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-130",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ CRC智能鎺ㄨ崘",
    "projectName": "CRC智能鎺ㄨ崘",
    "complexity": 5,
    "status": "项目暂停",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0
  },
  {
    "id": "R2-131",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ CRC智能鎺ㄨ崘",
    "projectName": "CRC智能鎺ㄨ崘",
    "complexity": 5,
    "status": "项目暂停",
    "role": "产品经理",
    "person": "鍙舵緧鏅?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-132",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ CRC智能鎺ㄨ崘",
    "projectName": "CRC智能鎺ㄨ崘",
    "complexity": 5,
    "status": "项目暂停",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-133",
    "cat": "临床",
    "dept": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "biz": "SMO銆丆RO銆佹€荤粡鍔炪€丅D銆丅DS",
    "system": "主数据中台",
    "projectId": "涓绘暟鎹腑鍙?/ CRC智能鎺ㄨ崘",
    "projectName": "CRC智能鎺ㄨ崘",
    "complexity": 5,
    "status": "项目暂停",
    "role": "全栈开发工程师",
    "person": "浣曚慨寮?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-134",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "财务部",
    "system": "财务审批自动化",
    "projectId": "财务瀹℃壒自动鍖?/ 财务瀹℃壒自动鍖?",
    "projectName": "财务审批自动化",
    "complexity": 3,
    "status": "项目暂停",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-135",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "财务部",
    "system": "临床财务智能问答小助手",
    "projectId": "临床财务智能闂瓟灏忓姪鎵?/ 临床财务智能闂瓟灏忓姪鎵?",
    "projectName": "临床财务智能问答小助手",
    "complexity": 3,
    "status": "系统运维",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-136",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "财务部",
    "system": "临床财务智能问答小助手",
    "projectId": "临床财务智能闂瓟灏忓姪鎵?/ 临床财务智能闂瓟灏忓姪鎵?",
    "projectName": "临床财务智能问答小助手",
    "complexity": 3,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "宕旀灄",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-137",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "财务部",
    "system": "临床财务智能问答小助手",
    "projectId": "临床财务智能闂瓟灏忓姪鎵?/ 临床财务智能闂瓟灏忓姪鎵?",
    "projectName": "临床财务智能问答小助手",
    "complexity": 3,
    "status": "系统运维",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-138",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "财务部",
    "system": "临床财务智能问答小助手",
    "projectId": "临床财务智能闂瓟灏忓姪鎵?/ 临床财务智能闂瓟灏忓姪鎵?",
    "projectName": "临床财务智能问答小助手",
    "complexity": 3,
    "status": "系统运维",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-139",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "临床协调部",
    "system": "EDC自动化录入",
    "projectId": "EDC自动鍖栧綍鍏?/ EDC自动鍖栧綍鍏?",
    "projectName": "EDC自动化录入",
    "complexity": 8,
    "status": "项目暂停",
    "role": "产品经理",
    "person": "鐢板墤",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-140",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "项目经理",
    "person": "闄堥楣?",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-141",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鎵嶈瘲",
    "outsourced": false,
    "timeRatio": 0.6
  },
  {
    "id": "R2-142",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鍙舵緧鏅?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-143",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-144",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "产品经理",
    "person": "严昊元",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-145",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "架构师",
    "person": "浣曟尟鍕?",
    "outsourced": false,
    "timeRatio": 0.9
  },
  {
    "id": "R2-146",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "前端",
    "person": "鍚夋灄",
    "outsourced": true,
    "timeRatio": 0.7
  },
  {
    "id": "R2-147",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "前端",
    "person": "闄堟稕",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-148",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "后端",
    "person": "渚繚淇?",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-149",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "后端",
    "person": "瀛欐潵瓒?",
    "outsourced": true,
    "timeRatio": 0.7
  },
  {
    "id": "R2-150",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "测试",
    "person": "鑳″▏濞?",
    "outsourced": true,
    "timeRatio": 0.7
  },
  {
    "id": "R2-151",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "测试",
    "person": "浣曚繆鐢?",
    "outsourced": true,
    "timeRatio": 0.7
  },
  {
    "id": "R2-152",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "测试",
    "person": "瀹嬪媷鍐?",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-153",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM 临研睿智",
    "projectId": "RPM 涓寸爺鐫挎櫤 / RPM 涓寸爺鐫挎櫤",
    "projectName": "RPM 临研睿智",
    "complexity": 10,
    "status": "产品开发",
    "role": "运维",
    "person": "灞堢伩",
    "outsourced": true,
    "timeRatio": 0.7
  },
  {
    "id": "R2-154",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM",
    "projectId": "RPM / RPM 宸ユ椂系统",
    "projectName": "RPM 宸ユ椂系统",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鎵嶈瘲",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-155",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM",
    "projectId": "RPM / RPM 宸ユ椂系统",
    "projectName": "RPM 宸ユ椂系统",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-156",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM",
    "projectId": "RPM / RPM 宸ユ椂系统",
    "projectName": "RPM 宸ユ椂系统",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "严昊元",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-157",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "鐜板満绠＄悊缁勭粐",
    "system": "RPM",
    "projectId": "RPM / RPM娴嬭瘯自动鍖栧紑鍙?",
    "projectName": "RPM娴嬭瘯自动鍖栧紑鍙?",
    "complexity": 6,
    "status": "系统运维",
    "role": "产品经理",
    "person": "鎵嶈瘲",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-158",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-159",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鐢樺欢婢?",
    "outsourced": true,
    "timeRatio": 0.2
  },
  {
    "id": "R2-160",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "架构师",
    "person": "浣曟尟鍕?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-161",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "前端",
    "person": "鍚夋灄",
    "outsourced": true,
    "timeRatio": 0.3
  },
  {
    "id": "R2-162",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "后端",
    "person": "瀛欐潵瓒?",
    "outsourced": true,
    "timeRatio": 0.3
  },
  {
    "id": "R2-163",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "后端",
    "person": "寮犳瘏鑱?",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-164",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "后端",
    "person": "浣欐柊鐢?",
    "outsourced": true,
    "timeRatio": 1
  },
  {
    "id": "R2-165",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "测试",
    "person": "鑳″▏濞?",
    "outsourced": true,
    "timeRatio": 0.3
  },
  {
    "id": "R2-166",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "测试",
    "person": "浣曚繆鐢?",
    "outsourced": true,
    "timeRatio": 0.3
  },
  {
    "id": "R2-167",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "BD/BDS",
    "system": "QuotePro 报价通（报价系统）",
    "projectId": "QuotePro 报价通（报价系统锛?/ QuotePro 报价通（报价系统锛?",
    "projectName": "QuotePro 报价通（报价系统）",
    "complexity": 8,
    "status": "产品开发",
    "role": "运维",
    "person": "灞堢伩",
    "outsourced": true,
    "timeRatio": 0.3
  },
  {
    "id": "R2-168",
    "cat": "临床",
    "dept": "临床鐢熺墿鍒嗘瀽鏈嶅姟",
    "biz": "鍗椾含灏忓垎瀛愬垎鏋愬疄楠屽",
    "system": "BA Lims",
    "projectId": "BA Lims / BA Lims",
    "projectName": "BA Lims",
    "complexity": 4,
    "status": "UAT",
    "role": "项目经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-169",
    "cat": "临床",
    "dept": "临床鐢熺墿鍒嗘瀽鏈嶅姟",
    "biz": "鍗椾含灏忓垎瀛愬垎鏋愬疄楠屽",
    "system": "BA Lims",
    "projectId": "BA Lims / BA Lims",
    "projectName": "BA Lims",
    "complexity": 4,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-170",
    "cat": "临床",
    "dept": "临床鐢熺墿鍒嗘瀽鏈嶅姟",
    "biz": "鍗椾含灏忓垎瀛愬垎鏋愬疄楠屽",
    "system": "BA Lims",
    "projectId": "BA Lims / BA Lims",
    "projectName": "BA Lims",
    "complexity": 4,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "鍖呭浗瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-171",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "QA",
    "system": "联斯达ICU",
    "projectId": "鑱旀柉杈綪CU / 鑱旀柉杈綪CU",
    "projectName": "联斯达ICU",
    "complexity": 3,
    "status": "系统运维",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0.05
  },
  {
    "id": "R2-172",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "QA",
    "system": "联斯达ICU",
    "projectId": "鑱旀柉杈綪CU / 鑱旀柉杈綪CU",
    "projectName": "联斯达ICU",
    "complexity": 3,
    "status": "系统运维",
    "role": "产品经理",
    "person": "鐢板墤",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-173",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "QA",
    "system": "联斯达ICU",
    "projectId": "鑱旀柉杈綪CU / 鑱旀柉杈綪CU",
    "projectName": "联斯达ICU",
    "complexity": 3,
    "status": "系统运维",
    "role": "全栈开发工程师",
    "person": "浣曞",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-174",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "法务部",
    "system": "法务数字人",
    "projectId": "娉曞姟鏁板瓧浜?/ 娉曞姟鏁板瓧浜?",
    "projectName": "法务数字人",
    "complexity": 6,
    "status": "产品开发",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-175",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "法务部",
    "system": "法务数字人",
    "projectId": "娉曞姟鏁板瓧浜?/ 娉曞姟鏁板瓧浜?",
    "projectName": "法务数字人",
    "complexity": 6,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-176",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "法务部",
    "system": "法务数字人",
    "projectId": "娉曞姟鏁板瓧浜?/ 娉曞姟鏁板瓧浜?",
    "projectName": "法务数字人",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鏉ㄧ儴绾?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-177",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "注册法规部",
    "system": "法规生成月报",
    "projectId": "娉曡生成月报 / 娉曡生成月报",
    "projectName": "法规生成月报",
    "complexity": 4,
    "status": "产品开发",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-178",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "注册法规部",
    "system": "法规生成月报",
    "projectId": "娉曡生成月报 / 娉曡生成月报",
    "projectName": "法规生成月报",
    "complexity": 4,
    "status": "产品开发",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-179",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "注册法规部",
    "system": "法规生成月报",
    "projectId": "娉曡生成月报 / 娉曡生成月报",
    "projectName": "法规生成月报",
    "complexity": 4,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.25
  },
  {
    "id": "R2-180",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "质量保证与培训",
    "system": "QA-数据跨境访问和传输",
    "projectId": "QA-数据璺ㄥ璁块棶鍜屼紶杈?/ QA-数据璺ㄥ璁块棶鍜屼紶杈?",
    "projectName": "QA-数据跨境访问和传输",
    "complexity": 3,
    "status": "系统运维",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-181",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "质量保证与培训",
    "system": "QA-数据跨境访问和传输",
    "projectId": "QA-数据璺ㄥ璁块棶鍜屼紶杈?/ QA-数据璺ㄥ璁块棶鍜屼紶杈?",
    "projectName": "QA-数据跨境访问和传输",
    "complexity": 3,
    "status": "系统运维",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-182",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "基础AI平台",
    "projectId": "鍩虹AI平台 / 澶фā鍨嬭缁?",
    "projectName": "澶фā鍨嬭缁?",
    "complexity": 8,
    "status": "产品设计",
    "role": "模型",
    "person": "鏉ㄤ匠娆?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-183",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床编程团队自动化工具集",
    "projectId": "临床缂栫▼鍥㈤槦自动化工具集 / 鏂规鍋忕缂栫▼Agent",
    "projectName": "鏂规鍋忕缂栫▼Agent",
    "complexity": 3,
    "status": "UAT",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-184",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "临床编程团队自动化工具集",
    "projectId": "临床缂栫▼鍥㈤槦自动化工具集 / 鏂规鍋忕缂栫▼Agent",
    "projectName": "鏂规鍋忕缂栫▼Agent",
    "complexity": 3,
    "status": "UAT",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-185",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "项目经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-186",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "产品经理",
    "person": "鏈辨€濆",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-187",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-188",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "鏉ㄩ懌",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-189",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "Agent开发",
    "person": "鍒樺浗鎳?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-190",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "架构师",
    "person": "鑼冧簹娴?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-191",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "UI/UX",
    "person": "寰愭湀娆?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-192",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "寮犱咕",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-193",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍖呭浗瀹?",
    "outsourced": false,
    "timeRatio": 0.8
  },
  {
    "id": "R2-194",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "宕旀灄",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-195",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "测试",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-196",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "AI辅助开发平台",
    "projectId": "AI杈呭姪寮€鍙戝钩鍙?/ 浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "projectName": "浼佷笟绾т笟鍔℃櫤鑳戒綋平台",
    "complexity": 8,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-197",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "R2统一平台",
    "projectId": "R2缁熶竴平台 / R2缁熶竴平台",
    "projectName": "R2统一平台",
    "complexity": 2,
    "status": "项目暂停",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-198",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "R2统一平台",
    "projectId": "R2缁熶竴平台 / R2缁熶竴平台",
    "projectName": "R2统一平台",
    "complexity": 2,
    "status": "项目暂停",
    "role": "全栈开发工程师",
    "person": "璋㈡櫤闇?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-199",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "R2统一平台",
    "projectId": "R2缁熶竴平台 / R2缁熶竴平台",
    "projectName": "R2统一平台",
    "complexity": 2,
    "status": "项目暂停",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.02
  },
  {
    "id": "R2-200",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIProduct",
    "projectName": "AIProduct",
    "complexity": 5,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-201",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIProduct",
    "projectName": "AIProduct",
    "complexity": 5,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "宕旀灄",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-202",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AI Infra",
    "projectName": "AI Infra",
    "complexity": 6,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-203",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AI Infra",
    "projectName": "AI Infra",
    "complexity": 6,
    "status": "产品开发",
    "role": "架构师",
    "person": "鑼冧簹娴?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-204",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AI Infra",
    "projectName": "AI Infra",
    "complexity": 6,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-205",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIOps",
    "projectName": "AIOps",
    "complexity": 7,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-206",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIOps",
    "projectName": "AIOps",
    "complexity": 7,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍖呭浗瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-207",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIOps",
    "projectName": "AIOps",
    "complexity": 7,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-208",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AICoding",
    "projectName": "AICoding",
    "complexity": 7,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-209",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AICoding",
    "projectName": "AICoding",
    "complexity": 7,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鐜嬪皯濞?",
    "outsourced": false,
    "timeRatio": 0.6
  },
  {
    "id": "R2-210",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AICoding",
    "projectName": "AICoding",
    "complexity": 7,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "涓佸畤缁?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-211",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AICoding",
    "projectName": "AICoding",
    "complexity": 7,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鐜嬮珮灞?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-212",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AICoding",
    "projectName": "AICoding",
    "complexity": 7,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "绔ュ皬搴?",
    "outsourced": false,
    "timeRatio": 0.7
  },
  {
    "id": "R2-213",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIGateway",
    "projectName": "AIGateway",
    "complexity": 6,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-214",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIGateway",
    "projectName": "AIGateway",
    "complexity": 6,
    "status": "产品开发",
    "role": "架构师",
    "person": "鑼冧簹娴?",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-215",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIGateway",
    "projectName": "AIGateway",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "璋㈡櫤闇?",
    "outsourced": false,
    "timeRatio": 0.9
  },
  {
    "id": "R2-216",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIGateway",
    "projectName": "AIGateway",
    "complexity": 6,
    "status": "产品开发",
    "role": "测试",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-217",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIGateway",
    "projectName": "AIGateway",
    "complexity": 6,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-218",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AITest",
    "projectName": "AITest",
    "complexity": 6,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-219",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AITest",
    "projectName": "AITest",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍚存枃杈?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-220",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AITest",
    "projectName": "AITest",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鐜嬪鏂?",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-221",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIMemory",
    "projectName": "AIMemory",
    "complexity": 5,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-222",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIMemory",
    "projectName": "AIMemory",
    "complexity": 5,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍙剁粏寤?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-223",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIEvals",
    "projectName": "AIEvals",
    "complexity": 6,
    "status": "产品开发",
    "role": "产品经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-224",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIEvals",
    "projectName": "AIEvals",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍚存枃杈?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-225",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIEvals",
    "projectName": "AIEvals",
    "complexity": 6,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "楠嗚埅鐕?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-226",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / AIEvals",
    "projectName": "AIEvals",
    "complexity": 6,
    "status": "产品开发",
    "role": "模型",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-227",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / 临床澶фā鍨嬫帰绱?智能浣撴技术优化",
    "projectName": "临床澶фā鍨嬫帰绱?智能浣撴技术优化",
    "complexity": 8,
    "status": "需求调研",
    "role": "模型",
    "person": "鏉ㄤ匠娆?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-228",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / 本地LLM",
    "projectName": "鏈湴LLM",
    "complexity": 2,
    "status": "产品自测",
    "role": "项目经理",
    "person": "閲戦懌",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-229",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / 本地LLM",
    "projectName": "鏈湴LLM",
    "complexity": 2,
    "status": "产品自测",
    "role": "架构师",
    "person": "鑼冧簹娴?",
    "outsourced": false,
    "timeRatio": 0.25
  },
  {
    "id": "R2-230",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / 本地LLM",
    "projectName": "鏈湴LLM",
    "complexity": 2,
    "status": "产品自测",
    "role": "测试",
    "person": "榛勯箯绋?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-231",
    "cat": "R2",
    "dept": "共享服务中心（SSC）",
    "biz": "R2",
    "system": "",
    "projectId": "AI赋能 / 本地LLM",
    "projectName": "鏈湴LLM",
    "complexity": 2,
    "status": "产品自测",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-232",
    "cat": "集团",
    "dept": "集团",
    "biz": "集团",
    "system": "新药研发AI平台",
    "projectId": "鏂拌嵂研发AI平台 / 鏂拌嵂研发AI平台",
    "projectName": "新药研发AI平台",
    "complexity": 3,
    "status": "部署上线",
    "role": "架构师",
    "person": "鑼冧簹娴?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-233",
    "cat": "集团",
    "dept": "集团",
    "biz": "集团",
    "system": "新药研发AI平台",
    "projectId": "鏂拌嵂研发AI平台 / 鏂拌嵂研发AI平台",
    "projectName": "新药研发AI平台",
    "complexity": 3,
    "status": "部署上线",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-234",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "项目经理",
    "person": "娈靛瓙鐞?",
    "outsourced": true,
    "timeRatio": 0
  },
  {
    "id": "R2-235",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "产品经理",
    "person": "鏈辨€濆",
    "outsourced": false,
    "timeRatio": 0.75
  },
  {
    "id": "R2-236",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "Agent开发",
    "person": "瀛欐祻娣?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-237",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "UI/UX",
    "person": "娌堝ぉ楠?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-238",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "全栈开发工程师",
    "person": "浣曞",
    "outsourced": false,
    "timeRatio": 0.6
  },
  {
    "id": "R2-239",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "测试",
    "person": "鍚存枃杈?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-240",
    "cat": "集团",
    "dept": "集团",
    "biz": "TSP",
    "system": "",
    "projectId": "AI赋能 / TSP自动报价",
    "projectName": "TSP自动报价",
    "complexity": 5,
    "status": "UAT",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-241",
    "cat": "集团",
    "dept": "集团",
    "biz": "閰?",
    "system": "",
    "projectId": "AI赋能 / 酶数据库",
    "projectName": "閰舵暟鎹簱",
    "complexity": 3,
    "status": "产品开发",
    "role": "产品经理",
    "person": "璐逛粫蹇?",
    "outsourced": false,
    "timeRatio": 0.3
  },
  {
    "id": "R2-242",
    "cat": "集团",
    "dept": "集团",
    "biz": "閰?",
    "system": "",
    "projectId": "AI赋能 / 酶数据库",
    "projectName": "閰舵暟鎹簱",
    "complexity": 3,
    "status": "产品开发",
    "role": "全栈开发工程师",
    "person": "鍖呭浗瀹?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-243",
    "cat": "集团",
    "dept": "集团",
    "biz": "閰?",
    "system": "",
    "projectId": "AI赋能 / 酶数据库",
    "projectName": "閰舵暟鎹簱",
    "complexity": 3,
    "status": "产品开发",
    "role": "运维",
    "person": "娈甸暱瀹?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-244",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "项目管理部",
    "system": "",
    "projectId": "AI赋能 / PDMS-收入确认 v1.0",
    "projectName": "PDMS-鏀跺叆纭 v1.0",
    "complexity": 10,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鎵嶈瘲",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-245",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "商务拓展部",
    "system": "",
    "projectId": "AI赋能 / QuotePro 报价通（报价系统）Ph 2",
    "projectName": "QuotePro 报价通（报价系统）Ph 2",
    "complexity": 9,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鎵嶈瘲",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-246",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "商务拓展部",
    "system": "",
    "projectId": "AI赋能 / QuotePro 报价通（报价系统）Ph 2",
    "projectName": "QuotePro 报价通（报价系统）Ph 2",
    "complexity": 9,
    "status": "需求调研",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.4
  },
  {
    "id": "R2-247",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "商务拓展部",
    "system": "",
    "projectId": "AI赋能 / QuotePro 报价通（报价系统）Ph 2",
    "projectName": "QuotePro 报价通（报价系统）Ph 2",
    "complexity": 9,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鐢樺欢婢?",
    "outsourced": true,
    "timeRatio": 0.9
  },
  {
    "id": "R2-248",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "临床协调部",
    "system": "",
    "projectId": "AI赋能 / CPM灏忕▼搴?",
    "projectName": "CPM灏忕▼搴?",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鐢板墤",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-249",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "临床协调部",
    "system": "",
    "projectId": "AI赋能 / CPM灏忕▼搴?",
    "projectName": "CPM灏忕▼搴?",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-250",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "项目管理部、临床协调部",
    "system": "",
    "projectId": "AI赋能 / CS中心调研（二期）",
    "projectName": "CS中心调研（二期）",
    "complexity": 8,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鐢板墤",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-251",
    "cat": "临床",
    "dept": "现场管理组织（SMO）",
    "biz": "项目管理部、临床协调部",
    "system": "",
    "projectId": "AI赋能 / CS中心调研（二期）",
    "projectName": "CS中心调研（二期）",
    "complexity": 8,
    "status": "需求调研",
    "role": "产品经理",
    "person": "閲戜亥绁?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-252",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "生物统计部",
    "system": "",
    "projectId": "AI赋能 / 临床编程团队自动化工具集",
    "projectName": "临床编程团队自动化工具集",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-253",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "",
    "projectId": "AI赋能 / 项目计划撰写",
    "projectName": "项目计划撰写",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-254",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "",
    "projectId": "AI赋能 / 鐩戞煡鎶ュ憡撰写涓庢櫤鑳藉鏍?",
    "projectName": "鐩戞煡鎶ュ憡撰写涓庢櫤鑳藉鏍?",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.15
  },
  {
    "id": "R2-255",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "临研助手-智能撰写agent",
    "projectId": "涓寸爺助手-智能撰写agent / IND 2.6.2銆?銆?",
    "projectName": "IND 2.6.2銆?銆?",
    "complexity": 3,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-256",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "临研助手-智能撰写agent",
    "projectId": "涓寸爺助手-智能撰写agent / IND 2.4",
    "projectName": "IND 2.4",
    "complexity": 3,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-257",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "注册法规部",
    "system": "临研助手-智能撰写agent",
    "projectId": "涓寸爺助手-智能撰写agent / IND 3.2s銆?.2p",
    "projectName": "IND 3.2s銆?.2p",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鑳℃磥",
    "outsourced": false,
    "timeRatio": 0.5
  },
  {
    "id": "R2-258",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "临床寮€鍙戦儴",
    "system": "",
    "projectId": "AI赋能 / 鍙楄瘯鑰呭叆排智能鑳藉鏍?",
    "projectName": "鍙楄瘯鑰呭叆排智能鑳藉鏍?",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0
  },
  {
    "id": "R2-259",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部、药物警戒部、医疗器械部",
    "system": "临研助手-智能检索agent",
    "projectId": "涓寸爺助手-智能妫€绱gent / 鏂囩尞自动检索",
    "projectName": "鏂囩尞自动检索",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-260",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部、药物警戒部、医疗器械部",
    "system": "临研助手-智能检索agent",
    "projectId": "涓寸爺助手-智能妫€绱gent / 娉曡自动检索",
    "projectName": "娉曡自动检索",
    "complexity": 4,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-261",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部、药物警戒部",
    "system": "临研助手-智能撰写agent",
    "projectId": "涓寸爺助手-智能撰写agent / 鏂囩尞淇℃伅鎻愬彇",
    "projectName": "鏂囩尞淇℃伅鎻愬彇",
    "complexity": 4,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-262",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "临研助手-智能检索agent",
    "projectId": "涓寸爺助手-智能妫€绱gent / 鏂规鍥炲",
    "projectName": "鏂规鍥炲",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-263",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "医学科学部",
    "system": "临研助手-智能检索agent",
    "projectId": "涓寸爺助手-智能妫€绱gent / 入排预筛审核",
    "projectName": "入排预筛审核",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.05
  },
  {
    "id": "R2-264",
    "cat": "临床",
    "dept": "临床研究组织（CRO）",
    "biz": "财务部",
    "system": "",
    "projectId": "AI赋能 / 财务赋能工具",
    "projectName": "财务璧嬭兘宸ュ叿",
    "complexity": 5,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.2
  },
  {
    "id": "R2-265",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "IDT",
    "system": "IDT数字化员工",
    "projectId": "IDT鏁板瓧鍖栧憳宸?/ 系统运维銆丆RM銆両T Service",
    "projectName": "系统运维銆丆RM銆両T Service",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "寮犻瓒?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-266",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "IDT",
    "system": "IDT数字化员工",
    "projectId": "IDT鏁板瓧鍖栧憳宸?/ CSV楠岃瘉",
    "projectName": "CSV楠岃瘉",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "鏅瓱鍗?",
    "outsourced": false,
    "timeRatio": 0.1
  },
  {
    "id": "R2-267",
    "cat": "临床",
    "dept": "共享服务中心（SSC）",
    "biz": "IDT",
    "system": "IDT数字化员工",
    "projectId": "IDT鏁板瓧鍖栧憳宸?/ 瀹夊叏娴嬭瘯",
    "projectName": "瀹夊叏娴嬭瘯",
    "complexity": 6,
    "status": "需求调研",
    "role": "产品经理",
    "person": "闄堟斁缇?",
    "outsourced": false,
    "timeRatio": 0.1
  }
];

function normalizeR2Records() {
  const exact = {
    "椤圭洰鏆傚仠": "项目暂停",
    "闇€姹傝皟鐮?": "需求调研",
    "浜у搧璁捐": "产品设计",
    "浜у搧寮€鍙?": "产品开发",
    "浜у搧鑷祴": "产品自测",
    "閮ㄧ讲涓婄嚎": "部署上线",
    "绯荤粺杩愮淮": "系统运维",
    "椤圭洰缁忕悊": "项目经理",
    "浜у搧缁忕悊": "产品经理",
    "鎶€鏈礋璐ｄ汉": "技术负责人",
    "Agent寮€鍙?": "Agent开发",
    "娴嬭瘯": "测试",
    "杩愮淮": "运维",
    "鍓嶇": "前端",
    "鍚庣": "后端",
    "鏋舵瀯甯?": "架构师",
    "鍏ㄦ爤寮€鍙戝伐绋嬪笀": "全栈开发工程师",
    "妯″瀷": "模型",
    "涓村簥": "临床",
    "闆嗗洟": "集团",
    "鏁板瓧鍖?": "数字化",
    "骞冲彴": "平台",
    "娴佺▼": "流程",
    "鍚堣": "合规",
    "涓村簥鐮旂┒缁勭粐锛圕RO锛?": "临床研究组织（CRO）",
    "椤圭洰绠＄悊閮?": "项目管理部",
    "椤圭洰绠＄悊閮ㄣ€佷复搴婂崗璋冮儴": "项目管理部、临床协调部",
    "AI杈呭姪寮€鍙戝钩鍙?": "AI辅助开发平台",
    "AI缈昏瘧平台": "AI翻译平台",
    "CRA鍏ユ帓审核": "CRA入排审核",
    "ClinAI涓寸爺助手": "ClinAI临研助手",
    "EDC自动鍖栧綍鍏?": "EDC自动化录入",
    "IDT鏁板瓧鍖栧憳宸?": "IDT数字化员工",
    "IVD娉ㄥ唽淇℃伅鑽熶韩平台": "IVD注册信息共享平台",
    "QA-数据璺ㄥ璁块棶鍜屼紶杈?": "QA-数据跨境访问和传输",
    "QuotePro 报价閫氾紙报价系统锛?": "QuotePro 报价通（报价系统）",
    "QuotePro 报价通（报价系统锛?": "QuotePro 报价通（报价系统）",
    "R2缁熶竴平台": "R2统一平台",
    "RPM 涓寸爺鐫挎櫤": "RPM 临研睿智",
    "中心淇℃伅绠＄悊": "中心信息管理",
    "临床数据鍒嗘瀽涓庡彲瑙嗗寲平台": "临床数据分析与可视化平台",
    "临床缂栫▼鍥㈤槦自动化工具集": "临床编程团队自动化工具集",
    "临床财务智能闂瓟灏忓姪鎵?": "临床财务智能问答小助手",
    "娉曞姟鏁板瓧浜?": "法务数字人",
    "娉曡生成月报": "法规生成月报",
    "涓寸爺助手-智能妫€绱gent": "临研助手-智能检索agent",
    "涓寸爺助手-智能撰写agent": "临研助手-智能撰写agent",
    "涓绘暟鎹腑鍙?": "主数据中台",
    "财务瀹℃壒自动鍖?": "财务审批自动化",
    "鍩虹AI平台": "基础AI平台",
    "鏂拌嵂研发AI平台": "新药研发AI平台",
    "鑱旀柉杈綪CU": "联斯达ICU",
    "CS中心调研锛堜簩鏈燂級": "CS中心调研（二期）",
    "QuotePro 报价閫氾紙报价系统锛塒h 2": "QuotePro 报价通（报价系统）Ph 2",
    "数据鏁村悎": "数据整合",
    "椤圭洰璁″垝撰写": "项目计划撰写",
    "鍏ユ帓棰勭瓫审核": "入排预筛审核",
    "临床鍗忚皟閮?": "临床协调部",
    "娉ㄥ唽娉曡閮?": "注册法规部",
    "娉曞姟閮?": "法务部",
    "璐ㄩ噺淇濊瘉涓庡煿璁?": "质量保证与培训",
    "财务閮?": "财务部",
    "鍖荤枟鍣ㄦ閮?": "医疗器械部",
    "鍖诲绉戝閮?": "医学科学部",
    "鍖诲绉戝閮ㄣ€佽嵂鐗╄鎴掗儴": "医学科学部、药物警戒部",
    "鍖诲绉戝閮ㄣ€佽嵂鐗╄鎴掗儴銆佸尰鐤楀櫒姊伴儴": "医学科学部、药物警戒部、医疗器械部",
    "鍟嗗姟鎷撳睍閮?": "商务拓展部",
    "鐢熺墿缁熻閮?": "生物统计部",
    "鑽墿璀︽垝閮?": "药物警戒部",
    "鍏变韩鏈嶅姟中心锛圫SC锛?": "共享服务中心（SSC）",
    "鐜板満绠＄悊缁勭粐锛圫MO锛?": "现场管理组织（SMO）",
    "榛勬晱鏁?": "黄敏敏",
    "涓ユ洐鍏?": "严昊元",
  };
  const fragments = [
    ["涓村簥", "临床"],
    ["闆嗗洟", "集团"],
    ["鏁版嵁", "数据"],
    ["鏁板瓧鍖?", "数字化"],
    ["骞冲彴", "平台"],
    ["椤圭洰", "项目"],
    ["璁″垝", "计划"],
    ["鐮斿彂", "研发"],
    ["鏅鸿兘", "智能"],
    ["鑷姩", "自动"],
    ["鍙楄瘯鑰?", "受试者"],
    ["鎺掓櫤", "排智能"],
    ["澶фā鍨?", "大模型"],
    ["妧鏈紭鍖?", "技术优化"],
    ["鍖栧伐鍏烽泦", "化工具集"],
    ["鎾板啓", "撰写"],
    ["鍏ユ帓", "入排"],
    ["瀹℃牳", "审核"],
    ["鎶ヤ环", "报价"],
    ["绯荤粺", "系统"],
    ["杩愮淮", "运维"],
    ["涓績", "中心"],
    ["璋冪爺", "调研"],
    ["璐㈠姟", "财务"],
    ["涓婁紶", "上传"],
    ["瀵规瘮", "对比"],
    ["鏄犲皠", "映射"],
    ["棰勭瓫", "预筛"],
    ["审核", "审核"],
    ["锛堜簩鏈燂級", "（二期）"],
    ["閫氾紙", "通（"],
    ["锛塒h", "）Ph"],
    ["鏁村悎", "整合"],
    ["妫€绱?", "检索"],
    ["鐢熸垚", "生成"],
    ["鏈堟姤", "月报"],
    ["鍔╂墜", "助手"],
    ["小助", "小助"],
  ];
  const fix = (value) => {
    if (typeof value !== "string") return value;
    if (exact[value]) return exact[value];
    let next = value;
    fragments.forEach(([from, to]) => {
      next = next.replaceAll(from, to);
    });
    next = next.replaceAll("????? / ", "AI赋能 / ");
    next = next.replaceAll(" ? ", " · ");
    return exact[next] || next;
  };
  allocations.forEach((allocation) => {
    ["cat", "dept", "biz", "system", "projectId", "projectName", "status", "role", "person"].forEach((key) => {
      allocation[key] = fix(allocation[key]);
    });
    if (!allocation.projectName && allocation.projectId.includes("/")) {
      allocation.projectName = allocation.projectId.split("/").pop().trim();
    }
  });
}

normalizeR2Records();

const state = {
  route: window.location.hash.replace("#", "") || "dashboard",
  selectedProjectId: null,
  filters: { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all" },
  resourceFilters: { system: "all", role: "all", outsource: "all" },
};

if (!routes.some(([id]) => id === state.route)) {
  state.route = "dashboard";
}

const $ = (selector) => document.querySelector(selector);

function effectiveHealth(project) {
  return project.override || project.health;
}

function loadFor(allocation) {
  const project = projects.find((item) => item.id === allocation.projectId);
  const status = project?.status || allocation.status;
  const complexity = project?.complexity || allocation.complexity || 3;
  const statusWeight = statusWeights[status] ?? 0.5;
  const roleWeight = roleWeights[allocation.role]?.[status] ?? statusWeight;
  return allocation.timeRatio * Math.sqrt(complexity / 5) * roleWeight;
}

function loadClass(value) {
  if (value >= 1.2) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

function healthLabel(value) {
  return value === "R" ? "红灯" : value === "Y" ? "黄灯" : value === "G" ? "绿灯" : "未设置";
}

function badge(value) {
  return `<span class="badge ${value || "gray"}">${healthLabel(value)}</span>`;
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthLabel(date) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
}

function initNav() {
  $("#nav").innerHTML = routeGroups
    .map((group) => `<div class="nav-group">
      <div class="nav-group-label">${group.label}</div>
      ${group.routes.map(([id, label]) => `<button data-route="${id}" class="${state.route === id ? "active" : ""}">${label}</button>`).join("")}
    </div>`)
    .join("");
}

function initFilters() {
  fillSelect("#filter-dept", ["all", ...unique(projects.map((p) => p.dept))], "全部部门");
  fillSelect("#filter-biz", ["all", ...unique(projects.map((p) => p.biz))], "全部业务");
  fillSelect("#filter-status", ["all", ...unique(projects.map((p) => p.status))], "全部阶段");
  fillSelect("#filter-pm", ["all", ...unique(projects.map((p) => p.pm))], "全部 PM");
  Object.entries({ period: "#filter-period", dept: "#filter-dept", biz: "#filter-biz", status: "#filter-status", health: "#filter-health", pm: "#filter-pm" }).forEach(([key, selector]) => {
    const element = $(selector);
    element.value = state.filters[key];
    element.addEventListener("change", () => {
      state.filters[key] = element.value;
      render();
    });
  });
}

function fillSelect(selector, values, allLabel) {
  $(selector).innerHTML = values.map((value) => `<option value="${value}">${value === "all" ? allLabel : value}</option>`).join("");
}

function filteredProjects() {
  return projects.filter((project) => {
    const filters = state.filters;
    return (
      (filters.dept === "all" || project.dept === filters.dept) &&
      (filters.biz === "all" || project.biz === filters.biz) &&
      (filters.status === "all" || project.status === filters.status) &&
      (filters.health === "all" || effectiveHealth(project) === filters.health) &&
      (filters.pm === "all" || project.pm === filters.pm)
    );
  });
}

function resourceProjects() {
  const rows = new Map();
  allocations.forEach((allocation) => {
    if (!rows.has(allocation.projectId)) {
      rows.set(allocation.projectId, {
        id: allocation.projectId,
        name: allocation.projectName || allocation.projectId,
        cat: allocation.cat,
        dept: allocation.dept,
        biz: allocation.biz,
        system: allocation.system,
        status: allocation.status,
        complexity: allocation.complexity,
        health: allocation.status === "项目暂停" ? "R" : allocation.status === "UAT" ? "Y" : "G",
      });
    }
  });
  return [...rows.values()].filter((project) => {
    const filters = state.filters;
    const resourceFilters = state.resourceFilters;
    return (
      (filters.dept === "all" || project.dept === filters.dept) &&
      (filters.biz === "all" || project.biz === filters.biz) &&
      (filters.status === "all" || project.status === filters.status) &&
      (filters.health === "all" || project.health === filters.health) &&
      (resourceFilters.system === "all" || project.system === resourceFilters.system)
    );
  });
}

function projectAllocations(projectList = resourceProjects()) {
  const ids = new Set(projectList.map((project) => project.id));
  const names = new Set(projectList.map((project) => project.name).filter(Boolean));
  return allocations.filter((allocation) => {
    const inScope = ids.has(allocation.projectId) || names.has(allocation.projectName);
    const resourceFilters = state.resourceFilters;
    return (
      inScope &&
      (resourceFilters.role === "all" || allocation.role === resourceFilters.role) &&
      (resourceFilters.outsource === "all" ||
        (resourceFilters.outsource === "internal" && !allocation.outsourced) ||
        (resourceFilters.outsource === "external" && allocation.outsourced))
    );
  });
}

function personStats(projectList = resourceProjects()) {
  const rows = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const value = loadFor(allocation);
    const current = rows.get(allocation.person) || {
      person: allocation.person,
      role: allocation.role,
      dept: allocation.dept,
      outsourced: allocation.outsourced,
      projects: new Set(),
      ratio: 0,
      load: 0,
    };
    current.projects.add(allocation.projectId);
    current.ratio += allocation.timeRatio;
    current.load += value;
    current.outsourced = current.outsourced || allocation.outsourced;
    rows.set(allocation.person, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects] })).sort((a, b) => b.load - a.load);
}

function dashboardMetrics(list) {
  const projectIds = new Set(list.map((project) => project.id));
  const projectMilestones = milestones
    .filter((milestone) => projectIds.has(milestone.projectId))
    .sort((a, b) => parseDate(a.plannedEnd) - parseDate(b.plannedEnd));
  const stats = personStats(list);
  return {
    stats,
    red: list.filter((project) => effectiveHealth(project) === "R").length,
    yellow: list.filter((project) => effectiveHealth(project) === "Y").length,
    green: list.filter((project) => effectiveHealth(project) === "G").length,
    due: projectMilestones.filter((milestone) => ["M5", "M6", "M7"].some((suffix) => milestone.id.endsWith(suffix))).length,
    delayed: projectMilestones.filter((milestone) => milestone.state === "R").length,
    overload: stats.filter((person) => person.load >= 1.2).length,
    risks: projectMilestones.filter((milestone) => ["R", "Y"].includes(milestone.state)),
  };
}

function render() {
  initNav();
  const routeLabel = routes.find(([id]) => id === state.route)?.[1] || "总览 Dashboard";
  const showProjectFilters = projectFilterRoutes.includes(state.route);
  document.body.dataset.route = state.route;
  $("#page-title").textContent = routeLabel;
  $("#section-eyebrow").textContent = state.route === "dashboard" ? "Project Office" : "PMO Prototype";
  document.body.classList.toggle("settings-route", state.route === "settings");
  document.body.classList.toggle("no-filter-route", !showProjectFilters);
  const globalFilter = $(".filter-bar");
  if (globalFilter) globalFilter.hidden = !showProjectFilters;
  const view = $("#view");
  if (state.route === "dashboard") view.innerHTML = dashboardView();
  if (state.route === "projects") view.innerHTML = projectsView();
  if (state.route === "resource") view.innerHTML = resourceOverviewView();
  if (state.route === "matrix") view.innerHTML = matrixView();
  if (state.route === "workload") view.innerHTML = workloadView();
  if (state.route === "roles") view.innerHTML = rolesView();
  if (state.route === "busfactor") view.innerHTML = busFactorView();
  if (state.route === "people") view.innerHTML = peopleView();
  if (state.route === "upload") view.innerHTML = uploadView();
  if (state.route === "settings") view.innerHTML = settingsView();
}

function dashboardView() {
  const list = filteredProjects();
  const metrics = dashboardMetrics(list);
  const categoryRows = groupedProjectRows(list, "category");
  const statusRows = groupedProjectRows(list, "status");
  return `
    <div class="grid kpi-grid dashboard-kpis">
      ${kpi("项目总数", list.length, "当前筛选范围内项目")}
      ${kpi("红灯项目", metrics.red, "点击查看红灯项目", "R", "health-filter", "R")}
      ${kpi("黄灯项目", metrics.yellow, "需要跟踪排期和资源", "Y", "health-filter", "Y")}
      ${kpi("本月应完成里程碑", metrics.due, "测试/UAT/上线窗口")}
      ${kpi("已延期里程碑", metrics.delayed, "红灯里程碑段", "R")}
    </div>
    <div class="dashboard-priority">
      <section class="panel health-panel">
        <h2>项目健康分布</h2>
        <div class="bar-stack">
          ${barLine("红灯", metrics.red, list.length, "R")}
          ${barLine("黄灯", metrics.yellow, list.length, "Y")}
          ${barLine("绿灯", metrics.green, list.length, "G")}
        </div>
      </section>
      <section class="panel risk-panel">
        <h2>近期里程碑</h2>
        <div class="stack compact-list">
          ${metrics.risks.length ? metrics.risks.slice(0, 6).map((m) => riskRow(m)).join("") : '<p class="muted">当前筛选范围内暂无近期里程碑风险。</p>'}
        </div>
      </section>
    </div>
    <div class="dashboard-secondary">
      <section class="panel stage-panel">
        <h2>分类项目分布</h2>
        ${barChart(categoryRows, "dashboard-category")}
        ${distributionList(categoryRows)}
      </section>
      <section class="panel stage-panel">
        <h2>项目状态分布</h2>
        ${barChart(statusRows, "dashboard-status")}
        ${distributionList(statusRows)}
      </section>
    </div>`;
}

function kpi(label, value, hint, status = "", action = "", actionValue = "") {
  return `<article class="kpi ${action ? "clickable" : ""}" ${action ? `data-action="${action}" data-value="${actionValue}"` : ""}>
    <span>${label}</span><strong>${value}</strong><small>${hint}</small>${status ? `<div style="margin-top:8px">${badge(status)}</div>` : ""}
  </article>`;
}

function barLine(label, value, total, status) {
  const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
  return `<div class="bar-line"><strong>${label}</strong><div class="bar-track"><div class="bar-fill ${status}" style="width:${width}%"></div></div><span>${value}</span></div>`;
}

function riskRow(milestone) {
  const project = projects.find((p) => p.id === milestone.projectId);
  return `<button class="risk-row clickable" data-open-project="${project.id}">
    <span><strong>${project.name}</strong><br><span class="muted">${milestone.name} · 延期 ${milestone.delay} 天 · ${milestone.note}</span></span>
    ${badge(milestone.state)}
  </button>`;
}

function personRow(person) {
  return `<div class="person-row">
    <span><strong>${person.person}</strong><br><span class="muted">${person.role} · ${person.projects.length} 个项目 · 投入 ${(person.ratio * 100).toFixed(0)}%</span></span>
    <span class="badge ${person.load >= 1.2 ? "R" : person.load >= 0.6 ? "Y" : "G"}">${person.load.toFixed(2)}</span>
  </div>`;
}

function projectsView() {
  const list = filteredProjects();
  return `<section class="panel project-monitor">
      <div class="project-monitor-head">
        <div>
          <h2>关键里程碑监控</h2>
          <p class="muted">左侧按部门组织和业务部门分组，右侧为可横向滚动的连续里程碑甘特图。</p>
        </div>
        <input id="project-search" placeholder="搜索项目、编号、负责人" />
      </div>
      <div class="table-wrap" id="project-timeline-wrap">${timeline(list)}</div>
    </section>`;
}

function projectRows(list) {
  return list.map((project) => `<tr class="clickable" data-open-project="${project.id}">
    <td>${project.id}</td><td><strong>${project.name}</strong></td><td>${project.family}</td><td>${project.biz}</td><td>${project.pm}</td><td>${project.status}</td><td>${project.complexity}</td><td>${badge(project.health)}</td><td>${project.override ? badge(project.override) : '<span class="badge gray">无覆盖</span>'}</td><td>${project.overrideNote || "按系统状态展示"}</td>
  </tr>`).join("");
}

function timeline(list) {
  const projectIds = new Set(list.map((project) => project.id));
  const scopedMilestones = milestones.filter((milestone) => projectIds.has(milestone.projectId));
  if (!scopedMilestones.length) {
    return `<div class="monitor-board-empty">当前筛选条件下没有里程碑数据。</div>`;
  }
  const firstDate = monthStart(new Date(Math.min(...scopedMilestones.map((milestone) => parseDate(milestone.plannedStart).getTime()))));
  const lastDate = monthEnd(new Date(Math.max(...scopedMilestones.map((milestone) => parseDate(milestone.plannedEnd).getTime()))));
  const months = [];
  for (let cursor = firstDate; cursor <= lastDate; cursor = addMonths(cursor, 1)) {
    months.push(new Date(cursor));
  }
  const rangeMs = lastDate.getTime() - firstDate.getTime();
  const positionFor = (start, end) => {
    const startMs = parseDate(start).getTime();
    const endMs = parseDate(end).getTime();
    const left = Math.max(0, ((startMs - firstDate.getTime()) / rangeMs) * 100);
    const width = Math.max(3.5, ((endMs - startMs) / rangeMs) * 100);
    return { left: left.toFixed(3), width: Math.min(width, 100 - left).toFixed(3) };
  };
  const markerFor = (date) => (((parseDate(date).getTime() - firstDate.getTime()) / rangeMs) * 100).toFixed(3);
  const current = new Date(2026, 5, 6);
  const showToday = current >= firstDate && current <= lastDate;
  const todayLeft = showToday ? (((current.getTime() - firstDate.getTime()) / rangeMs) * 100).toFixed(3) : "";
  const groups = groupProjects(list);
  const rows = groups.flatMap((group) => [{ type: "group", group }, ...group.projects.map((project) => ({ type: "project", project }))]);
  return `<div class="monitor-board">
    <div class="project-list-pane">
      <div class="project-list-head">项目列表</div>
      ${rows.map((row) => row.type === "group" ? groupRow(row.group) : projectListRow(row.project)).join("")}
    </div>
    <div class="gantt-pane">
      <div class="gantt-scroll">
        <div class="gantt-canvas" style="--month-count:${months.length}">
          <div class="gantt-head">
            ${months.map((month) => `<span>${monthLabel(month)}</span>`).join("")}
            ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
          </div>
          ${rows.map((row) => row.type === "group" ? ganttGroupRow(row.group, months) : ganttProjectRow(row.project, months, positionFor, markerFor, showToday, todayLeft)).join("")}
        </div>
      </div>
    </div>
  </div>`;
}

function groupProjects(list) {
  const map = new Map();
  list.forEach((project) => {
    const key = `${project.dept}||${project.biz}`;
    if (!map.has(key)) {
      map.set(key, { dept: project.dept, biz: project.biz, projects: [] });
    }
    map.get(key).projects.push(project);
  });
  return [...map.values()];
}

function groupRow(group) {
  return `<div class="project-group-row">
    <strong>${group.dept}</strong>
    <span>${group.biz} · ${group.projects.length} 个项目</span>
  </div>`;
}

function projectListRow(project) {
  return `<button class="project-list-row" data-open-project="${project.id}" title="${project.name}">
    <span class="project-name">${project.name}</span>
    <span class="health-dot ${effectiveHealth(project)}">${healthLabel(effectiveHealth(project))}</span>
    <span class="project-meta">${project.id} 路 ${project.pm} 路 ${project.status}</span>
  </button>`;
}

function ganttGroupRow(group, months) {
  return `<div class="gantt-group-row">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
  </div>`;
}

function ganttProjectRow(project, months, positionFor, markerFor, showToday, todayLeft) {
  const items = milestones.filter((milestone) => milestone.projectId === project.id);
  const first = items[0];
  const last = items[items.length - 1];
  const lanePosition = positionFor(first.plannedStart, last.plannedEnd);
  const laneStart = parseDate(first.plannedStart).getTime();
  const laneEnd = parseDate(last.plannedEnd).getTime();
  const laneRange = laneEnd - laneStart;
  return `<div class="gantt-project-row">
    <div class="month-guides">${months.map(() => "<span></span>").join("")}</div>
    ${showToday ? `<div class="month-today-line" style="left:${todayLeft}%"></div>` : ""}
    <div class="gantt-lane" style="left:${lanePosition.left}%;width:${lanePosition.width}%">
      ${items.map((milestone, index) => {
        const start = parseDate(milestone.plannedStart).getTime();
        const end = parseDate(milestone.plannedEnd).getTime();
        const width = Math.max(7, ((end - start) / laneRange) * 100).toFixed(3);
        const actualEnd = milestone.actualEnd ? parseDate(milestone.actualEnd).getTime() : 0;
        const actualLate = actualEnd > end;
        const actualLeft = milestone.actualEnd ? Math.max(0, Math.min(100, ((actualEnd - start) / (end - start)) * 100)).toFixed(2) : "";
        return `<button class="gantt-segment ${milestone.state} ${index === 0 ? "first" : ""} ${index === items.length - 1 ? "last" : ""}" data-open-project="${project.id}" title="${milestone.name}: ${milestone.plannedStart} 至 ${milestone.plannedEnd} · ${milestone.note}" style="width:${width}%">
          <span class="gantt-segment-label">${milestone.name}</span>
          <span class="gantt-node plan" style="left:100%" title="计划完成：${milestone.name} · ${milestone.plannedEnd}">P</span>
          ${milestone.actualEnd ? `<span class="gantt-node ${actualLate ? "late" : "done"}" style="left:${actualLate ? "100" : actualLeft}%" title="${actualLate ? "延期完成" : "正常/提前完成"}：${milestone.name} · ${milestone.actualEnd}">${actualLate ? "!" : "A"}</span>` : ""}
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

function resourceOverviewView() {
  const list = resourceProjects();
  const stats = personStats(list);
  const all = projectAllocations(list);
  const people = resourcePeopleStats(list);
  const overallocated = people.filter((person) => person.ratio > 1).sort((a, b) => b.ratio - a.ratio);
  const projectCount = list.length;
  const activeProjects = list.filter((project) => project.status !== "项目暂停").length;
  const high = stats.filter((person) => person.load >= 1.2).length;
  const low = stats.filter((person) => person.load < 0.6).length;
  const totalLoad = stats.reduce((sum, person) => sum + person.load, 0);
  const avgLoad = stats.length ? totalLoad / stats.length : 0;
  const outsourcedPeople = people.filter((person) => person.outsourced).length;
  const busyPeople = [...people].sort((a, b) => b.load - a.load);
  const roleCompositionRows = roleComposition(all);
  return `<div class="resource-workspace resource-overview">
    <div class="resource-page-head">
      <div>
        <h2>全局看板 Dashboard</h2>
        <p class="muted">基于当前筛选条件，识别超分配、高负荷、低负荷和角色构成。</p>
      </div>
      <button class="ghost-button" data-action="export-workload-csv">导出负荷 CSV</button>
    </div>
    ${resourceFilterBar()}
    <div class="resource-kpi-strip">
      ${resourceKpi("总人数", people.length, `含外包 ${outsourcedPeople} 人`)}
      ${resourceKpi("项目总数", projectCount, `活跃 ${activeProjects} 个`)}
      ${resourceKpi("人均负荷", avgLoad.toFixed(2), "按 R2 workload 公式汇总")}
      ${resourceKpi("高负荷", high, ">= 1.2", "R")}
      ${resourceKpi("低负荷", low, "< 0.6", "G")}
    </div>
    <div class="resource-formula">
      <strong>分级口径：</strong>
      <span>负荷 = 工时投入占比 * sqrt(项目复杂度 / 5) * 角色 x 阶段参与度矩阵。分级：低 &lt; 0.6 · 中 0.6-1.2 · 高 &gt;= 1.2。Σ 工时占比 &gt; 100% 标注为超分配。</span>
    </div>
    <details class="panel resource-config">
      <summary>负荷计算配置 <span class="muted">点击展开配置阈值</span></summary>
      <div class="threshold-row">
        <span class="status g"><span class="dot g"></span>低负荷：load &lt; 0.6</span>
        <span class="status y"><span class="dot y"></span>中负荷：0.6 - 1.2</span>
        <span class="status r"><span class="dot r"></span>高负荷：load &gt;= 1.2</span>
        <span class="status y"><span class="dot y"></span>超分配：Σ 工时占比 &gt; 100%</span>
      </div>
    </details>
    <section class="panel resource-overalloc">
      <div class="matrix-toolbar">
        <h2>超分配告警（${overallocated.length} 人工时占比 &gt; 100%）</h2>
        <span class="muted">按工时占比降序</span>
      </div>
      ${overallocated.length ? `<div class="overalloc-grid">${overallocated.map((person) => overallocatedCard(person)).join("")}</div>` : '<p class="muted">当前筛选范围内没有超分配人员。</p>'}
    </section>
    <section class="panel role-composition-panel">
      <h2>角色构成</h2>
      ${rolePieChart(roleCompositionRows)}
    </section>
    <section class="panel busy-ranking">
      <div class="matrix-toolbar">
        <h2>忙闲排行榜</h2>
        <div class="inline-actions"><button class="small-button" data-route="workload">查看热力</button><span class="muted">${people.length} 人</span></div>
      </div>
      <div class="busy-list">
        <div class="busy-row busy-head"><span>排名</span><span>人员</span><span>负荷条</span><span>负荷</span><span>等级</span><span>项目数</span></div>
        ${busyPeople.map((person, index) => busyRankingRow(person, index, busyPeople[0]?.load || 1)).join("")}
      </div>
    </section>
  </div>`;
}

function systemRows(list = resourceProjects()) {
  const rows = new Map();
  projectAllocations(list).forEach((allocation) => {
    const key = allocation.system || "未归属系统";
    const current = rows.get(key) || { system: key, projects: new Set(), people: new Set(), ratio: 0, load: 0 };
    current.projects.add(allocation.projectId);
    current.people.add(allocation.person);
    current.ratio += allocation.timeRatio;
    current.load += loadFor(allocation);
    rows.set(key, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects], people: [...row.people] })).sort((a, b) => b.load - a.load);
}

function roleRows(list = resourceProjects()) {
  const rows = new Map();
  projectAllocations(list).forEach((allocation) => {
    const current = rows.get(allocation.role) || { role: allocation.role, people: new Set(), projects: new Set(), ratio: 0, load: 0, outsourced: 0, records: 0 };
    current.people.add(allocation.person);
    current.projects.add(allocation.projectId);
    current.ratio += allocation.timeRatio;
    current.load += loadFor(allocation);
    current.outsourced += allocation.outsourced ? 1 : 0;
    current.records += 1;
    rows.set(allocation.role, current);
  });
  return [...rows.values()].map((row) => ({ ...row, people: [...row.people], projects: [...row.projects] })).sort((a, b) => b.load - a.load);
}

function resourcePeopleStats(projectList = resourceProjects()) {
  const rows = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const load = loadFor(allocation);
    const current = rows.get(allocation.person) || {
      person: allocation.person,
      role: allocation.role,
      dept: allocation.dept,
      outsourced: allocation.outsourced,
      projects: new Set(),
      ratio: 0,
      load: 0,
    };
    current.projects.add(allocation.projectId);
    current.ratio += allocation.timeRatio;
    current.load += load;
    current.outsourced = current.outsourced || allocation.outsourced;
    rows.set(allocation.person, current);
  });
  return [...rows.values()].map((row) => ({ ...row, projects: [...row.projects] }));
}

function resourceKpi(label, value, hint, status = "") {
  return `<article class="kpi resource-kpi ${status ? `resource-kpi-${status}` : ""}">
    <span>${label}</span><strong>${value}</strong><small>${hint}</small>
  </article>`;
}

function loadLevel(value) {
  if (value >= 1.2) return { key: "R", label: "高负荷" };
  if (value >= 0.6) return { key: "Y", label: "中负荷" };
  return { key: "G", label: "低负荷" };
}

function personChip(person, interactive = true) {
  const tag = interactive ? "button" : "span";
  const action = interactive ? ` data-open-person="${person.person}"` : "";
  return `<${tag} class="person-chip ${person.outsourced ? "external" : ""}"${action}>
    ${person.person}${person.outsourced ? '<span>外包</span>' : ""}
  </${tag}>`;
}

function overallocatedCard(person) {
  return `<div class="overalloc-card">
    ${personChip(person)}
    <div class="overalloc-meta"><strong>${Math.round(person.ratio * 100)}%</strong><span>${person.projects.length} 项目</span></div>
  </div>`;
}

function busyRankingRow(person, index, maxLoad) {
  const level = loadLevel(person.load);
  const width = Math.max(4, Math.round((person.load / Math.max(maxLoad, 1)) * 100));
  return `<button class="busy-row" data-open-person="${person.person}">
    <span class="rank">${index + 1}</span>
    <span class="busy-person">${personChip(person, false)}${person.ratio > 1 ? '<span class="over-tag">超分配</span>' : ""}</span>
    <span class="bar-track"><span class="bar-fill ${level.key}" style="width:${width}%"></span></span>
    <strong class="mono">${person.load.toFixed(2)}</strong>
    <span class="badge ${level.key}">${level.label}</span>
    <span class="muted">${person.projects.length} 项目</span>
  </button>`;
}

function benchmarkParticipationMatrix() {
  const statuses = Object.keys(statusWeights);
  const rows = Object.entries(roleWeights);
  return `<div class="table-wrap benchmark-table"><table>
    <thead><tr><th>角色 / 阶段</th>${statuses.map((status) => `<th>${status}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([role, weights]) => `<tr><td><strong>${role}</strong></td>${statuses.map((status) => {
      const value = weights[status] ?? (status === "项目暂停" ? 0 : 0);
      return `<td><span class="bench-cell ${benchmarkClass(value)}">${Math.round(value * 100)}%</span></td>`;
    }).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function benchmarkClass(value) {
  if (value >= 0.7) return "high";
  if (value >= 0.3) return "medium";
  return "low";
}

function groupedProjectRows(projectList, field) {
  const rows = new Map();
  projectList.forEach((project) => {
    const key = project[field] || "未归类";
    rows.set(key, (rows.get(key) || 0) + 1);
  });
  return [...rows.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function roleComposition(allocationsList) {
  const rows = new Map();
  allocationsList.forEach((allocation) => {
    const current = rows.get(allocation.role) || new Set();
    current.add(allocation.person);
    rows.set(allocation.role, current);
  });
  return [...rows.entries()].map(([label, people]) => ({ label, value: people.size })).sort((a, b) => b.value - a.value);
}

function distributionList(rows) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return `<div class="distribution-list">${rows.map((row) => `<div class="distribution-row">
    <span>${row.label}</span>
    <div class="bar-track"><div class="bar-fill G" style="width:${Math.max(4, Math.round((row.value / max) * 100))}%"></div></div>
    <strong class="mono">${row.value}</strong>
  </div>`).join("")}</div>`;
}

function rolePieChart(rows) {
  if (!rows.length) return '<p class="muted">当前筛选范围内暂无角色数据。</p>';
  const palette = ["#4c7a95", "#5f8f73", "#b88745", "#9b6b7c", "#6d78a8", "#8a7653", "#4f8f8a", "#a06454", "#6f6b85", "#72825b"];
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const radius = 78;
  const center = 90;
  let start = -Math.PI / 2;
  const paths = rows.map((row, index) => {
    const angle = (row.value / total) * Math.PI * 2;
    const end = start + angle;
    const large = angle > Math.PI ? 1 : 0;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    start = end;
    return `<path d="M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${palette[index % palette.length]}"></path>`;
  }).join("");
  return `<div class="role-pie-layout">
    <div class="role-pie-wrap">
      <svg class="role-pie-chart" viewBox="0 0 180 180" role="img" aria-label="角色构成饼图">${paths}<circle cx="${center}" cy="${center}" r="42" class="role-pie-hole"></circle></svg>
      <div class="role-pie-total"><strong>${total}</strong><span>人员</span></div>
    </div>
    <div class="role-pie-legend">${rows.map((row, index) => {
      const pct = Math.round((row.value / total) * 100);
      return `<div class="role-pie-legend-row"><span class="legend-dot" style="background:${palette[index % palette.length]}"></span><strong>${row.label}</strong><span>${row.value}</span><small>${pct}%</small></div>`;
    }).join("")}</div>
  </div>`;
}

function barChart(rows, id) {
  const visible = rows.slice(0, 8);
  const max = Math.max(...visible.map((row) => row.value), 1);
  const width = 360;
  const height = 150;
  const gap = 8;
  const barWidth = visible.length ? (width - gap * (visible.length - 1)) / visible.length : width;
  return `<svg class="resource-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${id}">
    <line x1="0" y1="${height - 24}" x2="${width}" y2="${height - 24}" class="chart-axis"></line>
    ${visible.map((row, index) => {
      const barHeight = Math.max(6, Math.round((row.value / max) * 92));
      const x = index * (barWidth + gap);
      const y = height - 24 - barHeight;
      return `<g>
        <rect x="${x}" y="${y}" width="${Math.max(8, barWidth)}" height="${barHeight}" rx="4" class="chart-bar-rect"></rect>
        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" class="chart-value">${row.value}</text>
        <text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" class="chart-label">${escapeHtml(String(row.label)).slice(0, 6)}</text>
      </g>`;
    }).join("")}
  </svg>`;
}

function workloadSummaryTable(rows) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>排名</th><th>人员</th><th>角色</th><th>来源</th><th>项目数</th><th>工时占比</th><th>计算负荷</th><th>等级</th><th>超分配</th></tr></thead>
    <tbody>${rows.map((person, index) => {
      const level = loadLevel(person.load);
      return `<tr class="clickable" data-open-person="${person.person}"><td>${index + 1}</td><td><strong>${person.person}</strong></td><td>${person.role}</td><td>${person.outsourced ? "外包" : "内部"}</td><td>${person.projects.length}</td><td>${Math.round(person.ratio * 100)}%</td><td>${person.load.toFixed(2)}</td><td><span class="badge ${level.key}">${level.label}</span></td><td>${person.ratio > 1 ? '<span class="over-tag">是</span>' : '<span class="muted">否</span>'}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

function businessProjectGroups(projectList = resourceProjects()) {
  const grouped = new Map();
  projectAllocations(projectList).forEach((allocation) => {
    const biz = allocation.biz || "未归属业务部门";
    const group = grouped.get(biz) || new Map();
    const current = group.get(allocation.projectId) || {
      projectId: allocation.projectId,
      projectName: allocation.projectName,
      system: allocation.system,
      cat: allocation.cat,
      biz,
      status: allocation.status,
      complexity: allocation.complexity,
      roles: new Map(),
      totalRatio: 0,
      totalLoad: 0,
    };
    const people = current.roles.get(allocation.role) || new Map();
    people.set(allocation.person, allocation.outsourced);
    current.roles.set(allocation.role, people);
    current.totalRatio += allocation.timeRatio;
    current.totalLoad += loadFor(allocation);
    group.set(allocation.projectId, current);
    grouped.set(biz, group);
  });
  return [...grouped.entries()].map(([biz, projectsMap]) => ({
    biz,
    projects: [...projectsMap.values()].sort((a, b) => b.totalLoad - a.totalLoad),
  })).sort((a, b) => b.projects.length - a.projects.length || a.biz.localeCompare(b.biz));
}

function businessProjectGroupsView(groups) {
  if (!groups.length) return '<p class="muted">当前筛选范围内暂无人员项目分组。</p>';
  return `<div class="business-group-list">${groups.map((group) => `<details class="business-group" open>
    <summary><strong>${group.biz}</strong><span class="muted">${group.projects.length} 个项目</span></summary>
    <div class="table-wrap business-project-table"><table>
      <thead><tr><th>系统 / 项目</th><th>阶段</th><th>复杂度</th><th>产品</th><th>项目</th><th>Agent</th><th>技术</th><th>测试</th><th>运维 / 其他</th><th>投入</th></tr></thead>
      <tbody>${group.projects.map((project) => `<tr>
        <td><strong>${project.projectName}</strong><br><span class="muted">${project.system} · ${project.cat}</span></td>
        <td>${project.status}</td>
        <td>${project.complexity}</td>
        <td>${rolePeopleCell(project, ["产品经理", "Product Manager", "产品"])}</td>
        <td>${rolePeopleCell(project, ["项目经理", "PM", "Project Manager"])}</td>
        <td>${rolePeopleCell(project, ["Agent开发", "Agent", "AI Agent", "智能体"])}</td>
        <td>${rolePeopleCell(project, ["技术负责人", "Tech Lead", "开发", "架构师"])}</td>
        <td>${rolePeopleCell(project, ["测试", "QA", "测试负责人"])}</td>
        <td>${otherRolePeopleCell(project, ["产品经理", "Product Manager", "产品", "项目经理", "PM", "Project Manager", "Agent开发", "Agent", "AI Agent", "智能体", "技术负责人", "Tech Lead", "开发", "架构师", "测试", "QA", "测试负责人"])}</td>
        <td><strong>${Math.round(project.totalRatio * 100)}%</strong><br><span class="muted">${project.totalLoad.toFixed(2)}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </details>`).join("")}</div>`;
}

function rolePeopleCell(project, aliases) {
  const entries = [...project.roles.entries()].filter(([role]) => aliases.some((alias) => role.includes(alias)));
  return peopleFromRoleEntries(entries);
}

function otherRolePeopleCell(project, knownAliases) {
  const entries = [...project.roles.entries()].filter(([role]) => !knownAliases.some((alias) => role.includes(alias)));
  return peopleFromRoleEntries(entries);
}

function peopleFromRoleEntries(entries) {
  const people = [];
  entries.forEach(([, peopleMap]) => peopleMap.forEach((outsourced, person) => people.push({ person, outsourced })));
  if (!people.length) return '<span class="muted">-</span>';
  return `<div class="people-chip-list">${people.slice(0, 4).map((item) => personChip(item, true)).join("")}${people.length > 4 ? `<span class="muted">+${people.length - 4}</span>` : ""}</div>`;
}

function matrixView() {
  const list = resourceProjects();
  const groups = businessProjectGroups(list);
  return `<div class="resource-workspace people-project-workspace">
    ${resourceFilterBar()}
    <section class="panel benchmark-panel">
      <div class="matrix-toolbar">
        <div>
          <h2>📊 角色 × 项目阶段 参与度（矩阵单元格百分比来源）</h2>
          <p class="muted">矩阵用于 R2 V7 负荷公式中的角色阶段权重：复杂度 × 状态权重 × 角色参与度。</p>
        </div>
        <div class="inline-actions"><span class="badge G">低参与</span><span class="badge Y">中参与</span><span class="badge R">高参与</span></div>
      </div>
      ${benchmarkParticipationMatrix()}
    </section>
    <section class="panel business-groups-panel">
      <div class="matrix-toolbar">
        <div>
          <h2>业务部门分组项目人员</h2>
          <p class="muted">按 R2 workspace 的业务部门分组，把每个项目的产品、项目、Agent、技术、测试、运维等参与人员展开。</p>
        </div>
        <span class="muted">${groups.reduce((sum, group) => sum + group.projects.length, 0)} 个项目</span>
      </div>
      ${businessProjectGroupsView(groups)}
    </section>
  </div>`;
}

function resourceFilterBar() {
  const systems = ["all", ...unique(allocations.map((allocation) => allocation.system))];
  const roles = ["all", ...unique(allocations.map((allocation) => allocation.role))];
  return `<section class="resource-filter-panel">
    <span class="tag">资源筛选</span>
    <label>系统<select data-resource-filter="system">${systems.map((value) => `<option value="${value}" ${state.resourceFilters.system === value ? "selected" : ""}>${value === "all" ? "全部系统" : value}</option>`).join("")}</select></label>
    <label>角色<select data-resource-filter="role">${roles.map((value) => `<option value="${value}" ${state.resourceFilters.role === value ? "selected" : ""}>${value === "all" ? "全部角色" : value}</option>`).join("")}</select></label>
    <label>人员类型<select data-resource-filter="outsource">
      <option value="all" ${state.resourceFilters.outsource === "all" ? "selected" : ""}>全部人员</option>
      <option value="internal" ${state.resourceFilters.outsource === "internal" ? "selected" : ""}>内部</option>
      <option value="external" ${state.resourceFilters.outsource === "external" ? "selected" : ""}>外包</option>
    </select></label>
  </section>`;
}

function roleCoverageTable(rows) {
  const maxLoad = Math.max(...rows.map((row) => row.load), 1);
  return `<div class="table-wrap"><table>
    <thead><tr><th>角色</th><th>人员数</th><th>项目数</th><th>投入比例</th><th>总负荷</th><th>外包占比</th><th>负荷分布</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><td><strong>${row.role}</strong></td><td>${row.people.length}</td><td>${row.projects.length}</td><td>${Math.round(row.ratio * 100)}%</td><td>${row.load.toFixed(2)}</td><td>${Math.round((row.outsourced / row.records) * 100)}%</td><td><div class="bar-track"><div class="bar-fill ${row.load >= 8 ? "R" : row.load >= 4 ? "Y" : "G"}" style="width:${Math.max(4, Math.round((row.load / maxLoad) * 100))}%"></div></div></td></tr>`).join("")}</tbody>
  </table></div>`;
}

function systemProjectView() {
  const list = resourceProjects();
  const systems = systemRows(list);
  const projectsBySystem = new Map();
  list.forEach((project) => {
    const key = project.system || "未归属系统";
    projectsBySystem.set(key, [...(projectsBySystem.get(key) || []), project]);
  });
  return `<section class="panel matrix-panel">
    <div class="matrix-toolbar">
      <h2>系统 x 项目</h2>
      <div class="inline-actions"><span class="badge G">项目数</span><span class="badge Y">投入比例</span><span class="badge R">总负荷</span></div>
    </div>
    <div class="table-wrap system-project-table"><table>
      <thead><tr><th>系统</th><th>项目覆盖</th><th>人员数</th><th>投入比例</th><th>总负荷</th><th>高负荷项目</th></tr></thead>
      <tbody>${systems.map((row) => {
        const projects = projectsBySystem.get(row.system) || [];
        const heavy = projects.map((project) => {
          const total = allocations.filter((allocation) => allocation.projectId === project.id).reduce((sum, allocation) => sum + loadFor(allocation), 0);
          return { project, total };
        }).sort((a, b) => b.total - a.total).slice(0, 3);
        return `<tr><td><strong>${row.system}</strong></td><td>${projects.map((project) => `<span class="tag">${project.name}</span>`).join("")}</td><td>${row.people.length}</td><td>${Math.round(row.ratio * 100)}%</td><td>${row.load.toFixed(2)}</td><td>${heavy.map((item) => `${item.project.name} ${item.total.toFixed(1)}`).join(" / ")}</td></tr>`;
      }).join("")}</tbody>
    </table></div>
  </section>`;
}

function matrixCell(person, projectId) {
  const items = allocations.filter((a) => {
    const resourceFilters = state.resourceFilters;
    return (
      a.person === person &&
      a.projectId === projectId &&
      (resourceFilters.role === "all" || a.role === resourceFilters.role) &&
      (resourceFilters.outsource === "all" ||
        (resourceFilters.outsource === "internal" && !a.outsourced) ||
        (resourceFilters.outsource === "external" && a.outsourced))
    );
  });
  if (!items.length) return `<td><span class="load-empty">-</span></td>`;
  const ratio = items.reduce((sum, item) => sum + item.timeRatio, 0);
  const load = items.reduce((sum, item) => sum + loadFor(item), 0);
  return `<td><button class="cell ${loadClass(load)}" data-open-person="${person}"><strong>${Math.round(ratio * 100)}%</strong><small>${load.toFixed(2)}</small></button></td>`;
}

function workloadView() {
  const list = resourceProjects();
  const stats = personStats(list);
  const projectIds = list.map((project) => project.id);
  const all = projectAllocations(list);
  const high = stats.filter((person) => person.load >= 1.2).length;
  const outsourcedRatio = all.length ? Math.round((all.filter((allocation) => allocation.outsourced).length / all.length) * 100) : 0;
  return `<div class="resource-workspace workload-heatmap-workspace">
    ${resourceFilterBar()}
    <section class="panel matrix-panel">
      <div class="matrix-toolbar">
        <div>
          <h2>人员 × 项目 热力</h2>
          <p class="muted">单元格显示投入比例 / 计算负荷；点击热力单元格或人员行，以抽屉形式查看人员项目贡献。</p>
        </div>
        <div class="inline-actions"><span class="badge G">低 &lt; 0.6</span><span class="badge Y">中 0.6-1.2</span><span class="badge R">高 &gt;= 1.2</span></div>
      </div>
      <div class="matrix-summary">
        ${kpi("当前人数", stats.length, "筛选范围")}
        ${kpi("项目数", list.length, "热力列")}
        ${kpi("总投入比例", `${Math.round(all.reduce((sum, allocation) => sum + allocation.timeRatio, 0) * 100)}%`, "Excel 工时投入占比")}
        ${kpi("高负载人员", high, "load >= 1.2", high ? "R" : "G")}
        ${kpi("外包占比", `${outsourcedRatio}%`, "资源分配记录")}
        ${kpi("钻取", "抽屉", "人员项目贡献明细")}
      </div>
      <div class="matrix compact-matrix heatmap-matrix"><table>
        <thead><tr><th>人员 / 项目</th>${list.map((project) => `<th><span>${project.name}</span><small>${project.system || ""}</small></th>`).join("")}</tr></thead>
        <tbody>${stats.map((person) => `<tr class="clickable" data-open-person="${person.person}"><td><strong>${person.person}</strong><span class="muted">${person.role}${person.outsourced ? " · 外包" : " · 内部"}</span></td>${projectIds.map((id) => matrixCell(person.person, id)).join("")}</tr>`).join("")}</tbody>
      </table></div>
    </section>
    <section class="panel stack-sm">
      <h2>负荷阈值</h2>
      <div class="threshold-row">
        <span class="status g"><span class="dot g"></span>低：load &lt; 0.6</span>
        <span class="status y"><span class="dot y"></span>中：0.6 - 1.2</span>
        <span class="status r"><span class="dot r"></span>高：load &gt;= 1.2</span>
      </div>
    </section>
  </div>`;
}

function busFactorRows() {
  return resourceProjects().map((project) => {
    const contributors = projectAllocations([project]).map((a) => ({ ...a, load: loadFor(a) })).sort((a, b) => b.load - a.load);
    const total = contributors.reduce((sum, item) => sum + item.load, 0);
    const roleCoverage = new Map();
    contributors.forEach((item) => {
      const people = roleCoverage.get(item.role) || new Set();
      people.add(item.person);
      roleCoverage.set(item.role, people);
    });
    let acc = 0;
    let bf = 0;
    for (const item of contributors) {
      if (total > 0 && acc / total < 0.5) {
        acc += item.load;
        bf += 1;
      }
    }
    const top = contributors[0];
    const singleRoles = [...roleCoverage.entries()].filter(([, people]) => people.size === 1).map(([role]) => role);
    return {
      project,
      contributors,
      total,
      bf,
      peopleCount: unique(contributors.map((item) => item.person)).length,
      topPerson: top?.person || "-",
      topLoad: top?.load || 0,
      topShare: total ? (top?.load || 0) / total : 0,
      singleRoles,
      roleCoverage,
      risk: bf <= 1 ? "R" : bf === 2 ? "Y" : "G",
    };
  }).sort((a, b) => a.bf - b.bf || b.topShare - a.topShare);
}

function keyPeopleRiskRows(rows) {
  const people = new Map();
  rows.filter((row) => row.bf <= 2).forEach((row) => {
    row.contributors.slice(0, Math.max(1, row.bf)).forEach((item) => {
      const current = people.get(item.person) || { person: item.person, projects: new Set(), load: 0, singlePoint: 0 };
      current.projects.add(row.project.name);
      current.load += item.load;
      if (row.bf === 1) current.singlePoint += 1;
      people.set(item.person, current);
    });
  });
  return [...people.values()].map((item) => ({ ...item, projectCount: item.projects.size })).sort((a, b) => b.singlePoint - a.singlePoint || b.load - a.load);
}

function donutChart(rows) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  let offset = 25;
  const circles = rows.map((row) => {
    const pct = (row.value / total) * 100;
    const circle = `<circle class="donut-segment ${row.key}" cx="21" cy="21" r="15.9" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"></circle>`;
    offset -= pct;
    return circle;
  }).join("");
  return `<div class="donut-wrap"><svg class="donut-chart" viewBox="0 0 42 42" role="img"><circle class="donut-bg" cx="21" cy="21" r="15.9"></circle>${circles}</svg><div class="donut-total"><strong>${rows.reduce((sum, row) => sum + row.value, 0)}</strong><span>项目</span></div></div>`;
}

function horizontalRiskBars(rows) {
  if (!rows.length) return '<p class="muted">当前筛选范围内没有关键人风险。</p>';
  const max = Math.max(...rows.map((row) => row.load), 1);
  return `<div class="bf-bars">${rows.map((row, index) => `<button class="bf-bar-row" data-open-person="${row.person}"><span class="rank">${index + 1}</span><strong>${row.person}</strong><span class="bar-track"><span class="bar-fill ${row.singlePoint ? "R" : "Y"}" style="width:${Math.max(4, Math.round((row.load / max) * 100))}%"></span></span><span class="mono">${row.load.toFixed(2)}</span><span class="muted">${row.projectCount} 项</span></button>`).join("")}</div>`;
}

function busFactorRedlineCard(row) {
  return `<article class="bf-risk-card"><div><span class="badge R">BF=1</span><h3>${row.project.name}</h3><p class="muted">${row.project.system} · ${row.project.status}</p></div><div class="bf-risk-meta"><span>关键人 <strong>${row.topPerson}</strong></span><span>Top 贡献 <strong>${Math.round(row.topShare * 100)}%</strong></span><span>总负荷 <strong>${row.total.toFixed(2)}</strong></span></div><p>${busFactorExplain(row)}</p></article>`;
}

function busFactorCoverageHeatmap(rows) {
  const roles = unique(allocations.map((allocation) => allocation.role)).slice(0, 8);
  if (!rows.length || !roles.length) return '<p class="muted">暂无覆盖数据。</p>';
  return `<div class="table-wrap coverage-heatmap"><table><thead><tr><th>项目 / 角色</th>${roles.map((role) => `<th>${role}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${row.project.name}</strong><span class="muted">BF ${row.bf}</span></td>${roles.map((role) => {
    const count = row.roleCoverage.get(role)?.size || 0;
    const cls = count <= 0 ? "empty" : count === 1 ? "risk" : count === 2 ? "warn" : "ok";
    return `<td><span class="coverage-cell ${cls}">${count || "-"}</span></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function busFactorView() {
  const rows = busFactorRows();
  const singlePoint = rows.filter((row) => row.risk === "R").length;
  const medium = rows.filter((row) => row.risk === "Y").length;
  const healthy = rows.filter((row) => row.risk === "G").length;
  const keyPeople = keyPeopleRiskRows(rows);
  const pieRows = [
    { label: "BF=1", value: singlePoint, key: "R" },
    { label: "BF=2", value: medium, key: "Y" },
    { label: "BF≥3", value: healthy, key: "G" },
  ];
  const redline = rows.filter((row) => row.bf <= 1);
  return `<div class="resource-workspace busfactor-dashboard">
    <div class="resource-page-head">
      <div>
        <h2>Bus Factor 仪表盘</h2>
        <p class="muted">Bus Factor（公交因子）= 一个项目中，按负荷贡献从高到低累计达到 50% 所需的最少人数。BF=1 表示单点失败风险，BF=2 双备份但仍脆弱，BF≥3 健康。本仪表盘按 V7 负荷公式（复杂度 × 状态权重 × 角色参与度）计算每人对每个项目的贡献。</p>
      </div>
      <div class="inline-actions"><button class="ghost-button" data-action="export-bf-projects">项目 BF 清单</button><button class="ghost-button" data-action="export-bf-people">关键人风险榜</button></div>
    </div>
    ${resourceFilterBar()}
    <div class="matrix-summary bf-kpis">
      ${kpi("BF=1 红线", singlePoint, "单点失败风险", singlePoint ? "R" : "G")}
      ${kpi("BF=2", medium, "双备份但仍脆弱", medium ? "Y" : "G")}
      ${kpi("BF≥3", healthy, "覆盖健康", "G")}
      ${kpi("关键人节点", keyPeople.length, "出现在风险项目 Top 贡献中")}
      ${kpi("风险口径", "50%", "累计贡献阈值")}
      ${kpi("V7 公式", "启用", "复杂度 × 状态权重 × 角色参与度")}
    </div>
    <div class="bf-chart-grid">
      <section class="panel">
        <h2>Bus Factor 全景分布</h2>
        ${donutChart(pieRows)}
        ${distributionList(pieRows)}
      </section>
      <section class="panel">
        <h2>关键人风险榜（Top 10）</h2>
        ${horizontalRiskBars(keyPeople.slice(0, 10))}
      </section>
    </div>
    <section class="panel bf-redline-panel">
      <div class="matrix-toolbar"><h2>BF=1 红线项目</h2><span class="muted">优先做知识备份、角色补位和交付拆分</span></div>
      ${redline.length ? `<div class="bf-card-grid">${redline.map((row) => busFactorRedlineCard(row)).join("")}</div>` : '<p class="muted">当前筛选范围内没有 BF=1 红线项目。</p>'}
    </section>
    <section class="panel bf-coverage-panel">
      <div class="matrix-toolbar"><h2>角色 × 项目覆盖热力</h2><span class="muted">单角色单人覆盖会形成隐性 Bus Factor 风险</span></div>
      ${busFactorCoverageHeatmap(rows.slice(0, 8))}
    </section>
    <section class="panel">
      <h2>项目 Bus Factor 明细</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>项目</th><th>总负荷</th><th>Bus Factor</th><th>关键贡献人</th><th>Top 贡献占比</th><th>参与人数</th><th>单人覆盖角色</th><th>项目健康</th><th>风险解释</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td><strong>${row.project.name}</strong><br><span class="muted">${row.project.system}</span></td><td>${row.total.toFixed(2)}</td><td><strong>${row.bf}</strong></td><td>${row.contributors.slice(0, 3).map((c) => `${c.person} ${c.load.toFixed(2)}`).join(" / ")}</td><td>${Math.round(row.topShare * 100)}%</td><td>${row.peopleCount}</td><td>${row.singleRoles.length ? row.singleRoles.join(" / ") : '<span class="muted">-</span>'}</td><td>${badge(row.project.health)}</td><td>${busFactorExplain(row)}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>
  </div>`;
}

function busFactorExplain(row) {
  if (row.risk === "R") return "一个人累计贡献已经达到项目 50% 关键负荷，关键人离开会导致项目停摆风险。";
  if (row.risk === "Y") return "两个人即可覆盖 50% 关键负荷，存在排期冲突和知识集中风险。";
  return "达到 50% 关键负荷需要三人及以上，当前覆盖相对健康。";
}

function rolesView() {
  const rows = roleRows();
  return `<div class="resource-workspace">
    ${resourceFilterBar()}
    <section class="panel">
    <div class="matrix-toolbar">
      <h2>角色覆盖</h2>
      <div class="inline-actions"><span class="badge G">人员</span><span class="badge Y">项目</span><span class="badge R">负荷</span></div>
    </div>
    ${roleCoverageTable(rows)}
  </section>
  </div>`;
}

function peopleView() {
  const stats = personStats();
  return `<section class="panel people-index-panel">
    <div class="matrix-toolbar">
      <h2>人员索引</h2>
      <input id="people-search" placeholder="搜索人员、角色、部门" />
    </div>
    <div class="people-grid" id="people-grid">
      ${stats.map((person) => peopleCard(person)).join("")}
    </div>
  </section>`;
}

function peopleCard(person) {
  const level = person.load >= 1.2 ? "R" : person.load >= 0.6 ? "Y" : "G";
  return `<button class="people-card" data-open-person="${person.person}">
    <strong>${person.person}</strong>
    <span class="muted">${person.role} · ${person.dept}</span>
    <span class="people-card-meta"><span>${person.projects.length} 个项目</span><span>${Math.round(person.ratio * 100)}%</span>${badge(level)}</span>
  </button>`;
}

function uploadView() {
  return `<div class="upload-layout">
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>项目数据上传</h2>
          <p class="muted">用于项目主数据和关键里程碑，不包含任务颗粒度。</p>
        </div>
        <button class="ghost-button" data-action="download-project-template">下载项目模板</button>
      </div>
      <div class="dropzone"><div><strong>上传项目 Excel</strong><p class="muted">建议包含 Project 与 Milestone 两张表；模板内已放入当前设计案例。</p><button class="primary-button" data-action="mock-project-upload">模拟解析项目文件</button></div></div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("Project Sheet", `${projects.length} 行样例`, "项目主数据字段完整", "G")}
        ${uploadRow("Milestone Sheet", `${milestones.length} 行样例`, "按项目编号关联里程碑", "G")}
        ${uploadRow("PMO Override", "可选", "手动健康度覆盖仍由系统保存", "Y")}
      </div>
    </section>
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>资源数据上传</h2>
          <p class="muted">字段参考 R2 Workforce Dashboard，当前模板包含 R2 提取的资源记录。</p>
        </div>
        <button class="ghost-button" data-action="download-resource-template">下载资源模板</button>
      </div>
      <div class="dropzone"><div><strong>上传资源 Excel</strong><p class="muted">用于人员 x 项目、人员负载和 Bus Factor 统计。</p><button class="primary-button" data-action="mock-resource-upload">模拟解析资源文件</button></div></div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("ResourceAllocation Sheet", `${allocations.length} 行 R2 数据`, "可直接用于当前资源视图", "G")}
        ${uploadRow("必填字段", "项目 / 角色 / 人员 / 工时投入占比", "缺失会阻断导入", "Y")}
        ${uploadRow("计算字段", "负荷值 / 角色状态键", "系统根据模板字段自动计算", "G")}
      </div>
    </section>
  </div>`;
}

function uploadRow(name, rows, status, health) {
  return `<div class="upload-row"><span><strong>${name}</strong><br><span class="muted">${rows} · ${status}</span></span>${badge(health)}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tableSheet(title, columns, rows) {
  return `<h2>${escapeHtml(title)}</h2><table border="1"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function downloadExcelTemplate(filename, sheets) {
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,"Microsoft YaHei",sans-serif}table{border-collapse:collapse;margin-bottom:24px}th{background:#f4f1eb}th,td{padding:6px 10px;border:1px solid #d8d2ca;white-space:nowrap}</style></head><body>${sheets.join("")}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportWorkloadCsv() {
  const rows = resourcePeopleStats().sort((a, b) => b.load - a.load);
  const header = ["人员", "角色", "部门", "人员类型", "项目数", "工时占比", "计算负荷", "负荷等级", "是否超分配"];
  const lines = [
    header.map(csvValue).join(","),
    ...rows.map((person) => {
      const level = loadLevel(person.load);
      return [
        person.person,
        person.role,
        person.dept,
        person.outsourced ? "外包" : "内部",
        person.projects.length,
        `${Math.round(person.ratio * 100)}%`,
        person.load.toFixed(4),
        level.label,
        person.ratio > 1 ? "是" : "否",
      ].map(csvValue).join(",");
    }),
  ];
  downloadTextFile("PMO_资源负荷_R2口径.csv", lines.join("\n"));
}

function exportBusFactorProjects() {
  const header = ["项目", "系统", "阶段", "总负荷", "Bus Factor", "关键贡献人", "Top贡献占比", "参与人数", "单人覆盖角色", "风险解释"];
  const lines = [header.map(csvValue).join(","), ...busFactorRows().map((row) => [
    row.project.name,
    row.project.system,
    row.project.status,
    row.total.toFixed(4),
    row.bf,
    row.topPerson,
    `${Math.round(row.topShare * 100)}%`,
    row.peopleCount,
    row.singleRoles.join(" / "),
    busFactorExplain(row),
  ].map(csvValue).join(","))];
  downloadTextFile("PMO_Bus_Factor_项目清单.csv", lines.join("\n"));
}

function exportBusFactorPeople() {
  const header = ["人员", "风险项目数", "BF1项目数", "关键贡献负荷", "相关项目"];
  const lines = [header.map(csvValue).join(","), ...keyPeopleRiskRows(busFactorRows()).map((row) => [
    row.person,
    row.projectCount,
    row.singlePoint,
    row.load.toFixed(4),
    [...row.projects].join(" / "),
  ].map(csvValue).join(","))];
  downloadTextFile("PMO_Bus_Factor_关键人风险榜.csv", lines.join("\n"));
}

function downloadResourceTemplate() {
  const columns = [
    { key: "id", label: "分配ID" },
    { key: "cat", label: "分类" },
    { key: "dept", label: "部门组织" },
    { key: "biz", label: "业务部门" },
    { key: "system", label: "系统" },
    { key: "projectName", label: "项目" },
    { key: "complexity", label: "项目复杂度" },
    { key: "status", label: "项目状态" },
    { key: "role", label: "角色" },
    { key: "person", label: "人员" },
    { key: "personKey", label: "人员(关联)" },
    { key: "outsourcedText", label: "是否外包" },
    { key: "timeRatio", label: "工时投入占比" },
    { key: "statusWeight", label: "状态权重" },
    { key: "roleWeight", label: "角色参与度" },
    { key: "load", label: "负载值" },
    { key: "projectId", label: "项目唯一键" },
    { key: "personKey", label: "人员唯一键" },
    { key: "roleStatusKey", label: "角色状态键" },
  ];
  const rows = allocations.map((allocation) => {
    const statusWeight = statusWeights[allocation.status] ?? 0.5;
    const roleWeight = roleWeights[allocation.role]?.[allocation.status] ?? statusWeight;
    return {
      ...allocation,
      personKey: allocation.person,
      outsourcedText: allocation.outsourced ? "是" : "否",
      statusWeight,
      roleWeight,
      load: loadFor(allocation).toFixed(4),
      roleStatusKey: `${allocation.role}|${allocation.status}`,
    };
  });
  downloadExcelTemplate("PMO_资源统计模板_R2数据.xls", [tableSheet("ResourceAllocation", columns, rows)]);
}

function downloadProjectTemplate() {
  const projectColumns = [
    { key: "id", label: "项目编号" },
    { key: "category", label: "分类" },
    { key: "dept", label: "部门组织" },
    { key: "biz", label: "业务部门" },
    { key: "family", label: "产品族名称" },
    { key: "name", label: "项目名称" },
    { key: "health", label: "健康度(R/Y/G)" },
    { key: "gate", label: "门禁状态" },
    { key: "complexity", label: "复杂度" },
    { key: "status", label: "项目状态" },
    { key: "init", label: "立项状态" },
    { key: "level", label: "建议分级" },
    { key: "pm", label: "当前PM" },
    { key: "product", label: "产品经理" },
    { key: "tech", label: "技术负责人" },
  ];
  const milestoneColumns = [
    { key: "id", label: "里程碑ID" },
    { key: "projectId", label: "项目编号" },
    { key: "projectName", label: "项目名称" },
    { key: "name", label: "里程碑名称" },
    { key: "plannedStart", label: "计划开始日期" },
    { key: "plannedEnd", label: "计划结束日期" },
    { key: "actualStart", label: "实际开始日期" },
    { key: "actualEnd", label: "实际结束日期" },
    { key: "state", label: "状态(R/Y/G)" },
    { key: "note", label: "备注" },
  ];
  const milestoneRows = milestones.map((milestone) => {
    const project = projects.find((item) => item.id === milestone.projectId);
    return { ...milestone, projectName: project?.name || "" };
  });
  downloadExcelTemplate("PMO_项目上传模板_案例.xls", [
    tableSheet("Project", projectColumns, projects),
    tableSheet("Milestone", milestoneColumns, milestoneRows),
  ]);
}

function settingsView() {
  return `<div class="settings-grid">
    <section class="panel settings-panel">
      <div class="settings-head"><h2>健康灯规则</h2><button class="primary-button" data-action="save-settings">保存设置</button></div>
      <div class="settings-form">
        <label>项目红灯规则<select><option>任一关键里程碑红灯即项目红灯</option><option>两个及以上延期里程碑才红灯</option></select></label>
        <label>项目黄灯规则<select><option>任一关键里程碑黄灯即项目黄灯</option><option>仅下一个里程碑黄灯才黄灯</option></select></label>
        <label>手动覆盖优先级<select><option>PMO 手动覆盖优先于系统计算</option><option>系统计算优先</option></select></label>
        <label>延期阈值 天<input type="number" value="7" min="1" /></label>
      </div>
    </section>
    <section class="panel settings-panel">
      <div class="settings-head"><h2>资源负荷阈值</h2><span class="muted">R2 workload</span></div>
      <div class="settings-form">
        <label>低负载上限<input type="number" value="0.6" step="0.1" /></label>
        <label>中负载上限<input type="number" value="1.2" step="0.1" /></label>
        <label>Bus Factor 风险线<input type="number" value="1" min="1" /></label>
        <label>Bus Factor 目标值<input type="number" value="3" min="1" /></label>
      </div>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>里程碑模板</h2><button class="ghost-button" data-action="add-milestone-template">新增节点</button></div>
      <div class="template-list">${milestoneNames.map((name, index) => `<div class="template-row"><span>${index + 1}</span><input value="${name}" /><select><option>关键节点</option><option>普通节点</option></select><button class="small-button">启用</button></div>`).join("")}</div>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>上传模板字段</h2><span class="muted">用于模板下载和导入校验</span></div>
      <div class="settings-form two-col">
        <label>项目模板必填字段<textarea rows="3">项目编号、项目名称、健康度、复杂度、项目状态、当前PM</textarea></label>
        <label>资源模板必填字段<textarea rows="3">系统、项目、项目复杂度、项目状态、角色、人员、工时投入占比</textarea></label>
      </div>
    </section>
  </div>`;
}

function openProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  const projectMilestones = milestones.filter((item) => item.projectId === projectId);
  $("#drawer").innerHTML = `<div class="drawer-header">
    <div><p class="eyebrow">${project.id} · ${project.family || "Project"}</p><h2>${project.name}</h2></div>
    <button class="ghost-button" data-close-drawer>关闭</button>
  </div>
  <div class="detail-grid">
    ${detail("业务部门", project.biz)}
    ${detail("当前 PM", project.pm)}
    ${detail("产品经理", project.product)}
    ${detail("技术负责人", project.tech)}
    ${detail("当前阶段", project.status)}
    ${detail("复杂度", project.complexity)}
    ${detail("系统健康", badge(project.health))}
    ${detail("展示健康", badge(effectiveHealth(project)))}
  </div>
  <div class="grid two" style="margin-top:16px">
    <section class="panel"><h2>里程碑明细</h2><div class="table-wrap"><table><thead><tr><th>里程碑</th><th>计划开始</th><th>计划结束</th><th>实际开始</th><th>实际结束</th><th>偏差</th><th>状态</th><th>备注</th></tr></thead><tbody>${projectMilestones.map((m) => `<tr><td>${m.name}</td><td>${m.plannedStart}</td><td>${m.plannedEnd}</td><td>${m.actualStart || "-"}</td><td>${m.actualEnd || "-"}</td><td>${m.delay} 天</td><td>${badge(m.state)}</td><td>${m.note}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="panel"><h2>PMO 手动覆盖</h2><label>健康度<select><option>红灯</option><option selected>黄灯</option><option>绿灯</option></select></label><label style="margin-top:10px">覆盖原因<textarea rows="5">${project.overrideNote || "说明 PMO 判断依据，保存后覆盖系统计算状态。"}</textarea></label><div class="actions" style="margin-top:12px"><button class="primary-button" data-action="save-override">保存覆盖</button></div><div class="panel" style="margin-top:16px;background:var(--surface-2);box-shadow:none"><h3>历史记录</h3><p class="muted">${project.override ? `PMO Admin 于 2026-06-06 标记为 ${healthLabel(project.override)}。` : "暂无手动覆盖记录。"}</p><p class="muted">数据来源：${project.batch}</p></div></section>
  </div>`;
  $("#drawer-backdrop").hidden = false;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

function detail(label, value) {
  return `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`;
}

function openPerson(personName) {
  const items = allocations.filter((allocation) => allocation.person === personName).map((allocation) => {
    const project = projects.find((item) => item.id === allocation.projectId) || {
      id: allocation.projectId,
      name: allocation.projectName || allocation.projectId,
      status: allocation.status,
      complexity: allocation.complexity,
      health: allocation.status === "项目暂停" ? "R" : allocation.status === "UAT" ? "Y" : "G",
    };
    return { ...allocation, project, load: loadFor(allocation) };
  });
  if (!items.length) return;
  const totalLoad = items.reduce((sum, item) => sum + item.load, 0);
  const totalRatio = items.reduce((sum, item) => sum + item.timeRatio, 0);
  const primary = items[0];
  $("#drawer").innerHTML = `<div class="drawer-header">
    <div><p class="eyebrow">Resource Detail</p><h2>${personName}</h2></div>
    <button class="ghost-button" data-close-drawer>关闭</button>
  </div>
  <div class="detail-grid">
    ${detail("主要角色", primary.role)}
    ${detail("部门组织", primary.dept)}
    ${detail("来源", primary.outsourced ? "外包" : "内部")}
    ${detail("参与项目", items.length)}
    ${detail("总投入比例", `${Math.round(totalRatio * 100)}%`)}
    ${detail("计算负荷", totalLoad.toFixed(2))}
    ${detail("负荷等级", badge(totalLoad >= 1.2 ? "R" : totalLoad >= 0.6 ? "Y" : "G"))}
    ${detail("算法", "R2 workload")}
  </div>
  <section class="panel" style="margin-top:16px">
    <h2>项目负荷贡献拆解</h2>
    <div class="table-wrap"><table>
      <thead><tr><th>项目</th><th>阶段</th><th>复杂度</th><th>角色</th><th>投入比例</th><th>负荷贡献</th><th>项目健康</th></tr></thead>
      <tbody>${items.map((item) => `<tr><td><strong>${item.project.name}</strong></td><td>${item.project.status}</td><td>${item.project.complexity}</td><td>${item.role}</td><td>${Math.round(item.timeRatio * 100)}%</td><td>${item.load.toFixed(2)}</td><td>${badge(item.project.health)}</td></tr>`).join("")}</tbody>
    </table></div>
  </section>`;
  $("#drawer-backdrop").hidden = false;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#drawer-backdrop").hidden = true;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  window.setTimeout(() => {
    element.hidden = true;
  }, 2200);
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    state.route = routeButton.dataset.route;
    window.location.hash = state.route;
    render();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "health-filter") {
    state.filters.health = action.dataset.value;
    $("#filter-health").value = action.dataset.value;
    state.route = "projects";
    window.location.hash = state.route;
    render();
    return;
  }
  if (action?.dataset.action === "mock-upload") {
    toast("已模拟解析 Excel：发现 8 行需要修正。");
    return;
  }
  if (action?.dataset.action === "mock-project-upload") {
    toast("已模拟解析项目 Excel：Project 与 Milestone Sheet 均可导入。");
    return;
  }
  if (action?.dataset.action === "mock-resource-upload") {
    toast(`已模拟解析资源 Excel：${allocations.length} 条 R2 资源记录可导入。`);
    return;
  }
  if (action?.dataset.action === "download-resource-template") {
    downloadResourceTemplate();
    return;
  }
  if (action?.dataset.action === "export-workload-csv") {
    exportWorkloadCsv();
    return;
  }
  if (action?.dataset.action === "export-bf-projects") {
    exportBusFactorProjects();
    return;
  }
  if (action?.dataset.action === "export-bf-people") {
    exportBusFactorPeople();
    return;
  }
  if (action?.dataset.action === "download-project-template") {
    downloadProjectTemplate();
    return;
  }
  if (action?.dataset.action === "save-settings") {
    toast("设置已保存。");
    return;
  }
  if (action?.dataset.action === "add-milestone-template") {
    toast("已新增里程碑节点草稿。");
    return;
  }
  if (action?.dataset.action === "save-override") {
    toast("已保存 PMO 手动健康度覆盖。");
    return;
  }
  const projectButton = event.target.closest("[data-open-project]");
  if (projectButton) {
    openProject(projectButton.dataset.openProject);
    return;
  }
  const personButton = event.target.closest("[data-open-person]");
  if (personButton) {
    openPerson(personButton.dataset.openPerson);
    return;
  }
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
    const rows = filteredProjects().filter((project) => [project.id, project.name, project.pm, project.product, project.tech].join(" ").toLowerCase().includes(term));
    $("#project-timeline-wrap").innerHTML = timeline(rows);
  }
  if (event.target.id === "people-search") {
    const term = event.target.value.trim().toLowerCase();
    const rows = personStats().filter((person) => [person.person, person.role, person.dept].join(" ").toLowerCase().includes(term));
    $("#people-grid").innerHTML = rows.map((person) => peopleCard(person)).join("");
  }
});

document.addEventListener("change", (event) => {
  const resourceFilter = event.target.closest("[data-resource-filter]");
  if (resourceFilter) {
    state.resourceFilters[resourceFilter.dataset.resourceFilter] = resourceFilter.value;
    render();
  }
});

$("#reset-filters").addEventListener("click", () => {
  state.filters = { period: "all", dept: "all", biz: "all", status: "all", health: "all", pm: "all" };
  state.resourceFilters = { system: "all", role: "all", outsource: "all" };
  initFilters();
  render();
});

initFilters();
render();
