import { Router } from 'express';
import { listComments, appendComment } from '../repositories/comments.js';

const router = Router();

// GET /api/projects/:id/comments
router.get('/projects/:id/comments', (req, res) => {
  try {
    res.json({ comments: listComments(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/comments
router.post('/projects/:id/comments', (req, res) => {
  try {
    const { body, authorName } = req.body;
    if (!body?.trim()) return res.status(422).json({ error: '评论内容不能为空' });
    const comment = appendComment(req.params.id, body, authorName);
    res.status(201).json({ comment });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

export default router;
