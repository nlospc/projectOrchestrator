import { projects } from "./data-store.js";
import { roleWeights, statusWeights } from "../data/mock-data.js";
import { healthValues, milestoneTemplateSchema, overrideTemplateSchema, projectTemplateSchema, resourceTemplateSchema } from "./template-schemas.js";

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
      const defaults = {
        health: "G",
        complexity: 5,
        status: "未设置",
        pm: "未指定",
      };
      const normalized = { ...row, override: row.override || "" };
      Object.entries(defaults).forEach(([field, value]) => {
        if (isBlank(normalized[field])) {
          normalized[field] = value;
          warnings.push({ row: index + 2, field, message: `${field} is blank; defaults to ${value}` });
        }
      });
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

export function parseOverrideCsv(text, projectRows = projects) {
  return parseTypedCsv(text, overrideTemplateSchema, (rows) => rows, { projects: projectRows, requireProjectMatch: true });
}

export function parseResourceAllocationCsv(text) {
  return parseTypedCsv(text, resourceTemplateSchema, (rows, warnings) =>
    rows.map((row, index) => {
      const statusWeight = statusWeights[row.status] ?? 0.5;
      const roleWeight = roleWeights[row.role]?.[row.status] ?? statusWeight;
      if (!statusWeights[row.status]) warnings.push({ row: index + 2, field: "status", message: "Unknown status; statusWeight defaults to 0.5" });
      if (!roleWeights[row.role]?.[row.status]) warnings.push({ row: index + 2, field: "role", message: "Missing role/status matrix weight; roleWeight falls back to statusWeight" });
      return {
        ...row,
        statusWeight,
        roleWeight,
        load: row.timeRatio * Math.sqrt((row.complexity || 3) / 5) * roleWeight,
        personKey: row.person,
        roleStatusKey: `${row.role}|${row.status}`,
      };
    })
  );
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
  return { value: trimmed };
}

function delayDays(plannedEnd, actualEnd) {
  if (!plannedEnd || !actualEnd) return 0;
  const planned = new Date(`${plannedEnd}T00:00:00`);
  const actual = new Date(`${actualEnd}T00:00:00`);
  if (Number.isNaN(planned.getTime()) || Number.isNaN(actual.getTime())) return 0;
  return Math.max(0, Math.round((actual.getTime() - planned.getTime()) / 86400000));
}
