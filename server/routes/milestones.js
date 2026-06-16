import { Router } from 'express';
import {
  getMilestone,
  insertMilestone,
  updateMilestone,
  removeMilestone,
  reorderMilestones,
  listChangeLogsByProject,
} from '../repositories/milestones.js';

const router = Router();

// POST /api/milestones
router.post('/milestones', (req, res) => {
  try {
    const { projectId, afterId = null, ...init } = req.body;
    if (!projectId) return res.status(422).json({ error: 'projectId required' });
    const milestone = insertMilestone(projectId, afterId, init);
    res.status(201).json({ milestone });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// PATCH /api/milestones/:id
router.patch('/milestones/:id', (req, res) => {
  try {
    const { patch, reason = '', rev = null } = req.body;
    if (!patch) return res.status(422).json({ error: 'patch required' });
    const milestone = updateMilestone(req.params.id, patch, reason, rev);
    const changeLog = listChangeLogsByProject(milestone.projectId);
    res.json({ milestone, changeLog });
  } catch (err) {
    if (err.code === 'REV_CONFLICT') return res.status(409).json({ error: err.message, code: err.code });
    const status = err.message.includes('not found') ? 404 : 409;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/milestones/:id
router.delete('/milestones/:id', (req, res) => {
  try {
    removeMilestone(req.params.id);
    res.status(204).end();
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 409;
    res.status(status).json({ error: err.message });
  }
});

// PUT /api/projects/:id/milestone-order
router.put('/projects/:id/milestone-order', (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(422).json({ error: 'order array required' });
    reorderMilestones(req.params.id, order);
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// GET /api/milestones/:id/changelog
router.get('/milestones/:id/changelog', (req, res) => {
  try {
    const m = getMilestone(req.params.id);
    if (!m) return res.status(404).json({ error: 'Milestone not found' });
    const logs = listChangeLogsByProject(m.projectId).filter(cl => cl.milestoneId === req.params.id);
    res.json({ changelog: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
