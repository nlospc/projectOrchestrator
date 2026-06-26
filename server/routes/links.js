import { Router } from 'express';
import { listAllocations } from '../repositories/allocations.js';
import { listProjects } from '../repositories/projects.js';
import { listLinks, upsertProposed, patchLink, insertManualLink } from '../repositories/links.js';
import { proposeLinks } from '../../src/core/matchers.js';

const router = Router();

router.get('/links', (_req, res) => {
  try {
    res.json({ links: listLinks() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/links/propose', (_req, res) => {
  try {
    const proposals = proposeLinks(listAllocations(), listProjects());
    let proposed = 0;
    let skipped = 0;

    for (const proposal of proposals) {
      const link = upsertProposed(
        proposal.resourceKey,
        proposal.projectId,
        proposal.confidence,
        proposal.candidates,
      );
      if (link.status === 'proposed') proposed += 1;
      else skipped += 1;
    }

    res.json({ proposed, skipped, total: proposals.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/links/:id', (req, res) => {
  const { status, projectId, confirmedBy } = req.body;
  if (!['proposed', 'confirmed', 'rejected'].includes(status)) {
    return res.status(422).json({ error: 'status 必须为 proposed、confirmed 或 rejected' });
  }

  try {
    res.json({ link: patchLink(req.params.id, { status, projectId, confirmedBy }) });
  } catch (err) {
    if (err.message === '链接不存在') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/links', (req, res) => {
  const { resourceKey, projectId, confirmedBy } = req.body;
  if (!resourceKey || !projectId) {
    return res.status(422).json({ error: 'resourceKey 和 projectId 为必填项' });
  }

  try {
    res.json({ link: insertManualLink(resourceKey, projectId, confirmedBy) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
