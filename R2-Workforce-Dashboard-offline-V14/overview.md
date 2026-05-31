this package contains a single compiled deliverable under `R2-Workforce-Dashboard-offline-V14/`:

- `index.html` — shell mounting `<div id="root">`
- `assets/app.js` — ~950 KB minified bundle containing all React components, routing, charts, UI primitives, and **hardcoded workforce data**
- `assets/style.css` — compiled Tailwind v4 output

There is **no source code, no package.json, and no build tooling** in this repository. The bundle was built externally (React + Vite inferred from bundle shape) and committed as a compiled artifact.
## Tech Stack (inside the bundle)

- **React** with `ReactDOM.createRoot`
- **TanStack Router** with `createMemoryHistory` (no URL changes on navigation)
- **Recharts** for charts (PieChart, BarChart, etc.)
- **Radix UI** for accessible primitives (Dialog, Select, Tooltip, etc.)
- **Tailwind CSS v4** utility classes


## Route Structure

| Path | View |
|---|---|
| `/` | Overview / summary dashboard |
| `/matrix` | Person × project assignment matrix |
| `/workload` | Per-person workload analysis |
| `/roles` | Role coverage across projects |
| `/busfactor` | Bus Factor risk analysis |
| `/people` | People directory |
| `/people/$name` | Individual person profile |

## Data Schema

All workforce data lives in the `cn` array hardcoded inside `app.js`. Each record:

```js
{
  cat:        string,   // category, e.g. "临床"
  deptOrg:    string,   // department/org, e.g. "临床研究组织(CRO)"
  bizDept:    string,   // business department
  system:     string,   // platform/system name
  project:    string,   // project name
  complexity: number,   // 1–5 integer
  status:     string,   // project phase, e.g. "部署上线", "产品开发"
  role:       string,   // role name, e.g. "项目经理", "Agent开发"
  person:     string,   // person name
  outsourced: boolean,  // true = external contractor
  timeRatio:  number,   // time investment ratio 0–1 (e.g. 0.3 = 30%)
}
```

To update data, edit the `cn` array in the minified `app.js`. Search for `outsourced:!0` or `outsourced:!1` to locate the data block.

## Key Calculations

**Workload formula** (`Na` function):
```
load = timeRatio × √(complexity / 5) × roleStatusWeight
```
`roleStatusWeight` is a lookup matrix (`V_[role][status]`) where different roles carry different weights at different project phases.

Load thresholds: 🟢 < 0.6 (low) · 🟡 0.6–1.2 (medium) · 🔴 ≥ 1.2 (high)

**Bus Factor (BF)**: minimum number of people (ranked by workload contribution, highest first) needed to account for ≥50% of a project's total load. BF=1 = single point of failure. BF ≥ 3 = healthy.
