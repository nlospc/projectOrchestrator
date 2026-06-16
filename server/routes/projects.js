import { Router } from 'express';
import { listProjects, patchProject } from '../repositories/projects.js';
import { listMilestones } from '../repositories/milestones.js';

const router = Router();

// GET /api/projects
router.get('/projects', (_req, res) => {
  try {
    res.json({ projects: listProjects() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id  — health override / archive / planned dates
router.patch('/projects/:id', (req, res) => {
  try {
    const { rev = null, ...patch } = req.body;
    const project = patchProject(req.params.id, patch, rev);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    if (err.code === 'REV_CONFLICT') return res.status(409).json({ error: err.message, code: err.code });
    res.status(409).json({ error: err.message });
  }
});

// GET /api/projects/:id/milestones
router.get('/projects/:id/milestones', (req, res) => {
  try {
    res.json({ milestones: listMilestones(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
