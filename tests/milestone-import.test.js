import test from "node:test";
import assert from "node:assert/strict";
import { parseMilestoneXlsx } from "../src/core/importers.js";

const projects = [{ id: "P001" }, { id: "P006" }];

const HEADER_ROW = [
  "项目ID", "项目名称", "产品族", "产品经理", "建议分级", "立项状态", "当前阶段（G0~G6）",
  "G0计划开始", "G0计划结束", "G0实际开始", "G0实际结束", "G0状态", "G0备注",
  "G1计划开始", "G1计划结束", "G1实际开始", "G1实际结束", "G1状态", "G1备注",
];

function makeAoa(dataRows) {
  return [[], HEADER_ROW, ...dataRows];
}

test("parseMilestoneXlsx converts 中文日期 (xxxx年x月x日) to SQL YYYY-MM-DD format", () => {
  // Arrange
  const aoa = makeAoa([
    ["P006", "数据对比 v1.0", "", "", "", "", "",
      "2025年6月1日", "2025年6月30日", "2025年6月1日", "2025年7月2日", "已完成", "备注A",
      "", "", "", "", "", ""],
  ]);

  // Act
  const result = parseMilestoneXlsx(aoa, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  const row = result.validRows[0];
  assert.equal(row.id, "P006-G0");
  assert.equal(row.planned_start_date, "2025-06-01");
  assert.equal(row.planned_end_date, "2025-06-30");
  assert.equal(row.actual_start_date, "2025-06-01");
  assert.equal(row.actual_end_date, "2025-07-02");
  assert.equal(row.note, "备注A");
  assert.equal(row.delay, 2);
});

test("parseMilestoneXlsx still accepts Excel serial dates and ISO strings", () => {
  // Arrange: 45658 = 2025-01-01
  const aoa = makeAoa([
    ["P001", "示例项目", "", "", "", "", "",
      45658, 45689, "2025-01-05", "", "", "",
      "", "", "", "", "", ""],
  ]);

  // Act
  const result = parseMilestoneXlsx(aoa, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].planned_start_date, "2025-01-01");
  assert.equal(result.validRows[0].planned_end_date, "2025-02-01");
  assert.equal(result.validRows[0].actual_start_date, "2025-01-05");
  assert.equal(result.validRows[0].actual_end_date, null);
});

test("parseMilestoneXlsx errors on 项目ID not present in the project import", () => {
  // Arrange
  const aoa = makeAoa([
    ["P999", "未知项目", "", "", "", "", "",
      "", "2025年6月30日", "", "", "", "",
      "", "", "", "", "", ""],
  ]);

  // Act
  const result = parseMilestoneXlsx(aoa, projects);

  // Assert
  assert.equal(result.validRows.length, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /P999 does not exist/);
});

test("parseMilestoneXlsx warns when a gate has 实际结束/状态 but no 计划结束", () => {
  // Arrange: mirrors P003 G5 in 项目里程碑.xlsx
  const aoa = makeAoa([
    ["P001", "示例项目", "", "", "", "", "",
      "", "", "", "2026年4月20日", "已完成", "",
      "", "", "", "", "", ""],
  ]);

  // Act
  const result = parseMilestoneXlsx(aoa, projects);

  // Assert
  assert.equal(result.validRows.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].field, "G0计划结束");
  assert.match(result.warnings[0].message, /缺少计划结束日期/);
});

test("parseMilestoneXlsx skips blank and 0 gate cells without warnings", () => {
  // Arrange
  const aoa = makeAoa([
    ["P001", "示例项目", "", "", "", "", "",
      "", "0", "", "", "", "",
      "", "2026年1月15日", "", "", "计划中", ""],
  ]);

  // Act
  const result = parseMilestoneXlsx(aoa, projects);

  // Assert
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.validRows.length, 1);
  assert.equal(result.validRows[0].id, "P001-G1");
  assert.equal(result.validRows[0].planned_end_date, "2026-01-15");
});
