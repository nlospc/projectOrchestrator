import { Router } from 'express';
import { getSettings, saveSettings } from '../repositories/settings.js';

const router = Router();

router.get('/settings', (_req, res) => {
  try {
    res.json(getSettings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { payload, rev } = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(422).json({ error: 'payload must be an object' });
    }
    if (typeof rev !== 'number') {
      return res.status(422).json({ error: 'rev must be a number' });
    }
    const lt = payload.loadThresholds;
    if (lt) {
      const { low, mid } = lt;
      if ((low != null && (!Number.isFinite(low) || low < 0)) ||
          (mid != null && (!Number.isFinite(mid) || mid < 0))) {
        return res.status(422).json({ error: 'loadThresholds.low and mid must be non-negative finite numbers' });
      }
    }
    const result = saveSettings(payload, rev);
    res.json(result);
  } catch (err) {
    if (err.code === 'REV_CONFLICT') return res.status(409).json({ error: err.message, code: 'REV_CONFLICT' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
