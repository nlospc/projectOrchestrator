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

test("parseResourceAllocationXlsx pivots the long/flat layout when headers sit on row 0 (no group-label row)", () => {
  // Arrange
  const aoa = [
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

test("parseResourceAllocationXlsx sums 工时投入占比 across duplicate project+person rows and warns", () => {
  // Arrange: same project+person appears 3 times (separate 分配ID rows) with different ratios
  const aoa = [
    [],
    ["项目唯一键", "项目", "角色", "人员", "工时投入占比"],
    ["P001", "示例项目", "Agent开发", "张三", 0.05],
    ["P001", "示例项目", "Agent开发", "张三", 0.1],
    ["P001", "示例项目", "Agent开发", "张三", 0.4],
  ];

  // Act
  const result = parseResourceAllocationXlsx(aoa, personInfo, projects);

  // Assert
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].timeRatio, 0.55);
  assert.ok(result.warnings.some((w) => /出现多条分配记录/.test(w.message)));
});

test("parseResourceAllocationXlsx warns and skips rows missing 项目唯一键 or 人员 instead of silently dropping them", () => {
  // Arrange: one valid row, two rows with a blank 项目唯一键 (broken source link)
  const aoa = [
    [],
    ["项目唯一键", "项目", "角色", "人员", "工时投入占比"],
    ["P001", "示例项目", "开发", "张三", 0.5],
    ["", "未链接项目", "开发", "李四", 0.2],
    ["", "未链接项目", "开发", "王五", 0.3],
  ];

  // Act
  const result = parseResourceAllocationXlsx(aoa, personInfo, projects);

  // Assert
  assert.equal(result.validRows.length, 1);
  assert.ok(result.warnings.some((w) => /2 行缺少项目唯一键或人员/.test(w.message)));
});
