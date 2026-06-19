# Data Sequences — Resource Module

Canonical data structure and **资源统计分析方法 (resource statistics / analysis method)** for the
PMO Orchestrator resource view. The method is a faithful port of the **R2-Workforce Dashboard**
prototype at [`design/R2-Workforce-Dashboard-offline-V14/`](../design/R2-Workforce-Dashboard-offline-V14/overview.md).

> Verified against the prototype bundle (`design/R2-Workforce-Dashboard-offline-V14/assets/app.js`)
> on 2026-06-19. Formula, thresholds, status weights, and 12 role-weight rows now match the bundle.

---

## 1. Allocation record

One row per (person × project × role) assignment. Defined in `src/data/mock-data.js` → `allocations[]`,
served at runtime via `src/core/data-store.js`.

| Field | Type | Notes | R2 `cn` equivalent |
|---|---|---|---|
| `id` | string | PMO-added stable key (e.g. `R2-001`) | _(none)_ |
| `cat` | string | Category, e.g. `临床` | `cat` |
| `dept` | string | Department / org, e.g. `临床研究组织（CRO）` | `deptOrg` |
| `biz` | string | Business department | `bizDept` |
| `system` | string \| null | Platform / system name | `system` |
| `projectId` | string | Legacy R2 project key, e.g. `PV / SRtracking` | `project` |
| `projectName` | string | Display name | _(derived from `project`)_ |
| `complexity` | number | 1–5 (occasionally higher in prototype data) | `complexity` |
| `status` | string | Project phase (see §3 keys) | `status` |
| `role` | string | Role name (see §2 keys) | `role` |
| `person` | string | Person name | `person` |
| `outsourced` | boolean | `true` = external contractor | `outsourced` |
| `timeRatio` | number | Time-investment ratio 0–1 (0.3 = 30%) | `timeRatio` |

**Field renames from the prototype:** `deptOrg→dept`, `bizDept→biz`, `project→projectId` (+ added
`projectName`), plus an added `id`. All other fields are identical.

---

## 2. Workload formula

```
load = timeRatio × √(complexity / 5) × roleStatusWeight
```

- Prototype: `Na(e) = timeRatio × √(complexity/5) × Zm(role, status)` where `Zm = V_[role]?.[status] ?? 0`.
- PMO: `loadFor(allocation)` in `src/core/utils.js`.

Both read `complexity` and `status` **directly from the allocation record**. The values come from
the Excel upload, not from the milestone-driven `projects[]` table (see §6).

### Load thresholds

| Band | Range | Class |
|---|---|---|
| 🟢 Low (低负荷) | `load < 0.6` | `G` |
| 🟡 Medium (中负荷) | `0.6 ≤ load < 1.2` | `Y` |
| 🔴 High (高负荷) | `load ≥ 1.2` | `R` |

Additionally, a person with **Σ timeRatio > 1.0 (100%)** across projects is flagged **超分配 (over-allocated)**.

---

## 3. Status weights (`statusWeights`)

Verified identical to the prototype bundle.

| Status | Weight |
|---|---|
| 需求调研 | 0.10 |
| 产品设计 | 0.30 |
| 产品开发 | 1.00 |
| 产品自测 | 0.60 |
| UAT | 0.60 |
| 部署上线 | 0.30 |
| 系统运维 | 0.03 |
| 项目暂停 | 0.00 |

`statusWeights` is used as the fallback weight when a role is missing from `roleWeights` (see §6,
deviation D2). The prototype has no such fallback.

---

## 4. Role × status participation weights (`roleWeights`)

`roleWeights[role][status]` → participation weight 0–1. All 12 rows now match the prototype `V_` matrix.

| Role \ Status | 需求调研 | 产品设计 | 产品开发 | 产品自测 | UAT | 部署上线 | 系统运维 |
|---|---|---|---|---|---|---|---|
| 项目经理 | 0.6 | 0.7 | 0.7 | 0.7 | 0.7 | 0.6 | 0.2 |
| 产品经理 | 1.0 | 1.0 | 0.8 | 0.6 | 0.6 | 0.3 | 0.2 |
| 技术负责人 | 0.5 | 0.8 | 0.9 | 0.7 | 0.7 | 0.6 | 0.3 |
| 前端 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| 后端 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| 测试 | 0.1 | 0.2 | 0.6 | 1.0 | 1.0 | 0.4 | 0.1 |
| 运维 | 0.0 | 0.1 | 0.1 | 0.3 | 0.3 | 0.5 | 1.0 |
| Agent开发 | 0.2 | 0.4 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |
| UI/UX | 0.3 | 1.0 | 0.7 | 0.3 | 0.3 | 0.1 | 0.05 |
| 模型 | 0.6 | 0.6 | 0.9 | 0.4 | 0.4 | 0.2 | 0.3 |
| 架构师 | 0.8 | 0.9 | 0.8 | 0.3 | 0.3 | 0.3 | 0.1 |
| 全栈开发工程师 | 0.1 | 0.3 | 1.0 | 0.6 | 0.6 | 0.3 | 0.2 |

> **Reconciled 2026-06-19** — 4 rows were ported with wrong values and have been corrected to the
> bundle: **UI/UX, 模型, 架构师, 全栈开发工程师**. These roles are heavily used in the seed
> (全栈开发工程师 ×50, 模型 ×10, UI/UX ×10, 架构师 ×7), so the fix changes live load numbers.

---

## 5. Derived statistics (`src/core/selectors.js`, `src/views/resource.js`)

| Statistic | Function | Definition |
|---|---|---|
| Person load | `personStats` / `resourcePeopleStats` | Σ `loadFor(allocation)` per person |
| Person ratio | same | Σ `timeRatio` per person; `> 1` ⇒ 超分配 |
| Role coverage | `roleRows` | per-role people/projects/ratio/load + outsourced share |
| System rollup | `systemRows` | per-system projects/people/ratio/load |
| Business groups | `businessProjectGroups` | projects grouped by `biz`, people split by role bucket |
| **Bus Factor** | `busFactorRows` | min # of people (ranked by load desc) whose cumulative load reaches **≥ 50%** of a project's total load. **BF=1** = single point of failure 🔴, **BF=2** 🟡, **BF≥3** healthy 🟢 |
| Key-person risk | `keyPeopleRiskRows` | top contributors of BF≤2 projects, ranked by SPOF count then load |

All of the above are identical in definition to the prototype views (`/`, `/matrix`, `/workload`,
`/roles`, `/busfactor`, `/people`).

---

## 6. Known deviations & recommendations

| ID | Deviation | Status | Recommendation |
|---|---|---|---|
| **D1** | `loadFor` does `projects.find(id === allocation.projectId)` to source status/complexity, but allocation `projectId` (`PV / SRtracking`) never matches PMO `projects[].id` (`P-2401`), so the join is **dead** and values always come from the allocation record (matching the prototype). | Open | Remove the dead join from `src/core/utils.js` `loadFor` (read `status`/`complexity` straight off the allocation). Behaviour-preserving on current data. _Code change — deferred per "document + verify only" scope._ |
| **D2** | Role-weight resolver fallback differs: prototype `Zm = V_[role]?.[status] ?? 0`; PMO `roleWeights[role]?.[status] ?? statusWeights[status] ?? 0.5`. | Open | Never fires on current seed (all allocation roles ∈ the 12-role set). For an unknown imported role the prototype contributes **0** load; PMO fabricates a weight. Align to `?? 0` for fidelity, or keep `0.5` as a deliberate robustness choice — **decide at import-design time**. |
| **D3** | Resource world is standalone: `resourceProjects()` is synthesized from `allocations[]`, disjoint from the milestone/`projects[]` world. `projectResourceSummary()` therefore returns zeros. | By design | Matches the self-contained prototype. Cross-linking Gantt ↔ resource would require an allocation→`P-24xx` ID map (out of scope here). |

---

## 7. Source of truth

- Weights & schema: `src/data/mock-data.js` (`roleWeights`, `statusWeights`, `allocations`).
  These are the **only** definitions; `server/seed.js` imports rows from here on first boot.
- Algorithm: `src/core/utils.js` (`loadFor`, `loadClass`), `src/core/selectors.js`, `src/views/resource.js`.
- Prototype reference: `design/R2-Workforce-Dashboard-offline-V14/overview.md` + `assets/app.js`.
