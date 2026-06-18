import { Router } from 'express';
import {
  replaceAllocations,
  replaceMilestones,
  replaceProjectOverrides,
  replaceProjects,
} from '../repositories/imports.js';

const router = Router();

// POST /api/import/allocations - full replace of the allocations table.
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

export default router;
