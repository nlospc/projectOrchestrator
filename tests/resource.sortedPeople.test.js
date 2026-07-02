import test from "node:test";
import assert from "node:assert/strict";
import { sortedPeople } from "../src/views/resource.js";

// R5: the peopleView sort chips (负荷/工时占比/项目数/姓名) had no handler
// anywhere -- clicking them did nothing, and the people-search input
// handler always re-rendered in personStats()'s raw order regardless of
// the chip shown as "active". sortedPeople() is the pure sort function
// both the initial render and the search handler should share.

function people() {
  return [
    { person: "Bob",   role: "后端", dept: "D", outsourced: false, projects: ["P1"],        ratio: 0.5, load: 0.9 },
    { person: "Alice", role: "前端", dept: "D", outsourced: false, projects: ["P1", "P2"],  ratio: 1.2, load: 0.3 },
    { person: "Cara",  role: "测试", dept: "D", outsourced: true,  projects: ["P1", "P2", "P3"], ratio: 0.8, load: 1.5 },
  ];
}

test("sortedPeople('load') sorts by load descending", () => {
  const rows = sortedPeople(people(), "load");
  assert.deepEqual(rows.map(p => p.person), ["Cara", "Bob", "Alice"]);
});

test("sortedPeople('ratio') sorts by ratio descending", () => {
  const rows = sortedPeople(people(), "ratio");
  assert.deepEqual(rows.map(p => p.person), ["Alice", "Cara", "Bob"]);
});

test("sortedPeople('projects') sorts by project count descending", () => {
  const rows = sortedPeople(people(), "projects");
  assert.deepEqual(rows.map(p => p.person), ["Cara", "Alice", "Bob"]);
});

test("sortedPeople('name') sorts alphabetically (zh-aware localeCompare)", () => {
  const rows = sortedPeople(people(), "name");
  assert.deepEqual(rows.map(p => p.person), ["Alice", "Bob", "Cara"]);
});

test("sortedPeople does not mutate the input array", () => {
  const input = people();
  const originalOrder = input.map(p => p.person);
  sortedPeople(input, "name");
  assert.deepEqual(input.map(p => p.person), originalOrder, "sortedPeople must not mutate its input");
});
