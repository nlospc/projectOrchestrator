import "./helpers/browser-shim.js";
import test from "node:test";
import assert from "node:assert/strict";
import { workloadSummaryTable, busyRankingRow, horizontalRiskBars, matrixCell } from "../src/views/resource.js";
import { allocations } from "../src/core/data-store.js";
import { state } from "../src/state/app-state.js";

// C2: several render functions interpolate imported (Excel/CSV) data raw
// into HTML/attributes. A person/role name containing '"' or '<' breaks
// markup and, since imports are shared across PMO users via the DB, is a
// stored-XSS vector. This locks in that a malicious name gets escaped.

const EVIL_NAME = '"><img src=x onerror=alert(1)>';

test("workloadSummaryTable escapes person names in both attribute and text content", () => {
  const rows = [{ person: EVIL_NAME, role: "后端", outsourced: false, projects: ["P1"], ratio: 0.5, load: 0.5 }];
  const html = workloadSummaryTable(rows);
  assert.ok(!html.includes(EVIL_NAME), "raw malicious string must not appear unescaped in the output");
  assert.ok(!html.includes("<img src=x"), "must not be able to inject a raw <img> tag via a person name");
});

test("busyRankingRow escapes the person name used in data-open-person", () => {
  const person = { person: EVIL_NAME, load: 1, ratio: 0.5, projects: ["P1"], outsourced: false, role: "后端", dept: "D" };
  const html = busyRankingRow(person, 0, 1);
  assert.ok(!html.includes("<img src=x"));
});

test("horizontalRiskBars escapes the person name", () => {
  const html = horizontalRiskBars([{ person: EVIL_NAME, load: 1, projectCount: 1, singlePoint: 1 }]);
  assert.ok(!html.includes("<img src=x"));
});

test("matrixCell escapes the person name used in data-open-person", () => {
  allocations.length = 0;
  state.resourceFilters = { system: "all", role: "all", outsource: "all", projectFocus: null, biz: "all", family: "all", dept: "all", status: "all", health: "all", peopleSort: "load" };
  allocations.push({ person: EVIL_NAME, projectId: "P1", role: "后端", status: "产品开发", complexity: 3, timeRatio: 0.5, outsourced: false });
  const html = matrixCell(EVIL_NAME, "P1");
  assert.ok(!html.includes("<img src=x"));
});
