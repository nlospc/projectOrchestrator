import { Router } from 'express';
import * as XLSX from 'xlsx';
import { listAllocations } from '../repositories/allocations.js';
import { listMilestones } from '../repositories/milestones.js';
import { listProjects } from '../repositories/projects.js';
import {
  milestoneTemplateSchema,
  overrideTemplateSchema,
  projectTemplateSchema,
  resourceTemplateSchema,
} from '../../src/core/template-schemas.js';

const router = Router();

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function toCsv(schema, rows) {
  const header = schema.map((field) => csvEscape(field.label)).join(',');
  const lines = rows.map((row) =>
    schema.map((field) => csvEscape(row[field.targetKey] ?? row[field.key] ?? '')).join(',')
  );
  return '\ufeff' + [header, ...lines].join('\n');
}

function sendCsv(res, filename, schema, rows) {
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename=${filename}`);
  res.send(toCsv(schema, rows));
}

function toWorksheet(schema, rows) {
  return XLSX.utils.aoa_to_sheet([
    schema.map((field) => field.label),
    ...rows.map((row) => schema.map((field) => row[field.targetKey ?? field.key] ?? '')),
  ]);
}

router.get('/export/all.xlsx', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const projectRows = listProjects();
  const milestoneRows = listMilestones().map((milestone) => {
    let state = 'G';
    if (milestone.actual_end_date) {
      state = milestone.actual_end_date > milestone.planned_end_date ? 'Y' : 'G';
    } else if (milestone.planned_end_date && milestone.planned_end_date < today) {
      state = 'R';
    }
    return { ...milestone, state, note: '' };
  });
  const overrideRows = projectRows
    .filter((project) => project.override != null && String(project.override).trim() !== '')
    .map((project) => ({ ...project, projectId: project.id }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, toWorksheet(projectTemplateSchema, projectRows), 'projects');
  XLSX.utils.book_append_sheet(workbook, toWorksheet(milestoneTemplateSchema, milestoneRows), 'milestones');
  XLSX.utils.book_append_sheet(workbook, toWorksheet(resourceTemplateSchema, listAllocations()), 'allocations');
  XLSX.utils.book_append_sheet(workbook, toWorksheet(overrideTemplateSchema, overrideRows), 'overrides');

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', 'attachment; filename=PMO_Export_All.xlsx');
  res.send(output);
});

router.get('/export/projects', (_req, res) => {
  sendCsv(res, 'PMO_Project_Export.csv', projectTemplateSchema, listProjects());
});

router.get('/export/milestones', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = listMilestones().map((m) => {
    let state = 'G';
    if (m.actual_end_date) {
      state = m.actual_end_date > m.planned_end_date ? 'Y' : 'G';
    } else if (m.planned_end_date && m.planned_end_date < today) {
      state = 'R';
    }
    return { ...m, state, note: '' };
  });
  sendCsv(res, 'PMO_Milestone_Export.csv', milestoneTemplateSchema, rows);
});

router.get('/export/overrides', (_req, res) => {
  const rows = listProjects()
    .filter((project) => project.override != null && String(project.override).trim() !== '')
    .map((project) => ({ ...project, projectId: project.id }));
  sendCsv(res, 'PMO_Override_Export.csv', overrideTemplateSchema, rows);
});

router.get('/export/allocations', (_req, res) => {
  sendCsv(res, 'PMO_ResourceAllocation_Export.csv', resourceTemplateSchema, listAllocations());
});

export default router;
