import test from "node:test";
import assert from "node:assert/strict";
import { parseResourceAllocationXlsx } from "../src/core/importers.js";

const projects = [{ id: "P001", complexity: 5, status: "产品开发" }];
const personInfo = [{ name: "张三", role: "开发", outsourced: false }];

test("parseResourceAllocationXlsx parses the wide/matrix layout unchanged", () => {
  // Arrange
  const aoa = [
    [],
    ["项目ID", "项目名称", "张三"],
    ["P001", "示例项目", 0.5],
  ];

  // Act
  const result = parseResourceAllocationXlsx(aoa, personInfo, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].projectId, "P001");
  assert.equal(result.validRows[0].person, "张三");
  assert.equal(result.validRows[0].timeRatio, 0.5);
});

test("parseResourceAllocationXlsx pivots the long/flat layout (项目/人员/工时投入占比 per row) into the wide layout", () => {
  // Arrange
  const aoa = [
    [],
    ["项目唯一键", "项目", "角色", "人员", "工时投入占比"],
    ["P001", "示例项目", "开发", "张三", 0.5],
  ];

  // Act
  const result = parseResourceAllocationXlsx(aoa, personInfo, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].projectId, "P001");
  assert.equal(result.validRows[0].person, "张三");
  assert.equal(result.validRows[0].timeRatio, 0.5);
});

test("parseResourceAllocationXlsx throws a clear error when the long/flat layout is missing a required column", () => {
  // Arrange
  const aoa = [
    [],
    ["项目唯一键", "项目", "人员"], // missing 工时投入占比
    ["P001", "示例项目", "张三"],
  ];

  // Act / Assert
  assert.throws(
    () => parseResourceAllocationXlsx(aoa, personInfo, projects),
    /资源分配表缺少必需列：工时投入占比/
  );
});

test("parseResourceAllocationXlsx does not misdetect the wide layout as long/flat", () => {
  // Arrange: wide layout's own headers (项目ID/项目名称) overlap with long-format aliases,
  // but without 人员/工时投入占比 columns it must be treated as wide, not throw.
  const aoa = [
    [],
    ["项目ID", "项目名称", "张三"],
    ["P001", "示例项目", 0.2],
  ];

  // Act
  const result = parseResourceAllocationXlsx(aoa, personInfo, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
});
