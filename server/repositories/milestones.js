import { getDb, revConflict } from '../db.js';

function rowToMilestone(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    sortOrder: row.sort_order,
    planned_start_date: row.planned_start_date,
    planned_end_date: row.planned_end_date,
    actual_start_date: row.actual_start_date ?? null,
    actual_end_date: row.actual_end_date ?? null,
    rev: row.rev,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToChangeLog(row) {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    field: row.field,
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    reason: row.reason ?? '',
    changedAt: row.changed_at,
  };
}

const PLANNED_FIELDS = new Set(['planned_start_date', 'planned_end_date']);

let _nextId = Date.now();
function uid(prefix) {
  return `${prefix}-${(++_nextId).toString(36)}`;
}

export function listMilestones(projectId) {
  const db = getDb();
  const rows = projectId
    ? db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order').all(projectId)
    : db.prepare('SELECT * FROM milestones ORDER BY project_id, sort_order').all();
  return rows.map(rowToMilestone);
}

export function getMilestone(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  return row ? rowToMilestone(row) : null;
}

export function listChangeLogs() {
  const db = getDb();
  return db.prepare('SELECT * FROM milestone_change_logs ORDER BY changed_at DESC').all().map(rowToChangeLog);
}

export function listChangeLogsByProject(projectId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT cl.* FROM milestone_change_logs cl
    JOIN milestones m ON m.id = cl.milestone_id
    WHERE m.project_id = ?
    ORDER BY cl.changed_at DESC
  `).all(projectId);
  return rows.map(rowToChangeLog);
}

export function insertMilestone(projectId, afterId, init) {
  if (!init.planned_start_date || !init.planned_end_date) {
    throw new Error('insertMilestone requires planned_start_date and planned_end_date');
  }
  const db = getDb();
  const now = new Date().toISOString();

  const peers = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order').all(projectId);
  const insertAfterIdx = afterId == null
    ? peers.length - 1
    : peers.findIndex(x => x.id === afterId);

  const newSortOrder = insertAfterIdx < 0
    ? 1
    : (peers[insertAfterIdx]?.sort_order ?? 0) + 1;

  let newId;
  db.transaction(() => {
    for (const peer of peers) {
      if (peer.sort_order >= newSortOrder) {
        db.prepare('UPDATE milestones SET sort_order = sort_order + 1 WHERE id = ?').run(peer.id);
      }
    }
    newId = uid('M');
    db.prepare(`
      INSERT INTO milestones (id, project_id, name, sort_order,
        planned_start_date, planned_end_date, actual_start_date, actual_end_date,
        rev, created_at, updated_at)
      VALUES (@id, @project_id, @name, @sort_order,
        @planned_start_date, @planned_end_date, NULL, NULL,
        1, @now, @now)
    `).run({
      id: newId,
      project_id: projectId,
      name: init.name ?? '新里程碑',
      sort_order: newSortOrder,
      planned_start_date: init.planned_start_date,
      planned_end_date: init.planned_end_date,
      now,
    });
  })();
  return getMilestone(newId);
}

export function updateMilestone(id, patch, reason = '', expectedRev = null) {
  const touchesPlanned = Object.keys(patch).some(k => PLANNED_FIELDS.has(k));
  if (touchesPlanned && !reason.trim()) {
    throw new Error(`planned 字段修改必须填写原因 (milestone: ${id})`);
  }

  const db = getDb();
  const m = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  if (!m) throw new Error(`Milestone not found: ${id}`);

  // Optimistic concurrency: the client echoes the rev it last read. If the row
  // has been bumped since (another editor saved first), reject so they re-sync.
  if (expectedRev != null && m.rev !== expectedRev) throw revConflict();

  if (patch.actual_end_date != null) {
    const prev = db.prepare(`
      SELECT * FROM milestones
      WHERE project_id = ? AND sort_order < ?
      ORDER BY sort_order DESC LIMIT 1
    `).get(m.project_id, m.sort_order);
    if (prev?.actual_end_date) {
      if (new Date(patch.actual_end_date) < new Date(prev.actual_end_date)) {
        throw new Error(
          `actual_end_date (${patch.actual_end_date}) 不能早于上一里程碑的 actual_end_date (${prev.actual_end_date})`
        );
      }
    }
  }

  const now = new Date().toISOString();
  const allowedFields = ['name', 'planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date'];

  db.transaction(() => {
    const sets = Object.keys(patch)
      .filter(k => allowedFields.includes(k))
      .map(k => `${k} = @${k}`);
    if (sets.length) {
      sets.push('updated_at = @now', 'rev = rev + 1');
      db.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = @id`)
        .run({ ...patch, id, now });
    }
    for (const [field, newValue] of Object.entries(patch)) {
      if (!allowedFields.includes(field)) continue;
      const oldValue = m[field] ?? null;
      db.prepare(`
        INSERT INTO milestone_change_logs (id, milestone_id, field, old_value, new_value, reason, changed_at)
        VALUES (@id, @milestone_id, @field, @old_value, @new_value, @reason, @changed_at)
      `).run({
        id: uid('CL'),
        milestone_id: id,
        field,
        old_value: oldValue === null ? null : String(oldValue),
        new_value: newValue === null ? null : String(newValue),
        reason: PLANNED_FIELDS.has(field) ? reason.trim() : (reason.trim() || ''),
        changed_at: now,
      });
    }
  })();

  return getMilestone(id);
}

export function removeMilestone(id) {
  const db = getDb();
  const m = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  if (!m) throw new Error(`Milestone not found: ${id}`);
  if (m.actual_start_date || m.actual_end_date) {
    throw new Error(`里程碑「${m.name}」已有实际日期记录，无法删除。如需移除请先清除实际日期。`);
  }
  db.prepare('DELETE FROM milestones WHERE id = ?').run(id);
}

export function reorderMilestones(projectId, newOrder) {
  const db = getDb();
  const peers = db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(projectId);
  const byId = Object.fromEntries(peers.map(x => [x.id, x]));

  if (newOrder.length !== peers.length) {
    throw new Error('reorderMilestones: newOrder length mismatch');
  }

  let lastActualEnd = null;
  for (const id of newOrder) {
    const m = byId[id];
    if (!m) throw new Error(`Unknown milestone id in newOrder: ${id}`);
    if (m.actual_end_date) {
      if (lastActualEnd && new Date(m.actual_end_date) < new Date(lastActualEnd)) {
        throw new Error(
          `重排后「${m.name}」的实际完成日期 (${m.actual_end_date}) 早于前序里程碑 (${lastActualEnd})，请调整后重试。`
        );
      }
      lastActualEnd = m.actual_end_date;
    }
  }

  db.transaction(() => {
    newOrder.forEach((id, i) => {
      db.prepare('UPDATE milestones SET sort_order = ? WHERE id = ?').run(i + 1, id);
    });
  })();
}

export function insertMilestoneRaw(m) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO milestones (id, project_id, name, sort_order,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date,
      rev, created_at, updated_at)
    VALUES (@id, @project_id, @name, @sort_order,
      @planned_start_date, @planned_end_date, @actual_start_date, @actual_end_date,
      1, @created_at, @updated_at)
  `).run({
    id: m.id,
    project_id: m.projectId,
    name: m.name,
    sort_order: m.sortOrder,
    planned_start_date: m.planned_start_date ?? null,
    planned_end_date: m.planned_end_date,
    actual_start_date: m.actual_start_date ?? null,
    actual_end_date: m.actual_end_date ?? null,
    created_at: m.createdAt ?? now,
    updated_at: m.updatedAt ?? now,
  });
}

export function insertChangeLogRaw(cl) {
  const db = getDb();
  db.prepare(`
    INSERT INTO milestone_change_logs (id, milestone_id, field, old_value, new_value, reason, changed_at)
    VALUES (@id, @milestone_id, @field, @old_value, @new_value, @reason, @changed_at)
  `).run({
    id: cl.id,
    milestone_id: cl.milestoneId,
    field: cl.field,
    old_value: cl.oldValue ?? null,
    new_value: cl.newValue ?? null,
    reason: cl.reason ?? '',
    changed_at: cl.changedAt,
  });
}
