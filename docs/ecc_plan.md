 ---
  Implementation Plan: PMO Orchestrator Platform

  Requirements Restatement

  Build a web-based PMO platform for internal server deployment with four core capabilities:
  1. Excel upload — ingest project and resource allocation data from Excel sheets matching the schema in
  docs/data-sequences.md
  2. Project progress view — milestone timeline showing planned vs. actual dates, R/Y/G status per milestone segment,
  with manual health override per project
  3. Resource view — people × project allocation board/table using the workload formula from the R2 prototype (load =
  timeRatio × √(complexity/5) × roleStatusWeight)
  4. Internal deployment — runs on an internal network server, no cloud dependency

  ---
  Architecture Decisions

  ┌────────────────┬──────────────────────────────────┬──────────────────────────────────────────────────────────┐
  │    Decision    │              Choice              │                        Rationale                         │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Frontend stack │ React + TypeScript + Vite        │ Matches R2 prototype; proven for this domain             │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Router         │ TanStack Router (memory history) │ Consistent with R2 prototype; works offline/internal     │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Charts         │ Recharts                         │ Already embedded in R2; Gantt via custom SVG or recharts │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ UI primitives  │ Radix UI + Tailwind CSS v4+with help with @./.claude/skills/notion-design       │ Direct match with R2                                     │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Excel parsing  │ SheetJS (xlsx)                   │ De-facto standard, no backend needed for parsing         │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Backend        │ Express.js (Node)                │ Minimal server for file persistence and static serving   │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Data storage   │ JSON flat files on disk          │ Simple, no DB install required for internal server       │
  ├────────────────┼──────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Deployment     │ Docker (single container)        │ One-command deploy, portable across internal servers     │
  └────────────────┴──────────────────────────────────┴──────────────────────────────────────────────────────────┘

  Assumption: No authentication required — internal network trust model. Mark this for review if team has security
  requirements.

  ---
  Data Model Design

  Three Excel sheets / data domains

  Sheet 1 — Resource Allocations (matches data-sequences.md resource section)
  interface ResourceAllocation {
    allocationId: string       // 分配ID
    category: string           // 分类
    deptOrg: string            // 部门组织
    bizDept: string            // 业务部门
    system: string             // 系统
    project: string            // 项目
    complexity: number         // 项目复杂度 (1–5)
    projectStatus: string      // 项目状态
    role: string               // 角色
    person: string             // 人员
    outsourced: boolean        // 是否外包
    timeRatio: number          // 工时投入占比 (0–1)
    // computed: loadScore, roleStatusWeight
  }

  Sheet 2 — Projects (matches data-sequences.md project section)
  interface Project {
    id: string                 // 编号
    category: string           // 分类
    deptOrg: string            // 部门组织
    bizDept: string            // 业务部门
    productFamily: string      // 产品族名称
    name: string               // 项目
    health: 'R' | 'Y' | 'G'  // 健康度
    gateStatus: string         // 门禁状态
    complexity: number         // 复杂度
    status: string             // 项目状态
    initiativeStatus: string   // 立项状态
    suggestedLevel: string     // 建议分级
    levelBasis: string         // 分级依据
    suggestedPM: string        // 建议项目经理
    currentPM: string          // 当前PM
    productManager: string     // 产品经理
    techLead: string           // 技术负责人
    healthOverride?: 'R'|'Y'|'G'  // manual override (stored locally, not in Excel)
    healthOverrideNote?: string
	milestone1: string  //里程碑1
	milestone2: string  //里程碑2
	milestone3: string  //里程碑3
	milestone4: string  //里程碑4
  }

  Sheet 3 — Milestones (new design — not in current data-sequences.md)
  interface Milestone {
    milestoneId: string        // unique ID
    projectId: string          // links to Project.id
    name: string               // milestone name
    plannedStart: string       // ISO date
    plannedEnd: string         // ISO date
    actualStart?: string       // ISO date
    actualEnd?: string         // ISO date
    status: 'R' | 'Y' | 'G'  // segment health
    notes?: string
  }

  Assumption: Milestone sheet added to the same Excel workbook as a third tab named "Milestones". If the user has a
  different structure, the parser will need updating.

  ---
  Route Structure

  ┌──────────────────────┬────────────────────────────────────────────────────────────────┐
  │         Path         │                              View                              │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /                    │ Dashboard — health summary, overload alerts, milestone at-risk │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /projects            │ left:Project list with R/Y/G filter, search, health override   │  
  │                      │ right: milestone Gantt + health history road                   │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /resources           │ Resource allocation matrix (person × project)                  │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /resources/workload  │ Per-person workload analysis (reuse R2 formula)                │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /resources/busfactor │ Bus factor risk analysis (reuse R2 formula)                    │
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤
  │ /upload              │ Excel upload + validation preview                              │
  └──────────────────────┴────────────────────────────────────────────────────────────────┘

  ---
  Implementation Phases

  Phase 1 — Project Scaffold & Infrastructure

  - Vite + React + TypeScript project (pnpm create vite)
  - TanStack Router v1 with memory history
  - Tailwind CSS v4 + Radix UI setup
  - Express.js server: serve static build + POST /api/upload + GET/PUT /api/overrides
  - Docker: single container (Node serving built React + Express API)
  - Data directory structure: data/allocations.json, data/projects.json, data/milestones.json, data/overrides.json

  Phase 2 — Excel Upload & Data Layer

  - xlsx (SheetJS) integration for multi-sheet workbook parsing
  - Schema validators for all three sheets (flag missing/invalid rows)
  - Upload UI: drag-and-drop, sheet selection, validation preview table, confirm commit
  - Data store: Zustand (global state, loaded from backend JSON on startup)
  - API endpoints: POST /api/upload (parse + persist), GET /api/data (load all)

  Phase 3 — Project Views

  - Project list page: table with category/status filters, R/Y/G badge, search
  - Health override modal: select R/Y/G, add note, timestamp — persisted to overrides.json
  - Project detail page: milestone Gantt chart (horizontal bar, planned vs actual overlay, color by status)

  Phase 4 — Resource Views

  - Port R2 workload calculation logic (roleStatusWeight matrix, load formula) to TypeScript module
  - Resource matrix: person × project table with load scores, color coding
  - Per-person workload bar chart (Recharts BarChart, reuse R2 structure)
  - Bus factor analysis table/chart

  Phase 5 — Dashboard & Polish

  - Dashboard: summary KPIs (total projects by health, overloaded people count, milestones overdue)
  - Sidebar navigation with active state
  - Responsive layout for 1080p internal displays
  - Dark/light mode toggle (Tailwind v4 class strategy)

  Phase 6 — Deployment Packaging

  - Dockerfile: build stage (pnpm build) + runtime stage (node:alpine + Express)
  - docker-compose.yml: single service, volume mount for data/
  - README.md: internal deployment instructions (docker pull, run, port config)

  ---
  Files to Create

  ┌─────────────────────────────┬──────────────────────────────────────────────────────────────┐
  │            Path             │                           Purpose                            │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/main.tsx                │ React root, router init                                      │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/router.ts               │ TanStack Router config, all routes                           │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/store/dataStore.ts      │ Zustand store (projects, allocations, milestones, overrides) │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/lib/excel.ts            │ SheetJS parse + schema validation                            │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/lib/workload.ts         │ Load formula + roleStatusWeight matrix (ported from R2)      │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/components/layout/      │ Sidebar, TopNav, Layout wrapper                              │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/Dashboard.tsx     │ KPI summary view                                             │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/Projects.tsx      │ Project list                                                 │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/ProjectDetail.tsx │ Milestone Gantt                                              │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/Resources.tsx     │ Allocation matrix                                            │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/Workload.tsx      │ Per-person workload                                          │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/BusFactor.tsx     │ Bus factor analysis                                          │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ src/pages/Upload.tsx        │ Excel upload UI                                              │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ server/index.ts             │ Express server                                               │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ server/routes/upload.ts     │ Upload + persist endpoint                                    │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ server/routes/data.ts       │ Data read/write endpoints                                    │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ server/routes/overrides.ts  │ Health override CRUD                                         │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ Dockerfile                  │ Container build                                              │
  ├─────────────────────────────┼──────────────────────────────────────────────────────────────┤
  │ docker-compose.yml          │ Deployment config                                            │
  └─────────────────────────────┴──────────────────────────────────────────────────────────────┘

  ---
  Risks

  ┌────────────────────────────────────────────┬────────────┬───────────────────────────────────────────────────────┐
  │                    Risk                    │ Likelihood │                      Mitigation                       │
  ├────────────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────┤
  │ Milestone data not in existing Excel files │ Medium     │ Design uploader to accept partial sheets; milestone   │
  │                                            │            │ sheet optional                                        │
  ├────────────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────┤
  │ R2 workload logic hard to extract from     │ Low        │ Recalculate from data-sequences.md formula spec       │
  │ minified bundle                            │            │ (fully documented)                                    │
  ├────────────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────┤
  │ Gantt chart complexity (planned vs actual  │ Medium     │ Use Recharts custom shape or a lightweight Gantt lib  │
  │ overlay)                                   │            │ (frappe-gantt)                                        │
  ├────────────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────┤
  │ Large Excel files slow to parse in browser │ Low        │ Parse server-side in Express upload handler if needed │
  ├────────────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────┤
  │ Internal server lacks Node.js              │ Low        │ Docker packaging resolves this entirely               │
  └────────────────────────────────────────────┴────────────┴───────────────────────────────────────────────────────┘

  ---
  Estimated Complexity: Large

  ┌──────────────────────────────┬──────────┐
  │            Phase             │  Effort  │
  ├──────────────────────────────┼──────────┤
  │ Phase 1 — Scaffold           │ 0.5 day  │
  ├──────────────────────────────┼──────────┤
  │ Phase 2 — Excel + Data Layer │ 1.5 days │
  ├──────────────────────────────┼──────────┤
  │ Phase 3 — Project Views      │ 2 days   │
  ├──────────────────────────────┼──────────┤
  │ Phase 4 — Resource Views     │ 1.5 days │
  ├──────────────────────────────┼──────────┤
  │ Phase 5 — Dashboard + Polish │ 1 day    │
  ├──────────────────────────────┼──────────┤
  │ Phase 6 — Deployment         │ 0.5 day  │
  ├──────────────────────────────┼──────────┤
  │ Total                        │ ~7 days  │
  └──────────────────────────────┴──────────┘

  ---
  Open Questions (non-blockers, assumptions made)

  1. Milestone data source: Assumed as Sheet 3 in the same Excel workbook. If milestones are tracked elsewhere (e.g.,
  separate file, Jira), the upload layer needs adjustment.
  2. Auth: Assumed none required (internal network). Add if needed.
  3. Gantt library: Will use Recharts custom rendering first; if too complex, swap to frappe-gantt (MIT licensed).
  4. Data persistence: JSON files on disk. If concurrent users are expected, upgrade to SQLite.
  5. R2 prototype reuse: The compiled bundle cannot be reused as source. All logic will be reimplemented from
  data-sequences.md spec + overview docs.

  ---
  WAITING FOR CONFIRMATION — Does this plan match your intent? Specific things to confirm or redirect:
  - Milestone data structure (Sheet 3 in same workbook — correct?)
  - Backend language preference (Node/Express assumed — or prefer Python/FastAPI?)
  - Any auth requirement for internal deployment?
  - Docker deployment OK, or prefer a simpler node server.js approach?