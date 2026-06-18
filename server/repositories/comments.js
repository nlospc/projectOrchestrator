import { getDb } from '../db.js';

function rowToComment(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    body: row.body,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

let _nextId = Date.now();
function uid(prefix) {
  return `${prefix}-${(++_nextId).toString(36)}`;
}

export function listComments(projectId) {
  const db = getDb();
  const rows = projectId
    ? db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY created_at ASC').all(projectId)
    : db.prepare('SELECT * FROM comments ORDER BY created_at ASC').all();
  return rows.map(rowToComment);
}

export function appendComment(projectId, body, authorName = 'PMO Admin') {
  if (!body.trim()) throw new Error('评论内容不能为空');
  const db = getDb();
  const now = new Date().toISOString();
  const id = uid('CM');
  db.prepare(`
    INSERT INTO comments (id, project_id, body, author_name, created_at)
    VALUES (@id, @project_id, @body, @author_name, @created_at)
  `).run({ id, project_id: projectId, body: body.trim(), author_name: authorName, created_at: now });
  return { id, projectId, body: body.trim(), authorName, createdAt: now };
}

export function insertCommentRaw(c) {
  const db = getDb();
  db.prepare(`
    INSERT INTO comments (id, project_id, body, author_name, created_at)
    VALUES (@id, @project_id, @body, @author_name, @created_at)
  `).run({
    id: c.id,
    project_id: c.projectId,
    body: c.body,
    author_name: c.authorName ?? 'PMO Admin',
    created_at: c.createdAt,
  });
}
