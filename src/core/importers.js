import { projects, personInfo } from "./data-store.js";
import { getRoleWeights, getStatusWeights } from "./utils.js";
import { healthValues, milestoneTemplateSchema, overrideTemplateSchema, projectTemplateSchema, projectExtrasKeys, resourceTemplateSchema } from "./template-schemas.js";

const healthAliases = {
  R: "R",
  Y: "Y",
  G: "G",
  red: "R",
  yellow: "Y",
  green: "G",
  "红": "R",
  "黄": "Y",
  "绿": "G",
  "红灯": "R",
  "黄灯": "Y",
  "绿灯": "G",
};

const booleanAliases = {
  true: true,
  false: false,
  "1": true,
  "0": false,
  yes: true,
  no: false,
  y: true,
  n: false,
  "是": true,
  "否": false,
  "外包": true,
  "内部": false,
};

// Convert Chinese date string "2026年7月31日" -> "2026-07-31"
// "2026年8月" (no day) -> "2026-08-01"
function parseCnDate(str) {
  const s = String(str || "").trim();
  const m = s.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
  if (!m) return null;
  const y = m[1];
  const mo = String(m[2]).padStart(2, "0");
  const d = m[3] ? String(m[3]).padStart(2, "0") : "01";
  return `${y}-${mo}-${d}`;
}

// Convert Excel serial date integer -> "YYYY-MM-DD"
// Excel epoch: Dec 30, 1899. For serials > 60, subtract 1 to correct leap-year bug.
function xlSerialToIso(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n <= 0) return null;
  const adj = n > 60 ? n - 1 : n;
  const ms = (adj - 1) * 86400000;
  const d = new Date(Date.UTC(1900, 0, 1) + ms);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function parseCsv(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(source);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((value) => String(value).trim() !== ""));
}

function detectDelimiter(source) {
  const firstLine = String(source || "").split(/\r?\n/, 1)[0] || "";
  const candidates = [",", "\t", ";"];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length - 1 }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

export function mapHeaders(headers, schema) {
  const schemaByName = new Map();
  schema.forEach((field) => {
    [field.key, field.targetKey, field.label].filter(Boolean).forEach((name) => {
      schemaByName.set(normalizeHeader(name), field);
    });
  });

  const fields = headers.map((header) => schemaByName.get(normalizeHeader(header)) || null);
  const missingRequired = schema.filter((field) => field.required && !fields.includes(field));
  const unknownHeaders = headers.filter((header, index) => !fields[index] && String(header).trim());
  return { fields, missingRequired, unknownHeaders };
}

export function validateRows(rows, schema, options = {}) {
  const errors = [];
  const warnings = [];
  const validRows = [];
  const knownProjects = new Set((options.projects || projects).map((project) => project.id || project.projectId));

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const normalized = {};
    let hasError = false;

    schema.forEach((field) => {
      const rawValue = row[field.key] ?? "";
      if (field.required && isBlank(rawValue)) {
        errors.push({ row: rowNumber, field: field.key, message: `${field.label} is required` });
        hasError = true;
        return;
      }
      const result = normalizeValue(rawValue, field);
      if (result.error) {
        errors.push({ row: rowNumber, field: field.key, message: result.error });
        hasError = true;
      }
      if (result.warning) warnings.push({ row: rowNumber, field: field.key, message: result.warning });
      normalized[field.targetKey || field.key] = result.value;
    });

    if (normalized.complexity !== undefined && normalized.complexity !== "" && (normalized.complexity < 1 || normalized.complexity > 10)) {
      warnings.push({ row: rowNumber, field: "complexity", message: "Complexity is outside the recommended 1-10 range" });
    }
    if (normalized.timeRatio !== undefined && normalized.timeRatio > 1) {
      warnings.push({ row: rowNumber, field: "timeRatio", message: "Time ratio is greater than 100%; resource views will mark this as overallocated" });
    }
    if (options.requireProjectMatch && normalized.projectId && !knownProjects.has(normalized.projectId)) {
      errors.push({ row: rowNumber, field: "projectId", message: `Project ${normalized.projectId} does not exist in the project import` });
      hasError = true;
    }
    if (options.warnUnknownHealth && normalized.health && !healthValues.includes(normalized.health)) {
      warnings.push({ row: rowNumber, field: "health", message: "Unknown health value" });
    }

    if (!hasError) validRows.push(normalized);
  });

  return { validRows, errors, warnings };
}

export function parseProjectCsv(text) {
  return parseTypedCsv(text, projectTemplateSchema, (rows, warnings) =>
    rows.map((row, index) => {
      const defaults = { health: "G", complexity: 5, status: "未设置", pm: "未指定" };
      const normalized = { ...row, override: row.override || "" };
      for (const [field, value] of Object.entries(defaults)) {
        if (isBlank(normalized[field])) {
          normalized[field] = value;
          warnings.push({ row: index + 2, field, message: `${field} is blank; defaults to ${value}` });
        }
      }
      // Normalize multi-line people cells (newline-joined -> comma-joined)
      for (const field of ["product", "tech", "pm"]) {
        if (normalized[field]) {
          normalized[field] = String(normalized[field]).replace(/\r?\n/g, ", ").trim();
        }
      }
      // Pack extras fields into a sub-object; remove them from the top-level row
      const extras = {};
      for (const key of (projectExtrasKeys || [])) {
        if (normalized[key] !== undefined && normalized[key] !== "") {
          extras[key] = normalized[key];
        }
        delete normalized[key];
      }
      normalized.extras = Object.keys(extras).length ? extras : null;
      return normalized;
    })
  );
}

export function parseMilestoneCsv(text, projectRows = projects) {
  return parseTypedCsv(text, milestoneTemplateSchema, (rows) => rows.map((row) => ({ ...row, delay: delayDays(row.planned_end_date, row.actual_end_date), note: row.note || "" })), {
    projects: projectRows,
    requireProjectMatch: true,
  });
}

export function parseMilestoneXlsx(aoa, projectRows = projects) {
  // Row 0 = merged group labels (skip)
  // Row 1 = flat column headers
  // Row 2+ = data (one row per project)
  const headers = (aoa[1] || []).map(h => String(h ?? "").trim());
  const knownProjects = new Set(projectRows.map((project) => project.id ?? project.projectId));
  const dataRows = aoa.slice(2).filter(r => r.some(c => c != null && String(c).trim() !== ""));

  const gateNames = ["G0","G1","G2","G3","G4","G5","G6"];
  const gateColMap = {};
  gateNames.forEach(g => {
    gateColMap[g] = {
      plan_start: headers.indexOf(`${g}计划开始`),
      plan_end:   headers.indexOf(`${g}计划结束`),
      act_start:  headers.indexOf(`${g}实际开始`),
      act_end:    headers.indexOf(`${g}实际结束`),
      status:     headers.indexOf(`${g}状态`),
      note:       headers.indexOf(`${g}备注`),
    };
  });

  const projectIdCol = headers.indexOf("项目ID");
  const projectNameCol = headers.indexOf("项目名称");

  const errors = [];
  const warnings = [];
  const validRows = [];

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 3;
    const projectId = String(row[projectIdCol] ?? "").trim();
    const projectName = String(row[projectNameCol] ?? "").trim();

    if (!projectId) {
      errors.push({ row: rowNum, field: "projectId", message: "项目ID is required" });
      return;
    }
    if (!knownProjects.has(projectId)) {
      errors.push({ row: rowNum, field: "projectId", message: `Project ${projectId} does not exist in the project import` });
      return;
    }

    // Excel serial number, Chinese date text (2026年4月20日), or ISO -> "YYYY-MM-DD"
    const toIso = (val) => {
      if (val == null || String(val).trim() === "") return null;
      const trimmed = String(val).trim();
      const n = Number(trimmed);
      if (Number.isFinite(n) && n > 0) return xlSerialToIso(n);
      const cn = parseCnDate(trimmed);
      if (cn) return cn;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      return null;
    };

    gateNames.forEach((g) => {
      const cols = gateColMap[g];
      const cell = (idx) => (idx >= 0 ? row[idx] : null);
      const hasValue = (val) => val != null && String(val).trim() !== "";
      const planEndRaw = cell(cols.plan_end);
      if (!hasValue(planEndRaw) || String(planEndRaw).trim() === "0") {
        if (hasValue(cell(cols.act_end)) || hasValue(cell(cols.status))) {
          warnings.push({ row: rowNum, field: `${g}计划结束`, message: `${g} 缺少计划结束日期，但存在实际结束/状态，已跳过该里程碑` });
        }
        return;
      }

      const plannedStart = toIso(cols.plan_start >= 0 ? row[cols.plan_start] : null);
      const plannedEnd   = toIso(planEndRaw);
      const actualStart  = toIso(cols.act_start >= 0 ? row[cols.act_start] : null);
      const actualEnd    = toIso(cols.act_end >= 0 ? row[cols.act_end] : null);

      if (!plannedEnd) {
        warnings.push({ row: rowNum, field: `${g}计划结束`, message: `${g} 计划结束日期无效，跳过该里程碑` });
        return;
      }

      validRows.push({
        id: `${projectId}-${g}`,
        projectId,
        name: g,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        actual_start_date: actualStart,
        actual_end_date: actualEnd,
        note: cols.note >= 0 ? String(row[cols.note] ?? "").trim() : "",
        delay: delayDays(plannedEnd, actualEnd),
      });
    });
  });

  return { validRows, errors, warnings, headers };
}

export function parseOverrideCsv(text, projectRows = projects) {
  return parseTypedCsv(text, overrideTemplateSchema, (rows) => rows, { projects: projectRows, requireProjectMatch: true });
}

export function parseResourceAllocationCsv(text, projectRows = []) {
  const roleWeights = getRoleWeights();
  const statusWeights = getStatusWeights();
  const projectById = new Map(
    (projectRows.length ? projectRows : projects).map(p => [p.id ?? p.projectId, p])
  );

  return parseTypedCsv(text, resourceTemplateSchema, (rows, warnings) =>
    rows.map((row, index) => {
      const proj = projectById.get(row.projectId);
      if (!proj) {
        warnings.push({
          row: index + 2,
          field: "projectId",
          message: `项目 ${row.projectId} 在项目导入中不存在；复杂度默认 3，状态默认 产品开发`,
        });
      }
      const complexity = proj?.complexity ?? 3;
      const status = proj?.status ?? "产品开发";
      const cat = proj?.category ?? proj?.cat ?? null;
      const dept = proj?.dept ?? null;
      const biz = proj?.biz ?? null;
      const system = proj?.family ?? null;

      const roleWeight = roleWeights[row.role]?.[status] ?? 0;
      if (roleWeights[row.role] == null) {
        warnings.push({
          row: index + 2,
          field: "role",
          code: "unknown-role",
          person: row.person,
          role: row.role,
          message: `未知角色「${row.role}」（人员：${row.person}）不在权重矩阵中，负荷按 0 计算，不计入工作量统计`,
        });
      }
      return {
        ...row,
        complexity,
        status,
        cat,
        dept,
        biz,
        system,
        statusWeight: statusWeights[status] ?? 0,
        roleWeight,
        load: row.timeRatio * Math.sqrt(complexity / 5) * roleWeight,
        personKey: row.person,
        roleStatusKey: `${row.role}|${status}`,
      };
    })
  );
}

/**
 * Parse user_info.csv: 姓名 / 角色 / 是否外包
 * Returns { validRows: [{name, role, outsourced}], errors, warnings }
 */
export function parseUserInfoCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { validRows: [], errors: [{ row: 1, field: '姓名', message: '文件为空' }], warnings: [] };

  const headers = rows[0].map((h) => String(h ?? '').trim());
  const nameIdx = headers.indexOf('姓名');
  const roleIdx = headers.indexOf('角色');
  const outsourcedIdx = headers.indexOf('是否外包');

  const errors = [];
  if (nameIdx === -1) errors.push({ row: 1, field: '姓名', message: '缺少姓名列' });
  if (roleIdx === -1) errors.push({ row: 1, field: '角色', message: '缺少角色列' });
  if (errors.length) return { validRows: [], errors, warnings: [] };

  const warnings = [];
  const validRows = [];
  rows.slice(1).forEach((row, i) => {
    const rowNumber = i + 2;
    const name = String(row[nameIdx] ?? '').trim();
    if (!name) {
      warnings.push({ row: rowNumber, field: '姓名', message: '姓名为空，已跳过该行' });
      return;
    }
    const role = String(row[roleIdx] ?? '').trim();
    const outsourcedRaw = outsourcedIdx >= 0 ? String(row[outsourcedIdx] ?? '').trim() : '';
    const outsourced = booleanAliases[outsourcedRaw.toLowerCase()] ?? booleanAliases[outsourcedRaw] ?? false;
    if (!role) warnings.push({ row: rowNumber, field: '角色', message: `${name} 缺少角色，已留空` });
    if (outsourcedRaw && booleanAliases[outsourcedRaw.toLowerCase()] === undefined && booleanAliases[outsourcedRaw] === undefined) {
      warnings.push({ row: rowNumber, field: '是否外包', message: `${name} 的是否外包值无法识别，默认 FALSE` });
    }
    validRows.push({ name, role, outsourced });
  });

  return { validRows, errors, warnings };
}

/**
 * Parse a 项目状态权重 CSV: 项目状态 / 数值.
 * Returns { weights: {status: number}, errors, warnings } — a full-table
 * overwrite payload for appSettings.payload.statusWeights.
 */
export function parseStatusWeightsCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { weights: {}, errors: [{ row: 1, field: "项目状态", message: "文件为空" }], warnings: [] };

  const headers = rows[0].map((h) => String(h ?? "").trim());
  const statusIdx = headers.indexOf("项目状态");
  const valueIdx = headers.findIndex((h) => h === "数值" || h === "权重");
  const errors = [];
  if (statusIdx === -1) errors.push({ row: 1, field: "项目状态", message: "缺少项目状态列" });
  if (valueIdx === -1) errors.push({ row: 1, field: "数值", message: "缺少数值/权重列" });
  if (errors.length) return { weights: {}, errors, warnings: [] };

  const warnings = [];
  const weights = {};
  rows.slice(1).forEach((row, i) => {
    const rowNumber = i + 2;
    const status = String(row[statusIdx] ?? "").trim();
    if (!status) return;
    const value = Number(row[valueIdx]);
    if (!Number.isFinite(value) || value < 0) {
      warnings.push({ row: rowNumber, field: "数值", message: `${status} 的数值无效，已忽略该行` });
      return;
    }
    weights[status] = value;
  });
  if (!Object.keys(weights).length) errors.push({ row: 2, field: "项目状态", message: "没有可导入的有效数据行" });
  return { weights, errors, warnings };
}

/**
 * Parse a 角色权重表 CSV: 角色 / 项目状态 / 权重 (角色状态键 is derived and ignored).
 * Returns { weights: {role: {status: number}}, errors, warnings } — a
 * full-table overwrite payload for appSettings.payload.roleWeights.
 */
export function parseRoleWeightsCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { weights: {}, errors: [{ row: 1, field: "角色", message: "文件为空" }], warnings: [] };

  const headers = rows[0].map((h) => String(h ?? "").trim());
  const roleIdx = headers.indexOf("角色");
  const statusIdx = headers.indexOf("项目状态");
  const valueIdx = headers.findIndex((h) => h === "权重" || h === "数值");
  const errors = [];
  if (roleIdx === -1) errors.push({ row: 1, field: "角色", message: "缺少角色列" });
  if (statusIdx === -1) errors.push({ row: 1, field: "项目状态", message: "缺少项目状态列" });
  if (valueIdx === -1) errors.push({ row: 1, field: "权重", message: "缺少权重列" });
  if (errors.length) return { weights: {}, errors, warnings: [] };

  const warnings = [];
  const weights = {};
  rows.slice(1).forEach((row, i) => {
    const rowNumber = i + 2;
    const role = String(row[roleIdx] ?? "").trim();
    const status = String(row[statusIdx] ?? "").trim();
    if (!role || !status) return;
    const value = Number(row[valueIdx]);
    if (!Number.isFinite(value) || value < 0) {
      warnings.push({ row: rowNumber, field: "权重", message: `${role}|${status} 的权重无效，已忽略该行` });
      return;
    }
    if (!weights[role]) weights[role] = {};
    weights[role][status] = value;
  });
  if (!Object.keys(weights).length) errors.push({ row: 2, field: "角色", message: "没有可导入的有效数据行" });
  return { weights, errors, warnings };
}

// Long/flat resource allocation layout: one row per (project, person) pair,
// e.g. 分配ID / 项目唯一键 / 项目 / 角色 / 人员 / 工时投入占比 / ...
const LONG_FORMAT_COLUMN_ALIASES = {
  projectId: ["项目唯一键", "项目ID"],
  projectName: ["项目", "项目名称"],
  person: ["人员"],
  timeRatio: ["工时投入占比", "工时占比"],
};
const LONG_FORMAT_COLUMN_LABELS = {
  projectId: "项目唯一键/项目ID",
  projectName: "项目/项目名称",
  person: "人员",
  timeRatio: "工时投入占比",
};

function findLongFormatColumns(headers) {
  const find = (aliases) => {
    for (const alias of aliases) {
      const idx = headers.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return Object.fromEntries(
    Object.entries(LONG_FORMAT_COLUMN_ALIASES).map(([key, aliases]) => [key, find(aliases)])
  );
}

// Long-format headers may sit on row 0 (no group-label row above) or row 1
// (group-label row above, matching the wide/matrix convention). Scan both
// candidate rows for the signature 人员/工时投入占比 columns rather than
// assuming a fixed position.
const LONG_FORMAT_HEADER_ROW_CANDIDATES = [0, 1];

function locateLongFormatHeaderRow(aoa) {
  for (const rowIdx of LONG_FORMAT_HEADER_ROW_CANDIDATES) {
    const headers = (aoa[rowIdx] || []).map((h) => String(h ?? "").trim());
    const cols = findLongFormatColumns(headers);
    if (cols.person !== -1 || cols.timeRatio !== -1) {
      return { headerRowIdx: rowIdx, headers, cols };
    }
  }
  return null;
}

/**
 * Detects the long/flat resource allocation layout (one row per project+person)
 * and pivots it into the wide/matrix layout that parseResourceAllocationXlsx expects:
 * [项目ID, 项目名称, person1, person2, ...] header row + one data row per project.
 *
 * Returns null when the sheet doesn't look like the long format at all (so the
 * caller falls through to normal wide-matrix parsing). Throws when the sheet
 * looks like the long format but is missing required columns.
 */
function pivotLongFormatToWideMatrix(aoa) {
  const located = locateLongFormatHeaderRow(aoa);
  if (!located) return null;
  const { headerRowIdx, cols } = located;

  const missingKeys = Object.keys(cols).filter((key) => cols[key] === -1);
  if (missingKeys.length > 0) {
    const missingLabels = missingKeys.map((key) => LONG_FORMAT_COLUMN_LABELS[key]).join("、");
    throw new Error(`资源分配表缺少必需列：${missingLabels}`);
  }

  const dataRows = aoa.slice(headerRowIdx + 1).filter((r) => r.some((c) => c != null && String(c).trim() !== ""));
  const projectOrder = [];
  const projectNameById = new Map();
  const personOrder = [];
  const personSeen = new Set();
  const ratioByProject = new Map();
  const dupeWarnings = [];
  let skippedMissingLink = 0;

  dataRows.forEach((row) => {
    const projectId = String(row[cols.projectId] ?? "").trim();
    const projectName = String(row[cols.projectName] ?? "").trim();
    const person = String(row[cols.person] ?? "").trim();
    if (!projectId || !person) {
      skippedMissingLink += 1;
      return;
    }

    const ratio = Number(row[cols.timeRatio]);
    if (!Number.isFinite(ratio)) return;

    if (!projectNameById.has(projectId)) {
      projectNameById.set(projectId, projectName);
      projectOrder.push(projectId);
    }
    if (!personSeen.has(person)) {
      personSeen.add(person);
      personOrder.push(person);
    }
    if (!ratioByProject.has(projectId)) ratioByProject.set(projectId, new Map());
    const personRatios = ratioByProject.get(projectId);
    // Multiple rows for the same project+person are separate allocation entries
    // (e.g. different 分配ID) — sum their 工时投入占比 rather than keeping only one.
    if (personRatios.has(person)) {
      const summed = personRatios.get(person) + ratio;
      personRatios.set(person, summed);
      dupeWarnings.push({ projectId, person, summed });
    } else {
      personRatios.set(person, ratio);
    }
  });

  const wideHeaders = ["项目ID", "项目名称", ...personOrder];
  const wideRows = projectOrder.map((projectId) => {
    const ratios = ratioByProject.get(projectId);
    return [projectId, projectNameById.get(projectId), ...personOrder.map((p) => ratios.get(p) ?? null)];
  });

  return { aoa: [[], wideHeaders, ...wideRows], dupeWarnings, skippedMissingLink };
}

/**
 * Parse new pivot/matrix resource allocation xlsx.
 * Layout:
 *   Row 0 — group label row (项目基本信息 / 工时投入统计): skip
 *   Row 1 — headers: [项目ID, 项目名称, person1, person2, ...]
 *   Row 2+ — data: [projectId, projectName, timeRatio1, timeRatio2, ...]
 *
 * Also accepts the long/flat layout (one row per project+person, e.g. 项目唯一键 /
 * 项目 / 人员 / 工时投入占比 columns) and pivots it into the wide layout above.
 *
 * personInfoList defaults to the live data-store personInfo array.
 * projectRows defaults to the live data-store projects array.
 */
export function parseResourceAllocationXlsx(aoaInput, personInfoList = personInfo, projectRows = []) {
  const roleWeights = getRoleWeights();
  const statusWeights = getStatusWeights();
  const pivoted = pivotLongFormatToWideMatrix(aoaInput);
  const aoa = pivoted ? pivoted.aoa : aoaInput;
  const resolvedProjects = projectRows.length ? projectRows : projects;
  const projectById = new Map(resolvedProjects.map((p) => [p.id ?? p.projectId, p]));
  const personMap = new Map((personInfoList.length ? personInfoList : personInfo).map((p) => [p.name, p]));

  const headers = (aoa[1] || []).map((h) => String(h ?? '').trim());
  const dataRows = aoa.slice(2).filter((r) => r.some((c) => c != null && String(c).trim() !== ''));

  const errors = [];
  const warnings = [];
  const validRows = [];

  if (pivoted) {
    pivoted.dupeWarnings.forEach(({ projectId, person, summed }) => {
      warnings.push({
        row: 0,
        field: 'timeRatio',
        message: `项目 ${projectId} 人员「${person}」出现多条分配记录，工时投入占比已合并为 ${summed}`,
      });
    });
    if (pivoted.skippedMissingLink > 0) {
      warnings.push({
        row: 0,
        field: 'projectId',
        message: `${pivoted.skippedMissingLink} 行缺少项目唯一键或人员，已跳过（未计入统计）`,
      });
    }
  }

  const personNames = headers.slice(2);

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 3;
    const projectId = String(row[0] ?? '').trim();
    const projectName = String(row[1] ?? '').trim();
    if (!projectId) return;

    const proj = projectById.get(projectId);
    if (!proj) {
      warnings.push({
        row: rowNum,
        field: 'projectId',
        message: `项目 ${projectId} 在项目导入中不存在；复杂度默认 3，状态默认 产品开发`,
      });
    }

    const complexity = proj?.complexity ?? 3;
    const status = proj?.status ?? '产品开发';
    const cat = proj?.category ?? proj?.cat ?? null;
    const dept = proj?.dept ?? null;
    const biz = proj?.biz ?? null;
    const system = proj?.family ?? null;

    personNames.forEach((personName, colOffset) => {
      if (!personName) return;
      const rawValue = row[colOffset + 2];
      if (rawValue == null || String(rawValue).trim() === '') return;
      const timeRatio = Number(rawValue);
      if (!Number.isFinite(timeRatio) || timeRatio <= 0) return;

      const pInfo = personMap.get(personName);
      if (!pInfo) {
        warnings.push({
          row: rowNum,
          field: personName,
          message: `人员「${personName}」不在人员信息表中，角色未知，负荷按 0 计算`,
        });
      }

      const role = pInfo?.role ?? '';
      const outsourced = pInfo?.outsourced ?? false;
      const roleWeight = roleWeights[role]?.[status] ?? 0;

      if (role && roleWeights[role] == null) {
        warnings.push({
          row: rowNum,
          field: 'role',
          code: 'unknown-role',
          person: personName,
          role,
          message: `未知角色「${role}」（人员：${personName}）不在权重矩阵中，负荷按 0 计算`,
        });
      }

      validRows.push({
        id: `${projectId}-${personName}`,
        projectId,
        projectName: projectName || proj?.name || projectId,
        person: personName,
        role,
        outsourced,
        timeRatio,
        complexity,
        status,
        cat,
        dept,
        biz,
        system,
        statusWeight: statusWeights[status] ?? 0,
        roleWeight,
        load: timeRatio * Math.sqrt(complexity / 5) * roleWeight,
        personKey: personName,
        roleStatusKey: `${role}|${status}`,
      });
    });
  });

  const seen = new Map();
  for (const row of validRows) seen.set(row.id, row);
  return { validRows: [...seen.values()], errors, warnings };
}

export function parseResourceAllocationMatrixCsv(text, personInfoList = personInfo, projectRows = []) {
  const aoa = parseCsv(text);
  return parseResourceAllocationXlsx(aoa, personInfoList, projectRows);
}

function parseTypedCsv(text, schema, transform, validationOptions = {}) {
  const rows = parseCsv(text);
  const headers = rows[0] || [];
  const { fields, missingRequired, unknownHeaders } = mapHeaders(headers, schema);
  const headerList = headers.map((header) => String(header).trim()).filter(Boolean).join(" / ") || "空表头";
  const errors = missingRequired.map((field) => ({ row: 1, field: field.key, message: `${field.label} header is required；当前表头：${headerList}` }));
  const warnings = unknownHeaders.map((header) => ({ row: 1, field: header, message: "Unknown header will be ignored" }));
  const rawRows = rows.slice(1).map((values) => {
    const row = {};
    fields.forEach((field, index) => {
      if (field) row[field.key] = values[index] ?? "";
    });
    return row;
  });
  const validated = validateRows(rawRows, schema, validationOptions);
  warnings.push(...validated.warnings);
  errors.push(...validated.errors);
  const validRows = errors.length ? [] : transform(validated.validRows, warnings);
  return { validRows, errors, warnings, headers };
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function normalizeValue(value, field) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { value: "" };
  if (field.type === "number") {
    const number = Number(trimmed);
    return Number.isFinite(number) ? { value: number } : { value: trimmed, error: `${field.label} must be a number` };
  }
  if (field.type === "ratio") {
    const ratio = trimmed.endsWith("%") ? Number(trimmed.slice(0, -1)) / 100 : Number(trimmed);
    if (!Number.isFinite(ratio)) return { value: trimmed, error: `${field.label} must be a number or percentage` };
    if (ratio < 0) return { value: ratio, error: `${field.label} cannot be negative` };
    return { value: ratio };
  }
  if (field.type === "boolean") {
    const normalized = booleanAliases[trimmed.toLowerCase()] ?? booleanAliases[trimmed];
    if (normalized === undefined) return { value: false, warning: `${field.label} is not recognized; defaults to false` };
    return { value: normalized };
  }
  if (field.type === "health") {
    const normalized = healthAliases[trimmed.toLowerCase()] ?? healthAliases[trimmed];
    if (!normalized) return { value: trimmed, warning: `${field.label} is not one of R/Y/G` };
    return { value: normalized };
  }
  if (field.type === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { value: trimmed, error: `${field.label} must use YYYY-MM-DD` };
    const date = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(date.getTime())) return { value: trimmed, error: `${field.label} is not a valid date` };
    return { value: trimmed };
  }
  if (field.type === "cndate") {
    if (!trimmed) return { value: "" };
    const iso = parseCnDate(trimmed);
    if (!iso) return { value: trimmed, warning: `${field.label} 无法识别为中文日期，已跳过` };
    return { value: iso };
  }
  if (field.type === "xldate") {
    if (!trimmed || trimmed === "0") return { value: "" };
    const iso = xlSerialToIso(trimmed) ?? parseCnDate(trimmed);
    if (!iso) return { value: trimmed, warning: `${field.label} 无法识别为Excel日期序号或中文日期，已跳过` };
    return { value: iso };
  }
  return { value: trimmed };
}

function delayDays(plannedEnd, actualEnd) {
  if (!plannedEnd || !actualEnd) return 0;
  const planned = new Date(`${plannedEnd}T00:00:00`);
  const actual = new Date(`${actualEnd}T00:00:00`);
  if (Number.isNaN(planned.getTime()) || Number.isNaN(actual.getTime())) return 0;
  return Math.max(0, Math.round((actual.getTime() - planned.getTime()) / 86400000));
}
