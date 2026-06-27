import { Router } from 'express';
import { listProjects } from '../repositories/projects.js';
import { listMilestones, listChangeLogs } from '../repositories/milestones.js';
import { listComments } from '../repositories/comments.js';
import { listAllocations } from '../repositories/allocations.js';
import { getSettings } from '../repositories/settings.js';
import { confirmedLinksMap } from '../repositories/links.js';
import { listPersonInfo } from '../repositories/person-info.js';

const router = Router();

router.get('/bootstrap', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const linksMap = confirmedLinksMap();
    res.json({
      projects: listProjects(),
      milestones: listMilestones(),
      changeLogs: listChangeLogs(),
      comments: listComments(),
      allocations: listAllocations(),
      personInfo: listPersonInfo(),
      settings: getSettings(),
      links: [...linksMap.entries()].map(([resourceKey, projectId]) => ({ resourceKey, projectId })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
