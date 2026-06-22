import { Router } from 'express';
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
