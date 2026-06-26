import { getDb } from '../db.js';

let _nextId = Date.now();
function uid(prefix) { return `${prefix}-${(++_nextId).toString(36)}`; }

function rowToLink(row) {
  return {
    id: row.id,
    resourceKey: row.resource_key,
    projectId: row.project_id,
    status: row.status,
    matchSource: row.match_source,
    confidence: row.confidence,
    candidateJson: row.candidate_json === null ? null : JSON.parse(row.candidate_json),
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listLinks() {
  const db = getDb();
  return db.prepare('SELECT * FROM project_links ORDER BY status DESC, resource_key ASC').all().map(rowToLink);
}

export function confirmedLinksMap() {
  const db = getDb();
  const rows = db.prepare("SELECT resource_key, project_id FROM project_links WHERE status = 'confirmed'").all();
  return new Map(rows.map((row) => [row.resource_key, row.project_id]));
}

export function upsertProposed(resourceKey, projectId, confidence, candidates) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM project_links WHERE resource_key = ?').get(resourceKey);
  if (existing && existing.status !== 'proposed') return rowToLink(existing);

  const now = new Date().toISOString();
  const candidateJson = JSON.stringify(candidates);
  if (existing) {
    db.prepare(`
      UPDATE project_links
      SET confidence = ?, candidate_json = ?, updated_at = ?
      WHERE resource_key = ?
    `).run(confidence, candidateJson, now, resourceKey);
  } else {
    db.prepare(`
      INSERT INTO project_links (
        id, resource_key, project_id, status, match_source, confidence,
        candidate_json, confirmed_by, confirmed_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'proposed', 'auto', ?, ?, NULL, NULL, ?, ?)
    `).run(uid('link'), resourceKey, projectId, confidence, candidateJson, now, now);
  }

  return rowToLink(db.prepare('SELECT * FROM project_links WHERE resource_key = ?').get(resourceKey));
}

export function patchLink(id, { status, projectId, confirmedBy }) {
  const db = getDb();
  const now = new Date().toISOString();
  const confirmedAt = status === 'confirmed' ? now : null;
  const result = db.prepare(`
    UPDATE project_links
    SET status = ?, project_id = ?, confirmed_by = ?, confirmed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(status, projectId, confirmedBy, confirmedAt, now, id);
  if (result.changes === 0) throw new Error('链接不存在');

  return rowToLink(db.prepare('SELECT * FROM project_links WHERE id = ?').get(id));
}

export function insertManualLink(resourceKey, projectId, confirmedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = uid('link');
  db.prepare(`
    INSERT OR REPLACE INTO project_links (
      id, resource_key, project_id, status, match_source, confidence,
      candidate_json, confirmed_by, confirmed_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'confirmed', 'manual', NULL, NULL, ?, ?, ?, ?)
  `).run(id, resourceKey, projectId, confirmedBy, now, now, now);

  return rowToLink(db.prepare('SELECT * FROM project_links WHERE id = ?').get(id));
}
