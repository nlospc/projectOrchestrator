import { Router } from 'express';
import { listProjects } from '../repositories/projects.js';
import { listMilestones, listChangeLogs } from '../repositories/milestones.js';
import { listComments } from '../repositories/comments.js';
import { listAllocations } from '../repositories/allocations.js';

const router = Router();

router.get('/bootstrap', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({
      projects: listProjects(),
      milestones: listMilestones(),
      changeLogs: listChangeLogs(),
      comments: listComments(),
      allocations: listAllocations(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
