import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mockDataPath = path.join(repoRoot, "src/data/mock-data.js");
const prototypePath = path.join(
  repoRoot,
  "design/R2-Workforce-Dashboard-offline-V14/assets/app.js",
);
const databasePath = path.join(repoRoot, "data/pmo.sqlite");

const allocationPrefix = "export const allocations = ";
const normalizePrefix = "export function normalizeR2Records";
const normalizeCall = "\nnormalizeR2Records();";
const expectedR2Count = 212;

const mockSource = fs.readFileSync(mockDataPath, "utf8");
const prototypeSource = fs.readFileSync(prototypePath, "utf8");

const arrayStart = mockSource.indexOf(allocationPrefix);
const normalizeStart = mockSource.indexOf(normalizePrefix, arrayStart);
if (arrayStart < 0 || normalizeStart < 0) {
  throw new Error("Could not locate the allocations array boundaries in mock-data.js");
}

const jsonStart = arrayStart + allocationPrefix.length;
const arraySeparator = "\n\n";
const jsonEnd = normalizeStart - arraySeparator.length;
const arraySource = mockSource.slice(jsonStart, jsonEnd).trimEnd();
if (!arraySource.endsWith(";")) {
  throw new Error("The allocations array does not end with a semicolon");
}
const allocations = JSON.parse(arraySource.slice(0, -1));

const r2Pattern = /{cat:"([^"]*)",deptOrg:"([^"]*)",bizDept:"([^"]*)",system:"([^"]*)",project:"([^"]*)",complexity:(\d+),status:"([^"]*)",role:"([^"]*)",person:"([^"]*)",outsourced:(!0|!1),timeRatio:([\d.]+)}/g;
const r2Records = [...prototypeSource.matchAll(r2Pattern)].map((match) => ({
  cat: match[1],
  dept: match[2],
  biz: match[3],
  system: match[4],
  projectName: match[5],
  complexity: Number(match[6]),
  status: match[7],
  role: match[8],
  person: match[9],
  outsourced: match[10] === "!0",
  timeRatio: Number(match[11]),
}));

if (r2Records.length !== expectedR2Count) {
  throw new Error(`Expected ${expectedR2Count} R2 records, found ${r2Records.length}`);
}

const keyFor = ({ person, role, complexity, timeRatio }) =>
  JSON.stringify([person, role, complexity, timeRatio]);

const r2ByKey = new Map();
for (const record of r2Records) {
  const key = keyFor(record);
  const queue = r2ByKey.get(key) ?? [];
  queue.push(record);
  r2ByKey.set(key, queue);
}

const unmatched = [];
let matchedCount = 0;
for (const allocation of allocations) {
  const matches = r2ByKey.get(keyFor(allocation));
  const r2Record = matches?.shift();
  if (!r2Record) {
    unmatched.push(allocation);
    continue;
  }

  allocation.cat = r2Record.cat;
  allocation.dept = r2Record.dept;
  allocation.biz = r2Record.biz;
  allocation.system = r2Record.system;
  allocation.projectName = r2Record.projectName;
  allocation.projectId = `${r2Record.system} / ${r2Record.projectName}`;
  allocation.status = r2Record.status;
  allocation.role = r2Record.role;
  matchedCount += 1;
}

if (matchedCount !== expectedR2Count) {
  throw new Error(`Expected ${expectedR2Count} matches, found ${matchedCount}`);
}

const normalizeCallStart = mockSource.indexOf(normalizeCall, normalizeStart);
if (normalizeCallStart < 0) {
  throw new Error("Could not locate the normalizeR2Records() call");
}
const normalizeSource = mockSource
  .slice(normalizeStart, normalizeCallStart)
  .replace("export function normalizeR2Records", "function normalizeR2Records");

// Reuse the fixture's exact and fragment maps so this script cannot drift from them.
Function(
  "allocations",
  `"use strict";\n${normalizeSource}\nnormalizeR2Records();`,
)(unmatched);

const fixedArray = `${JSON.stringify(allocations, null, 2)};`;
const fixedSource =
  mockSource.slice(0, jsonStart) + fixedArray + mockSource.slice(jsonEnd);
fs.writeFileSync(mockDataPath, fixedSource, "utf8");

const databaseDeleted = fs.existsSync(databasePath);
fs.rmSync(databasePath, { force: true });

console.log(
  `Fixed ${matchedCount} R2 records and normalized ${unmatched.length} unmatched records.`,
);
console.log(
  databaseDeleted ? "Deleted data/pmo.sqlite." : "data/pmo.sqlite was already absent.",
);
