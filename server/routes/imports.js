import { Router } from 'express';
import { applyOverrides, replaceAllocations, upsertMilestones, upsertProjects } from '../repositories/imports.js';

const router = Router();

// POST /api/import/allocations  — full replace of the allocations table
router.post('/import/allocations', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = replaceAllocations(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/projects  — upsert projects by id (children preserved)
router.post('/import/projects', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = upsertProjects(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/milestones  — upsert milestones by id
router.post('/import/milestones', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = upsertMilestones(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// POST /api/import/overrides  — apply health overrides to existing projects
router.post('/import/overrides', (req, res) => {
  try {
    const { rows, filename = null } = req.body;
    if (!Array.isArray(rows)) return res.status(422).json({ error: 'rows array required' });
    const count = applyOverrides(rows, filename);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

export default router;
