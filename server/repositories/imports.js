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
 * Full-replace projects from the upload file. Deleting projects intentionally
 * cascades to milestones/comments so the uploaded master data is authoritative.
 * `rows` are parsed project rows ({ id, name, health, complexity, status,
 * pm, category, dept, biz, family, gate, init, level, product, tech, batch,
 * override }).
 */
export function replaceProjects(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO projects (
      id, code, category, dept, biz, family, name, summary,
      owner_name, owner_avatar, program_group,
      planned_start_date, planned_end_date,
      health, override_health, override_note, override_by, override_at,
      gate, complexity, status, init, level, pm, product, tech, batch,
      extras, archived, rev, created_at, updated_at
    ) VALUES (
      @id, @code, @category, @dept, @biz, @family, @name, @summary,
      @owner_name, @owner_avatar, @program_group,
      @planned_start_date, @planned_end_date,
      @health, @override_health, @override_note, '', '',
      @gate, @complexity, @status, @init, @level, @pm, @product, @tech, @batch,
      @extras, 0, 1, @now, @now
    )
  `);
  db.transaction(() => {
    db.prepare('DELETE FROM projects').run();
    for (const p of rows) {
      insert.run({
        id: p.id,
        code: p.code ?? null,
        category: p.category ?? null,
        dept: p.dept ?? null,
        biz: p.biz ?? null,
        family: p.family ?? null,
        name: p.name,
        summary: p.summary ?? null,
        owner_name: p.product ?? p.pm ?? null,
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
        extras: p.extras != null ? JSON.stringify(p.extras) : null,
        now,
      });
    }
    recordBatch(db, 'project', filename, rows.length, importedBy);
  })();
  return rows.length;
}

/**
 * Full-replace milestones from the upload file. CSV order becomes the
 * milestone order within each project.
 */
export function replaceMilestones(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO milestones (id, project_id, name, sort_order,
      planned_start_date, planned_end_date, actual_start_date, actual_end_date,
      rev, created_at, updated_at)
    VALUES (@id, @project_id, @name, @sort_order,
      @planned_start_date, @planned_end_date, @actual_start_date, @actual_end_date,
      1, @now, @now)
  `);

  db.transaction(() => {
    db.prepare('DELETE FROM milestones').run();
    const nextOrderByProject = new Map();
    for (const m of rows) {
      const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(m.projectId);
      if (!project) throw new Error(`Project ${m.projectId} does not exist`);
      const sortOrder = nextOrderByProject.get(m.projectId) || 1;
      nextOrderByProject.set(m.projectId, sortOrder + 1);
      insert.run({
        id: m.id,
        project_id: m.projectId,
        name: m.name,
        sort_order: sortOrder,
        planned_start_date: m.planned_start_date ?? null,
        planned_end_date: m.planned_end_date,
        actual_start_date: m.actual_start_date || null,
        actual_end_date: m.actual_end_date || null,
        now,
      });
    }
    recordBatch(db, 'milestone', filename, rows.length, importedBy);
  })();
  return rows.length;
}

/**
 * Full-replace PMO health overrides by clearing all existing overrides first,
 * then applying the rows in the upload file.
 */
export function replaceProjectOverrides(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const update = db.prepare(`
    UPDATE projects SET
      override_health = @override_health,
      override_note = @override_note,
      override_by = @override_by,
      override_at = @override_at,
      updated_at = @now,
      rev = rev + 1
    WHERE id = @id
  `);

  db.transaction(() => {
    db.prepare(`
      UPDATE projects SET
        override_health = '',
        override_note = '',
        override_by = '',
        override_at = '',
        updated_at = @now,
        rev = rev + 1
    `).run({ now });
    for (const row of rows) {
      const result = update.run({
        id: row.projectId,
        override_health: row.override,
        override_note: row.overrideNote ?? '',
        override_by: row.updatedBy || importedBy || 'PMO Admin',
        override_at: row.updatedAt ? `${row.updatedAt}T00:00:00.000Z` : now,
        now,
      });
      if (result.changes === 0) throw new Error(`Project ${row.projectId} does not exist`);
    }
    recordBatch(db, 'override', filename, rows.length, importedBy);
  })();
  return rows.length;
}
