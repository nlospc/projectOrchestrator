import { Router } from 'express';
import { getDb } from '../db.js';
import { listAllocations } from '../repositories/allocations.js';
import { listMilestones } from '../repositories/milestones.js';
import { listProjects } from '../repositories/projects.js';
import {
  replaceAllocations,
  replaceMilestones,
  replaceProjectOverrides,
  replaceProjects,
} from '../repositories/imports.js';
import { listPersonInfo, replacePersonInfo, upsertPerson, deletePerson } from '../repositories/person-info.js';
import { upsertProposed } from '../repositories/links.js';
import { proposeLinks } from '../../src/core/matchers.js';
const router = Router();

const previewKinds = {
  project: {
    idField: 'id',
    fields: ['id', 'name', 'health', 'complexity', 'status', 'pm', 'category', 'dept', 'biz',
      'family', 'gate', 'init', 'level', 'product', 'tech',
      'planned_start_date', 'planned_end_date'],
    list: listProjects,
  },
  milestone: {
    idField: 'id',
    fields: ['id', 'projectId', 'name', 'planned_start_date', 'planned_end_date',
      'actual_start_date', 'actual_end_date'],
    list: listMilestones,
  },
  override: {
    idField: 'projectId',
    fields: ['projectId', 'override', 'overrideNote'],
    list: () => listProjects()
      .filter((project) => String(project.override ?? '').trim() !== '')
      .map((project) => ({ ...project, projectId: project.id })),
  },
  resource: {
    idField: 'id',
    fields: ['id', 'projectId', 'projectName', 'role', 'person', 'timeRatio', 'outsourced',
      'complexity', 'status', 'cat', 'dept', 'biz', 'system'],
    list: listAllocations,
  },
  person_info: {
    idField: 'name',
    fields: ['name', 'role', 'outsourced'],
    list: listPersonInfo,
  },
};

function comparableValue(value) {
  return value == null || value === '' ? '' : String(value);
}

function diffRows(config, incomingRows) {
  const currentRows = config.list();
  const currentById = new Map(currentRows.map((row) => [comparableValue(row[config.idField]), row]));
  const incomingIds = new Set();
  let added = 0;
  let changed = 0;
  let unchanged = 0;

  incomingRows.forEach((row) => {
    const id = comparableValue(row[config.idField]);
    incomingIds.add(id);
    const current = currentById.get(id);
    if (!current) {
      added += 1;
      return;
    }
    const differs = config.fields.some((field) =>
      comparableValue(row[field]) !== comparableValue(current[field])
    );
    if (differs) changed += 1;
    else unchanged += 1;
  });

  const removed = [...currentById.keys()].filter((id) => !incomingIds.has(id)).length;
  return { added, changed, removed, unchanged, total: incomingRows.length };
}

router.get('/import/history', (_req, res) => {
  const batches = getDb().prepare(`
    SELECT id, kind, filename, row_count, imported_by, imported_at
    FROM import_batches
    ORDER BY imported_at DESC
    LIMIT 50
  `).all();
  res.json({ batches });
});

router.post('/import/:kind/preview', (req, res) => {
  const config = previewKinds[req.params.kind];
  if (!config) return res.status(404).json({ error: `Unknown import kind: ${req.params.kind}` });
  const { rows } = req.body || {};
  if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
  res.json(diffRows(config, rows));
});

// POST /api/import/allocations - full replace of the allocations table.
router.post('/import/allocations', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replaceAllocations(rows, filename);
    // Auto-propose links for new resource keys; upsertProposed skips confirmed/rejected
    const proposals = proposeLinks(listAllocations(), listProjects());
    let proposed = 0;
    for (const p of proposals) {
      const result = upsertProposed(p.resourceKey, p.projectId, p.confidence, p.candidates);
      if (result.status === 'proposed') proposed++;
    }
    res.json({ ok: true, count, proposed });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/projects - full replace of the projects table.
router.post('/import/projects', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replaceProjects(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/milestones - full replace of the milestones table.
router.post('/import/milestones', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replaceMilestones(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/overrides - full replace of PMO health overrides.
router.post('/import/overrides', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replaceProjectOverrides(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/person-info - full replace of the person_info table.
router.post('/import/person-info', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replacePersonInfo(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// GET /api/person-info - list all person info entries.
router.get('/person-info', (_req, res) => {
  try {
    res.json({ personInfo: listPersonInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/person-info - add or update a single person.
router.post('/person-info', (req, res) => {
  try {
    const { name, role, outsourced } = req.body || {};
    if (!name || String(name).trim() === '') return res.status(422).json({ error: 'name is required' });
    const person = upsertPerson({ name: String(name).trim(), role: String(role ?? '').trim(), outsourced: !!outsourced });
    res.json({ ok: true, person });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// DELETE /api/person-info/:name - remove a person by name.
router.delete('/person-info/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const deleted = deletePerson(name);
    if (!deleted) return res.status(404).json({ error: `Person "${name}" not found` });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
