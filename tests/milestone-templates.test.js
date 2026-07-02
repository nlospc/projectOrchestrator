import test from "node:test";
import assert from "node:assert/strict";
import {
  MILESTONE_TEMPLATE_TYPES,
  effectiveMilestoneTemplates,
  normalizeMilestoneTemplates,
} from "../src/core/milestone-templates.js";

test("normalizeMilestoneTemplates trims names and drops empty rows", () => {
  // Arrange
  const rows = [
    { name: "  G0 立项  ", type: "关键节点", enabled: true },
    { name: "   ", type: "普通节点", enabled: true },
    { name: "", type: "关键节点", enabled: false },
  ];

  // Act
  const result = normalizeMilestoneTemplates(rows);

  // Assert
  assert.deepEqual(result, [{ name: "G0 立项", type: "关键节点", enabled: true }]);
});

test("normalizeMilestoneTemplates coerces unknown type to default and missing enabled to true", () => {
  // Arrange
  const rows = [
    { name: "G1", type: "不存在的类型" },
    { name: "G2", type: "普通节点", enabled: false },
  ];

  // Act
  const result = normalizeMilestoneTemplates(rows);

  // Assert
  assert.deepEqual(result, [
    { name: "G1", type: MILESTONE_TEMPLATE_TYPES[0], enabled: true },
    { name: "G2", type: "普通节点", enabled: false },
  ]);
});

test("normalizeMilestoneTemplates returns empty array for non-array input", () => {
  assert.deepEqual(normalizeMilestoneTemplates(null), []);
  assert.deepEqual(normalizeMilestoneTemplates(undefined), []);
  assert.deepEqual(normalizeMilestoneTemplates("G0"), []);
});

test("effectiveMilestoneTemplates prefers saved templates over fallback names", () => {
  // Arrange
  const payload = { milestoneTemplates: [{ name: "自定义节点", type: "普通节点", enabled: false }] };

  // Act
  const result = effectiveMilestoneTemplates(payload, ["G0", "G1"]);

  // Assert
  assert.deepEqual(result, [{ name: "自定义节点", type: "普通节点", enabled: false }]);
});

test("effectiveMilestoneTemplates falls back to unique milestone names when nothing saved", () => {
  // Arrange
  const payload = { milestoneTemplates: [] };

  // Act
  const result = effectiveMilestoneTemplates(payload, ["G0", "G1", "G0", ""]);

  // Assert
  assert.deepEqual(result, [
    { name: "G0", type: "关键节点", enabled: true },
    { name: "G1", type: "关键节点", enabled: true },
  ]);
});

test("effectiveMilestoneTemplates handles missing payload", () => {
  assert.deepEqual(effectiveMilestoneTemplates(undefined, []), []);
});
