import { getDb, revConflict } from '../db.js';

function rowToProject(row) {
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    dept: row.dept,
    biz: row.biz,
    family: row.family,
    name: row.name,
    summary: row.summary,
    owner: { name: row.owner_name, avatar: row.owner_avatar ?? '👤' },
    programGroup: row.program_group ?? null,
    planned_start_date: row.planned_start_date,
    planned_end_date: row.planned_end_date,
    health: row.health,
    override: row.override_health ?? '',
    overrideNote: row.override_note ?? '',
    gate: row.gate,
    complexity: row.complexity,
    status: row.status,
    init: row.init,
    level: row.level,
    pm: row.pm,
    product: row.product,
    tech: row.tech,
    batch: row.batch,
    archived: row.archived === 1,
    rev: row.rev,
  };
}

export function listProjects() {
  const db = getDb();
  return db.prepare('SELECT * FROM projects ORDER BY id').all().map(rowToProject);
}

export function getProject(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return row ? rowToProject(row) : null;
}

export function insertProject(p) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO projects (
      id, code, category, dept, biz, family, name, summary,
      owner_name, owner_avatar, program_group,
      planned_start_date, planned_end_date,
      health, override_health, override_note, override_by, override_at,
      gate, complexity, status, init, level, pm, product, tech, batch,
      archived, rev, created_at, updated_at
    ) VALUES (
      @id, @code, @category, @dept, @biz, @family, @name, @summary,
      @owner_name, @owner_avatar, @program_group,
      @planned_start_date, @planned_end_date,
      @health, @override_health, @override_note, @override_by, @override_at,
      @gate, @complexity, @status, @init, @level, @pm, @product, @tech, @batch,
      @archived, 1, @created_at, @updated_at
    )
  `).run({
    id: p.id,
    code: p.code ?? null,
    category: p.category ?? null,
    dept: p.dept ?? null,
    biz: p.biz ?? null,
    family: p.family ?? null,
    name: p.name,
    summary: p.summary ?? null,
    owner_name: p.owner?.name ?? null,
    owner_avatar: p.owner?.avatar ?? '👤',
    program_group: p.programGroup ?? null,
    planned_start_date: p.planned_start_date ?? null,
    planned_end_date: p.planned_end_date ?? null,
    health: p.health ?? null,
    override_health: p.override ?? '',
    override_note: p.overrideNote ?? '',
    override_by: '',
    override_at: '',
    gate: p.gate ?? null,
    complexity: p.complexity ?? null,
    status: p.status ?? null,
    init: p.init ?? null,
    level: p.level ?? null,
    pm: p.pm ?? null,
    product: p.product ?? null,
    tech: p.tech ?? null,
    batch: p.batch ?? null,
    archived: p.archived ? 1 : 0,
    created_at: now,
    updated_at: now,
  });
}

export function patchProject(id, patch, expectedRev = null) {
  const db = getDb();
  const now = new Date().toISOString();

  // Optimistic concurrency: reject if the row was bumped since the client read it.
  const current = db.prepare('SELECT rev FROM projects WHERE id = ?').get(id);
  if (!current) return null;
  if (expectedRev != null && current.rev !== expectedRev) throw revConflict();

  const allowed = ['health', 'override_health', 'override_note', 'override_by', 'override_at',
    'status', 'archived', 'planned_start_date', 'planned_end_date'];
  const sets = Object.keys(patch)
    .filter(k => allowed.includes(k))
    .map(k => `${k} = @${k}`);
  if (!sets.length) return null;
  sets.push('updated_at = @updated_at', 'rev = rev + 1');
  db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = @id`)
    .run({ ...patch, id, updated_at: now });
  return getProject(id);
}
