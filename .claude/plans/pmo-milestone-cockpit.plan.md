# Plan: PMO Milestone Cockpit (里程碑管理工作台)

**Source PRD**: `docs/PRD_PMO里程碑管理工作台.md` (v1.0, 2026-06-13 修订)
**Selected Milestone**: v1.0 MVP — 甘特主视图 + 4 段算法 + 抽屉编辑 + 状态灯 + 变更留痕 + 评论 + 基础筛选/分组
**Complexity**: Large
**Mode**: Design-first (per `CLAUDE.md`: "design first, implementation later")

> v1.1/v2.0 范围（通知/邮件投递、KPI 卡片条上方、Excel 导入导出、PNG 截图、Saved Views、MTA 趋势图、外部系统同步、移动端只读）**仍**不在本计划内。**唯一例外**：评论 Tab（含 @提及消息体落库）按修订版 PRD §4.2.4 上调至 v1.0；@提及触发的真实邮件/站内推送仍属 v1.1。

---

## What Changed vs. Prior Plan

| # | 变化 | 来源 PRD 段 | 影响范围 |
|---|---|---|---|
| 1 | **里程碑日期从 2 字段 → 4 字段** (`planned_start_date / actual_start_date / planned_end_date / actual_end_date`) | §4.1.3, §5 | 数据模型、段算法、抽屉编辑表单、seed |
| 2 | **段算法引入 5 种场景**（新增 ⑤ 预警·被侵蚀），且 seg_start 计算改用上游 `actual_end_date` 而非旧的 `actual_date` | §4.1.3 两张表 | `src/core/milestones.js` 全量重写 |
| 3 | **三个正交编码通道**：色相（健康）/ 明度（实色 vs ghost 浅色虚框）/ 标记（虚线◇ 计划点 + 实线◆ 实际点） | §4.1.3 通道表 + §6 | CSS（新增 ghost/stripe/anchor 样式）+ 段渲染 |
| 4 | **项目级整体逾期斜纹**：若 max(推算 seg_end) > project.planned_end_date，超出区段叠加红色斜纹底色 | §4.1.2 末段 | `ganttProjectRow()` 渲染 + `projectRag()` |
| 5 | **抽屉新增「当前资源」卡**：产品 x 人 / 项目 x 人 / 开发 x 人 + 「查看详情」跳转资源页（route: `matrix` 或 `workload`，预设跳 `matrix`） | §3, §4.2.1 | `openProject()` body |
| 6 | **抽屉 3 个 Tab**：里程碑 / 变更历史 / **评论**（v1.0 新增，支持 @提及 — 通知体仅落库，不真发邮件） | §3, §4.2.4 | 新增 `commentBox`、`comments[]` |
| 7 | **分组**：按部门 / 按负责人 / 按状态灯 折叠，组头显示该组红灯数量 | §4.3 | 工具栏 + `groupProjects()` 重写 |
| 8 | **左侧冻结列简化**：状态灯 + 项目名称（hover tooltip = 编号 + 简述） + 项目负责人（头像 + 姓名） | §4.1.1 | `projectListRow()` 重写 |
| 9 | **状态徽章新增「工期被侵蚀」** | §4.2.2 | `badge()` 扩枚举 |
| 10 | **段间 2px 深色竖线 + 节点 hover ◆ 高亮 + 段中央显示里程碑名** | §4.1.3 交互说明 | 段渲染 |
| 11 | **段排序规则**：红灯置顶 → 按"最近延期天数"降序（与旧 plan 一致，但 deviation 现在从 4 字段重新算） | §4.1.1 末句 | `projectRag` 的派生输出 |
| 12 | **简述 tooltip**：项目卡片 + 列表 hover 都显示 `project.summary`（新字段） | §3, §4.1.1 | mock-data 加字段 |
| 13 | **当前资源**统计口径：从 `allocations[]` 中按 `project.id ↔ allocation.projectId` 关联（旧 prototype 用 `projectName` 字符串匹配，**不可靠** — 需在数据层显式映射） | §4.2.1 资源卡 | 新增映射 |

---

## Summary

把现有 `src/views/projects.js` 的"每段独立 plannedStart/plannedEnd 矩形"甘特，替换为**基于 4 字段日期 + 滚动推算的连续段模型**：每段起点 = 上一里程碑 `actual_end_date ?? actual_start_date ?? 当前里程碑 planned_start_date`；终点与颜色按 §4.1.3 的 5 场景真值表派生；编码同时承载 **色相（健康）/ 明度（实色 vs 虚框 ghost）/ 标记（◇ 计划点 / ◆ 实际点）** 三条正交通道。右侧 480px 抽屉重写为：项目信息卡 → 当前资源卡 → 垂直时间线编辑器 → 3 Tab（里程碑 / 变更历史 / 评论）。所有 `planned_*` 字段修改强制走「原因必填」模态。算法纯函数化，进 `src/core/milestones.js` 单文件，可独立测试。

---

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| 视图函数 | `src/views/projects.js:74-86` | `xxxView()` 返回 HTML 字符串；`shell.js` 路由分派 |
| 两栏甘特 | `src/views/projects.js:120-136` | `.monitor-board → .project-list-pane + .gantt-pane`；`--month-count` CSS 变量；`positionFor()` 算左/宽百分比 |
| 抽屉挂载 | `src/views/projects.js:214-234` | `$("#drawer").innerHTML = ...` + `#drawer-backdrop` + `.open` class；`data-close-drawer` 关闭 |
| 选择器 | `src/core/selectors.js:5-16` | 纯函数读 `state.filters`，返回过滤后 array |
| 状态徽章 | `src/core/utils.js:30-32` | `badge(value)` 映射 `R/Y/G/gray` → Notion 色 chip |
| 日期工具 | `src/core/utils.js:38-57` | `parseDate / monthStart / monthEnd / addMonths / monthLabel`；**禁止**引入第三方日期库 |
| 路由白名单 | `src/config/routes.js:1-29` | `projectFilterRoutes` 决定哪些 view 显示顶部全局筛选 |
| 资源跳转目标 | `src/views/resource.js` (matrixView/workloadView) | 抽屉「查看详情」按钮调 `goToRoute("matrix")` 并通过 `state.resourceFilters` 预过滤 projectId |
| 事件委托 | `src/ui/shell.js:130-170` | 全局单 `click` listener + `closest("[data-...]")` — 抽屉重渲不会留 listener 泄漏 |
| Mock 数据形状 | `src/data/mock-data.js:27-57` | flat array + `.flatMap` 生成 — **保持** flat，新字段就地扩展，不另起 store |

---

## Architecture Decisions

1. **零后端 v1.0**。所有状态在 `state` + `mock-data.js`。`MilestoneChangeLog`、`Comment`、`Notification` 全部以 JS array 形态落 `mock-data.js`。持久化是 v1.1。
2. **派生字段绝对不落库** — segments、project RAG、deviation_days、erosion 标记每帧 recompute。直接写回 milestone 记录会让"改计划消红灯"绕过审计（PRD §2 警告）。
3. **段算法集中在 `src/core/milestones.js`**（新文件）。**5 场景 truth table = 该模块的唯一职责**。其它模块只能 import `computeSegments()`，不得自己算日期。
4. **抽屉是 route 无关 overlay**。每次任何 mutation 触发 `render()` 后必须重渲抽屉 body（如果打开），保证它跟主视图一起更新；通过 `state.drawer.projectId` 控制。
5. **审计型字段写入唯一入口**：新增 `src/core/mutations.js`，导出 `updateMilestone(id, patch, reason, changedBy)` / `insertMilestone(...)` / `reorderMilestones(...)` / `appendComment(...)`。所有 UI 路径必走此入口；直接 `milestone.planned_end_date = x` 在 review 中视为 bug。
6. **「原因必填」模态强制同步阻塞**。`reason-modal.js` 暴露 `await openReasonModal({field, oldValue, newValue, required: true|false})`，返回 `{reason}` 或 `null`（取消）。`updateMilestone` 检查 required，required + 空 reason 抛错。
7. **三个正交编码通道分别落到 CSS class**：
   - 色相 → `.seg-hue-green / .seg-hue-red / .seg-hue-amber / .seg-hue-gray`
   - 明度 → `.seg-tone-solid / .seg-tone-ghost`（ghost = 浅色填充 + 1px 虚框）
   - 标记 → `.seg-anchor-planned`（◇ 虚线）/ `.seg-anchor-actual`（◆ 实线）作为段两端的绝对定位小元素
   这样 PRD §6 视觉规范升级（比如调整斜纹密度、改 ghost 透明度）只改 CSS。
8. **评论 v1.0 = "落库 + 渲染 + @提及标记"，不发邮件/站内推送**。`@username` 在保存时被解析为 `mentions: ["陈安", ...]` 写入 comment 记录，UI 高亮显示；真实通知 dispatch 留 v1.1（PRD §4.5）。在 plan 中明确这一边界以避免 scope creep。
9. **`state.today` 唯一来源**。删除 `projects.js:115` 的硬编码 `new Date(2026, 5, 6)`，全部读 `state.today`（默认 `new Date()` 但允许测试/演示覆写）。
10. **资源跳转**：抽屉「查看详情」按钮 → `goToRoute("matrix")` 同时设置 `state.resourceFilters.projectFocus = project.id`（新字段）。`matrix.js` 读到后预过滤。这是新增最小耦合，不污染 `resourceFilters` 现有键。

---

## Data Model Extensions

扩展 `src/data/mock-data.js`（**保持单文件**，per `architecture.md` ownership 规则）：

```js
// projects[]
{
  id, code,            // code 如 "PV-01"（§3 hover tooltip 用）
  name, summary,       // summary = 简述（PRD §3 tooltip 字段，新增）
  dept,                // 所属部门
  family,              // 产品族（保留旧字段）
  programGroup,        // 项目集（PRD §3 新增；可空）
  owner: { name, avatar },   // 项目负责人（PRD §4.1.1：头像 + 姓名）
  pm, product, tech,
  planned_start_date,
  planned_end_date,
  archived: false,
  status: "active" | "archived" | "not_started",
}

// milestones[]  —— 4 个日期字段
{
  id, projectId,
  name,
  sortOrder,
  planned_start_date,   // 必填
  planned_end_date,     // 必填
  actual_start_date,    // 可空
  actual_end_date,      // 可空
  createdAt, updatedAt,
}

// NEW: milestoneChangeLogs[]
{
  id, milestoneId,
  field: "planned_start_date" | "planned_end_date" | "actual_start_date" | "actual_end_date" | "name" | "sortOrder",
  oldValue, newValue,
  reason,               // planned_* 修改必填；actual_* / name / sortOrder 选填
  changedBy, changedAt,
}

// NEW: comments[]
{
  id, projectId,
  body,                 // 原始文本，含 @用户名
  mentions: ["陈安"],   // 解析后的提及（保存时计算一次）
  authorId, authorName,
  createdAt,
}
```

**Seed 迁移**：现 seed 用 `M1..M8` + R/Y/G 烘焙状态，要换成"每个里程碑给出 planned_start / planned_end，部分填 actual_start / actual_end"。Seed 须能在 `state.today = 2026-06-13` 下复现 PRD §7 全部 5 个验收用例（含场景⑤ 工期被侵蚀）。

---

## Files to Change

| File | Action | Why |
|---|---|---|
| `src/data/mock-data.js` | UPDATE | 字段重塑（4 日期）+ `summary/owner/programGroup` + `milestoneChangeLogs[]` + `comments[]` + 至少 1 个 archived seed |
| `src/core/milestones.js` | **CREATE** | 5 场景 truth table 的唯一实现：`computeSegments(projectMilestones, project, today)` → `[{milestoneId, segStart, segEnd, hue, tone, plannedAnchorAt, actualAnchorAt, deviationDays, eroded}]` |
| `src/core/mutations.js` | **CREATE** | 唯一写入入口：`updateMilestone / insertMilestone / removeMilestone / reorderMilestones / appendComment`；每个写操作产生 `milestoneChangeLogs` 或 `comments` 条目 |
| `src/core/selectors.js` | UPDATE | 新增 `projectRag(project, today)`、`projectOverflowSegment(project, today)`、`projectResourceSummary(project)`（产品:x / 项目:x / 开发:x 头数）、重写 `dashboardMetrics`（去掉 `M5/M6/M7` 硬编码） |
| `src/core/utils.js` | UPDATE | `formatDeviation(days)`、`todayDate()`（包装 `state.today`）、`badge()` 扩 `eroded` 枚举值 |
| `src/state/app-state.js` | UPDATE | `state.today`、`state.drawer = { projectId, scrollToMilestoneId, activeTab: "milestones"\|"history"\|"comments" }`、`state.filters.groupBy = "dept"\|"owner"\|"rag"\|"none"`、`state.filters.includeArchived = false`、`state.settings = { delayRedThresholdDays: 7, redOverdueDays: 7 }`、`state.resourceFilters.projectFocus = null` |
| `src/views/projects.js` | UPDATE | `timeline()` 与 `ganttProjectRow()` 重写以消费 `computeSegments`；左侧列简化为 状态灯/项目名(tooltip)/Owner；增加 overflow 斜纹层；段间 2px 节点竖线；hover ◆ 高亮；段中央 label；今日线读 `state.today`。`openProject()` 重写为：信息卡 → 资源卡 → Tab bar → 各 Tab 内容 |
| `src/views/projects.js` | UPDATE (cont.) | `groupProjects()` 改 `state.filters.groupBy`；组头显示该组红灯数；分组可折叠 |
| `src/ui/shell.js` | UPDATE | 抽屉事件：tab 切换、`+` 插入、删除（PMO 二次确认 + 有 actual 时拦截）、拖拽排序（沿用 §4.1.4 row 1 校验回滚）、字段编辑触发 reason-modal、评论 submit、@提及解析、`projectFocus` 跳转 |
| `src/ui/reason-modal.js` | **CREATE** | `openReasonModal({field, oldValue, newValue, required})` → Promise<{reason}\|null>；纯 DOM overlay；使用 `.panel` + `#drawer-backdrop` 既有样式 |
| `src/ui/comment-box.js` | **CREATE**（小） | `renderCommentList(comments)` + `renderCommentInput()` + `parseMentions(text, knownPeople)`。无富文本，纯 textarea + 提交 |
| `styles.css` | UPDATE | 段色 token（绿 `#DBEDDB`/`#1C8F5A` 等已存在则复用，否则按 §6 表新增）；`#EB5757` 实色 — 用于场景④ 持续生长红尾；`.seg-tone-ghost` 浅填充 + 1px 虚线边；`.seg-hue-amber` 琥珀斜纹（场景⑤）；`.seg-anchor-planned`（◇ 虚线小元素 absolute） / `.seg-anchor-actual`（◆ 实线小元素 absolute）；项目整行 overflow 红斜纹背景；vertical timeline 节点/连接线样式；reason-modal 样式；comment list 与 mention 高亮 |
| `index.html` | UPDATE (小) | 增加 `#reason-modal` 挂载点；toolbar 增加 `groupBy` select + `includeArchived` 复选框（PRD §4.3 chip 风格） |
| `docs/architecture.md` | UPDATE | 加入 `src/core/milestones.js`、`src/core/mutations.js`、`src/ui/reason-modal.js`、`src/ui/comment-box.js` Owner 行；运行 `node scripts/sync-architecture.mjs` |

无删除。`projects` 原有 `category/family/biz/gate/complexity/level/init/batch/health/override/overrideNote` 字段全部保留 — admin 视图与现有 dashboard 仍读它们。

---

## Segment Algorithm Truth Table (PRD §4.1.3, 重写版)

对项目 P 的有序里程碑 M₁..Mₙ，给定 `today`：

**seg_start (Mᵢ)**:
- i = 1: `M₁.actual_start_date ?? M₁.planned_start_date`
- i > 1: `M_{i-1}.actual_end_date ?? Mᵢ.actual_start_date ?? Mᵢ.planned_start_date`

**seg_end & 编码 (Mᵢ)**：按场景分派

| 场景 | 条件（A = `actual_end_date`，P = `planned_end_date`） | seg_end | 色相 | 明度 | 锚点 | 备注 |
|---|---|---|---|---|---|---|
| ① 按期完成 | A 存在 ∧ A ≤ P | A | 绿 | 实色 | ◇@P + ◆@A | |
| ② 延期完成 | A 存在 ∧ A > P | A | 红 | 实色 | ◇@P + ◆@A | 整段红；可叠加 P→A 深红斜纹强调超期窗口 |
| ③ 未来在轨 | A 缺失 ∧ today ≤ P ∧ seg_start ≤ P | P | 绿 | **ghost (浅色 + 虚框)** | ◇@P | seg_start 之前不渲染 |
| ④ 逾期未填 | A 缺失 ∧ today > P | today | seg_start..P 段灰 ghost；P→today 段 **红实色（`#EB5757`）持续生长** | 混合 | ◇@P（已越过，空心） | 状态徽章 "逾期 Nd"，N = today - P |
| ⑤ 工期被侵蚀 | A 缺失 ∧ seg_start ≥ P | max(seg_start, P) + 最小可视宽度 | **琥珀 (`#FDECC8` + `#CB912F`)** 斜纹 | ghost | ◇@P（起点已越过） | 状态徽章 "工期被侵蚀"；tooltip "上游延期已完全侵蚀本段工期，需重排计划" |

**项目级超期斜纹（PRD §4.1.2 末句）**：若 `max(Mₙ.seg_end) > project.planned_end_date`，超出部分整行底色加 `.row-overflow-stripe`（红色 14px 间距斜纹）。

**边界与异常**（PRD §4.1.4）：
1. 录入 `actual_end_date` 早于上一里程碑 `actual_end_date` → `updateMilestone` 抛错，UI toast 阻断保存。
2. 项目无任何里程碑 → 行内显示 `<span class="muted">未配置里程碑</span>` 占位；状态灯 ⚪。
3. 两个里程碑 `planned_end_date` 相同 → 允许；段宽度按最小可视宽度，且 hover tooltip 提示重叠。
4. `project.archived === true` → 默认隐藏；toolbar 开关 `includeArchived` 后显示，整行 `opacity: .5`。

---

## Tasks

> 依赖箭头：T1 → T2 → T3 → T4 → T5/T6/T7（并行）→ T8 → T9 → T10 → T11 → T12

### Task 1: 算法 spec lock-down（不写代码）
- **Action**: 把上面的 5 场景表 + seg_start 公式 + 边界规则作为 `src/core/milestones.js` 的 JSDoc fixture 草案。挑选 PRD §7 全部 5 个验收用例的具体日期，手算每个里程碑的 `{segStart, segEnd, hue, tone, plannedAnchorAt, actualAnchorAt, deviationDays, eroded}`，逐字段对照 PRD 表格验证。
- **Validate**: 5 个用例全部手算通过 + 与 PRD §7 描述一致 → 进 T2。任何不一致先回到 PRD 找答案，不要靠"看起来对了"放行。

### Task 2: Seed 重塑
- **Action**: 重写 `mock-data.js` 中 `milestones` flat array：每个里程碑给出 planned_start/planned_end，部分填 actual_start/actual_end。Seed 必须在 `state.today = 2026-06-13` 时复现 §7 全部 5 个验收用例。新增 `milestoneChangeLogs[]`（至少 2 条历史项做 demo），`comments[]`（至少 1 条带 @提及），`projects[]` 加 `summary / owner / programGroup`，其中 P-2405 设 `archived: true`。
- **Mirror**: 保持 `flatMap` 风格（`mock-data.js:44-57`），不引入 factory 类。
- **Validate**: 视觉手测留待 T5；这一步只验数据形状（结构、字段非空、id 不重复）。

### Task 3: `src/core/milestones.js`
- **Action**: 实现 `computeSegments(milestones, project, today)`。一切派生量从这一个函数出。函数签名严格固定，便于后续单测。返回数组顺序与 milestones 一致。
- **Mirror**: `selectors.js` 的纯函数形态 — 无 DOM、无 state import。
- **Validate**: 用 T2 seed 逐条对照 T1 手算结果。任何字段不一致 → 阻断后续 task。

### Task 4: `src/core/mutations.js` + `reason-modal.js`
- **Action**: 实现 5 个 mutation：`updateMilestone(id, patch, reason, changedBy)`、`insertMilestone(projectId, afterId, init)`、`removeMilestone(id)`、`reorderMilestones(projectId, newOrder)`、`appendComment(projectId, body, authorId)`。每个修改 `planned_*` 字段且 reason 为空 → 抛错。`actual_end_date` < 上一里程碑 `actual_end_date` → 抛错。`reorderMilestones` 应用前先 dry-run 校验。`appendComment` 内含 `parseMentions(body, knownPeople)`。
- **Mirror**: 暴露 throw-style API；UI 层 catch 后 toast。
- **Validate**: 手测 — 在 console 跑 `updateMilestone("...M1", { planned_end_date: "2026-03-01" }, "", "陈安")` 应抛错；带 reason 应成功并产生 changeLog 条目。

### Task 5: 项目级 RAG + overflow + 资源卡口径（`selectors.js`）
- **Action**: 实现 `projectRag(project, today)`（PRD §4.4 规则；阈值读 `state.settings.delayRedThresholdDays`）；`projectOverflowSegment(project, today)` 返回 overflow 区段（用于斜纹底色）；`projectResourceSummary(project)` 按 role 大类（产品=「产品经理/UI/UX」、项目=「项目经理」、开发=「前端/后端/全栈开发工程师/Agent开发/架构师/模型」）数 head count，**关联键**用 `project.id ↔ allocation.projectId`（不再用 projectName 字符串）。重写 `dashboardMetrics`：`due` = `planned_end_date` 落本月的里程碑数，去掉 `M5/M6/M7` 后缀硬编码（`selectors.js:97` 已知 bug）。
- **Mirror**: 链式 `.filter` 风格不变。
- **Validate**: archived 项目 RAG = `gray`；含场景④ 项目 RAG = `R`；只含场景① 项目 RAG = `G`；含场景⑤ 但无④ 项目 RAG = `Y`。

### Task 6: 甘特主视图重写（`projects.js` → `timeline / ganttProjectRow / projectListRow / groupProjects`）
- **Action**:
  - `timeline`: month axis 从 `min(project.planned_start_date)` 到 `max(project.planned_end_date, max(segment.segEnd))`。今日线读 `state.today`。
  - `ganttProjectRow`: 用 `computeSegments` 的 segments 渲染；每段 = `<div class="gantt-segment seg-hue-X seg-tone-Y">` + 段中央 `<span class="seg-label">` + 段末 ◇/◆ 锚点；段之间渲 2px 深色 `.seg-divider`；overflow 段加 `.row-overflow-stripe`。
  - `projectListRow`: 状态灯 + 项目名（hover title 含 `code` + `summary`） + Owner 头像/姓名。
  - `groupProjects`: 按 `state.filters.groupBy` 切换 `dept / owner / rag / none`；组头显示该组红灯数 + 折叠箭头。
  - 排序：红灯置顶 → 按 max segment deviationDays 降序（项目级 deviation 取最大段 deviation）。
- **Mirror**: 沿用 `.monitor-board` 两栏 + `--month-count` CSS 变量。
- **Validate**: 视觉对照 PRD §7 全部 5 用例；折叠/展开 + groupBy 切换无 console error。

### Task 7: 抽屉重写（`openProject()` + tab 系统）
- **Action**:
  1. Header（项目名 inline-edit、code、close 按钮）
  2. **项目信息卡**：`detail()` 渲 编号 / 部门 / 产品族 / 项目集 / 计划开始 / 计划结束 / Owner / 项目级 RAG + 整体偏差天数（Σ scenario② 实际超期天 + Σ scenario④ 当日逾期天） + 简述 tooltip
  3. **当前资源卡**：`产品：X 人  项目：Y 人  开发：Z 人` + 「查看详情」按钮 → 调 `goToRoute("matrix")` 且 `state.resourceFilters.projectFocus = project.id` 并关闭抽屉
  4. **Tab bar**：里程碑 / 变更历史 / 评论；切换写回 `state.drawer.activeTab` 后重渲 body
  5. Tab "里程碑"：垂直时间线，每节点 = 名称(inline edit) + 4 日期 picker + 「今天完成」快捷 + 状态徽章（按期完成 / 延期 Nd 完成 / 逾期 Nd 未完成 / 未到期 / 工期被侵蚀）；hover 出 `+` 插入；拖拽手柄；删除按钮（PMO 二次确认 + 有 actual 时拦截）
  6. Tab "变更历史"：倒序 `milestoneChangeLogs`，过滤器 by milestone；流水模板 `{时间} {人} 将「{里程碑}」{字段中文} 由 {旧值} 改为 {新值}，原因：{xxx}`
  7. Tab "评论"：`comment-box.js` 列表 + 输入框；保存时调 `appendComment`；@提及在文本里 `<mark>` 高亮；提交后即时刷新 list（v1.0 不真发通知）
- **Mirror**: 抽屉重渲整体替换 `innerHTML`，事件全走 `shell.js` 的全局委托。
- **Validate**: 点击主视图段 → 抽屉打开 + 自动滚到对应里程碑（`state.drawer.scrollToMilestoneId`）；Tab 切换状态保留；评论提交后立刻可见。

### Task 8: 工具栏与筛选
- **Action**: 顶部工具栏加 `groupBy` select + `includeArchived` 复选框 + 时间粒度（周/月/季度）切换（v1.0 只支持月，其余 disabled 并 tooltip "v1.1"）。`filteredProjects()` 接入 `includeArchived`。`state.filters.groupBy` 联动 `groupProjects`。
- **Mirror**: `shell.js:65-76` 全局筛选绑定模式。
- **Validate**: 切换 groupBy 时 KPI 卡片数字稳定（KPIs 基于 filteredProjects，不应受 groupBy 影响）；包含已归档 toggle 切换可见。

### Task 9: 资源页跳转回灌
- **Action**: 在 `src/views/resource.js` 的 `matrixView()` 入口读 `state.resourceFilters.projectFocus`；若非空，预过滤行并高亮项目；用户清除筛选后置回 `null`。
- **Mirror**: 沿用 `resourceFilters` 既有 select/render 模式。
- **Validate**: 从抽屉点「查看详情」→ 路由切到 matrix → 表格只剩该项目相关人员。

### Task 10: 验收检查
- **Action**: 按 PRD §7 五条手测；并跑 Open Questions 解答清单（见下）。任何 fail → 回到对应 task。
- **Validate**: 全 5 条 pass。

### Task 11: 文档同步
- **Action**: 跑 `node scripts/sync-architecture.mjs`，更新 `docs/architecture.md` 加入新模块（`milestones.js / mutations.js / reason-modal.js / comment-box.js`）。在 Ownership 节加一段 "Milestone Cockpit" 描述模块边界与 mutation 入口纪律。
- **Validate**: 二次运行脚本无 diff。

### Task 12: 风险标注与遗留
- **Action**: 在 `milestones.js` JSDoc 顶部留 perf TODO（50+ 项目重渲性能）；在 `mutations.js` 顶部留 audit TODO（要求 PR review checklist 检查无人绕过此入口）；在 `comment-box.js` 留 v1.1 TODO（真实通知调度）。

---

## Validation

```bash
# 静态语法检查（仓库尚无 test runner）
node --check src/core/milestones.js
node --check src/core/mutations.js
node --check src/core/selectors.js
node --check src/views/projects.js
node --check src/ui/shell.js
node --check src/ui/reason-modal.js
node --check src/ui/comment-box.js

# 架构图同步
node scripts/sync-architecture.mjs

# 手测
python3 -m http.server 8000
# 浏览器走 PRD §7 五个 acceptance 用例 + 抽屉三 Tab + groupBy 切换 + archived 切换 + 资源跳转
```

> 单元测试（建议 `node --test` 内置 runner，无新依赖）写 `milestones.js` 的 truth table fixture — 强烈推荐补；如确认本阶段不补，加 `tests/TODO.md` 记录欠债。

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| 段算法 off-by-one / 优先级反转（场景④ vs ⑤ 的判定顺序） | **High** | T1 强制手算 5 用例 + JSDoc fixture；T3 写代码时**先**列 truth table，再写分派逻辑 |
| 4 字段日期下 seg_start 公式比旧版复杂，"`actual_end_date` 缺失但 `actual_start_date` 存在"边界容易遗漏 | **High** | 公式显式写为 `M_{i-1}.actual_end_date ?? Mᵢ.actual_start_date ?? Mᵢ.planned_start_date`；T1 拿一个里程碑只填 actual_start 的 case 验证 |
| 审计绕过：直接 `milestone.planned_end_date = x` 跳过 reason-modal | **High** | 所有写都过 `mutations.js`；review checklist 加 grep 项："禁止 `mock-data.js` 之外文件出现 `milestone.planned_` 或 `milestone.actual_` 后接 `=`" |
| 抽屉 4 Tab + 拖拽 + inline edit + 模态叠加 — 事件 listener 泄漏 | **Medium** | 抽屉始终全量 `innerHTML` 重渲；只在 `shell.js` 全局委托上挂；模态用同一 `#reason-modal` mount 点复用 |
| `state.today` 既要支持 demo 覆写又要默认 now() | **Low** | `state.today` 初始化为 `new Date()`，提供 URL `?today=2026-06-13` 解析（无新依赖）便于 demo |
| 评论 @提及解析需匹配中文姓名（"@陈安"） | **Medium** | `parseMentions` 用 `[一-龥A-Za-z]{1,12}` + 已知人员名单做后置过滤；不识别空格分隔的姓 + 名 |
| 项目级 overflow 斜纹 + 段内 ② 深红斜纹 视觉重叠 | **Low** | 行底色用 `repeating-linear-gradient` 14px 间隔，段内 ② 用 7px 间隔 + 不同角度 — 不同层不打架 |
| `projectResourceSummary` 按 `project.id ↔ allocation.projectId` 关联 — 现 allocations seed 用的是 `"PV / SRtracking"` 这类字符串，**实际无 project.id 形态的键** | **High（数据契约破裂）** | seed 阶段（T2）补一列 `allocation.canonicalProjectId` 指回 `projects[]` 的 id；或在 selectors 做查找映射并记录无法映射的 allocation 计数（fall-back 0，UI 显示 "—"） |
| 资源页跳转回灌污染 `resourceFilters` 状态（用户后续点其它筛选时残留 projectFocus） | **Medium** | matrix.js 在每次 user 主动改 filter 时清除 `projectFocus`；抽屉「查看详情」必带 close drawer |
| PRD §4.5 通知矩阵被误读为 v1.0 范围 | **Medium** | plan 顶部 "唯一例外" 段落明确：v1.0 仅做评论体落库 + @解析，不发邮件不投通知；PR 描述里再次声明 |
| `selectors.js` 旧的 `M5/M6/M7` 硬编码（`selectors.js:97`）在新模型下毫无意义 | **High（latent）** | T5 显式删除并替换为 `planned_end_date` 落本月统计 |

---

## Open Questions（写代码前回收）

1. **拖拽重排校验时机**：拖到非法位置时 — 阻止 drop（拖回原位）还是允许 drop 后弹错误 toast 让用户撤销？建议前者，UX 一致性高。
2. **`changedBy / authorId` 在无后端时如何赋值**：建议 `state.currentUser = { id: "u-pmo", name: "PMO Admin" }`，v1.1 接入真实 auth 时只改这一处。
3. **抽屉「查看详情」按钮目标路由**：`matrix`（人员 × 项目矩阵）还是 `workload`（人员负载）？建议 `matrix` — 更直接对应"哪些人在这个项目上"。
4. **评论 @提及候选名单**：从 `projects[].pm/product/tech/owner` + `allocations[].person` 取并集？建议是。是否限定只能 @当前项目相关人？建议 **不** 限定（PMO 可 @外部 stakeholder），但本项目相关人在 autocomplete 中置顶。
5. **「未到期」状态徽章颜色**：场景③ 既然段是绿 ghost，徽章用绿还是灰？建议灰（避免与"按期完成"混淆）。
6. **项目级偏差天数**汇总公式：累加 scenario② 完成偏差 + scenario④ 当前未完成偏差 之和？建议是，文案 "累计偏差 N 天"。

---

## Acceptance

- [ ] PRD §7 全部 5 个验收用例在浏览器手测可复现（含新增的"工期被侵蚀"场景）
- [ ] 任何 `planned_*` 字段修改没有 reason → UI 阻断 + 无 changeLog 写入
- [ ] 任何里程碑 mutation 都走 `mutations.js`（grep 校验通过）
- [ ] 派生量（segments / RAG / deviation）零落库（grep 校验：milestone 记录上不存在 `state / delay / hue / tone` 字段）
- [ ] 抽屉 3 Tab（里程碑 / 变更历史 / 评论）切换无 console 报错；评论支持 @提及且高亮渲染
- [ ] 抽屉「当前资源」卡数据由 `projectResourceSummary(project)` 提供，并能跳转 matrix 预过滤
- [ ] toolbar `groupBy / includeArchived` 切换正确，archived 默认隐藏，组头红灯数显示正确
- [ ] 项目整体推算结束超过计划结束 → 行尾红斜纹底色出现
- [ ] `docs/architecture.md` 已重新生成且二次运行无 diff
- [ ] `package.json` 无新 runtime 依赖（vanilla-JS 约束）
- [ ] v1.1/v2.0 范围（真实通知投递 / KPI 卡片条 / PNG & Excel 导出 / Saved Views / MTA / 移动端 / 外部同步）未被本计划提前实现

---

**WAITING FOR CONFIRMATION** — 回复 `yes` / `proceed` 开始 Task 1（spec lock-down，不写代码），或 `modify: ...` 调整方向。强烈建议**先**回答 Open Questions 1–6；它们影响 T4/T7/T9 的 UX 与契约，事后改成本高。
