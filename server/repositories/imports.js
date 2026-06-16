import { getDb } from '../db.js';

let _batchSeq = Date.now();
function batchId() {
  return `IB-${(++_batchSeq).toString(36)}`;
}

function recordBatch(db, kind, filename, rowCount, importedBy) {
  db.prepare(`
    INSERT INTO import_batches (id, kind, filename, row_count, imported_by, imported_at)
    VALUES (@id, @kind, @filename, @row_count, @imported_by, @imported_at)
  `).run({
    id: batchId(),
    kind,
    filename: filename ?? null,
    row_count: rowCount,
    imported_by: importedBy ?? 'PMO Admin',
    imported_at: new Date().toISOString(),
  });
}

/**
 * Full-replace the allocations table. Safe: allocations have no child rows.
 * `rows` are parsed resource rows ({ id, system, projectId, projectName,
 * complexity, status, role, person, timeRatio, cat, dept, biz, outsourced }).
 */
export function replaceAllocations(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO allocations (id, cat, dept, biz, system,
      project_key, project_name, complexity, status, role, person,
      outsourced, time_ratio, created_at, updated_at)
    VALUES (@id, @cat, @dept, @biz, @system,
      @project_key, @project_name, @complexity, @status, @role, @person,
      @outsourced, @time_ratio, @now, @now)
  `);
  db.transaction(() => {
    db.prepare('DELETE FROM allocations').run();
    for (const a of rows) {
      insert.run({
        id: a.id,
        cat: a.cat ?? null,
        dept: a.dept ?? null,
        biz: a.biz ?? null,
        system: a.system ?? null,
        project_key: a.projectId ?? null,
        project_name: a.projectName ?? null,
        complexity: a.complexity ?? null,
        status: a.status ?? null,
        role: a.role ?? null,
        person: a.person ?? null,
        outsourced: a.outsourced ? 1 : 0,
        time_ratio: a.timeRatio ?? null,
        now,
      });
    }
    recordBatch(db, 'resource', filename, rows.length, importedBy);
  })();
  return rows.length;
}

/**
 * Upsert projects by id. Preserves existing rows' milestones/comments
 * (we never delete projects here, so ON DELETE CASCADE never fires).
 * `rows` are parsed project rows ({ id, name, health, complexity, status,
 * pm, category, dept, biz, family, gate, init, level, product, tech, batch,
 * override }).
 */
export function upsertProjects(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
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
      @health, @override_health, @override_note, '', '',
      @gate, @complexity, @status, @init, @level, @pm, @product, @tech, @batch,
      0, 1, @now, @now
    )
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code, category = excluded.category, dept = excluded.dept,
      biz = excluded.biz, family = excluded.family, name = excluded.name,
      health = excluded.health, gate = excluded.gate, complexity = excluded.complexity,
      status = excluded.status, init = excluded.init, level = excluded.level,
      pm = excluded.pm, product = excluded.product, tech = excluded.tech,
      batch = excluded.batch, updated_at = @now, rev = projects.rev + 1
  `);
  db.transaction(() => {
    for (const p of rows) {
      upsert.run({
        id: p.id,
        code: p.code ?? null,
        category: p.category ?? null,
        dept: p.dept ?? null,
        biz: p.biz ?? null,
        family: p.family ?? null,
        name: p.name,
        summary: p.summary ?? null,
        owner_name: p.pm ?? null,
        owner_avatar: '👤',
        program_group: p.programGroup ?? null,
        planned_start_date: p.planned_start_date ?? null,
        planned_end_date: p.planned_end_date ?? null,
        health: p.health ?? null,
        override_health: p.override ?? '',
        override_note: p.overrideNote ?? '',
        gate: p.gate ?? null,
        complexity: p.complexity ?? null,
        status: p.status ?? null,
        init: p.init ?? null,
        level: p.level ?? null,
        pm: p.pm ?? null,
        product: p.product ?? null,
        tech: p.tech ?? null,
        batch: p.batch ?? null,
        now,
      });
    }
    recordBatch(db, 'project', filename, rows.length, importedBy);
  })();
  return rows.length;
}
