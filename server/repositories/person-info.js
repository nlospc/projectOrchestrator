import { getDb } from '../db.js';

export function listPersonInfo() {
  return getDb()
    .prepare('SELECT name, role, outsourced, updated_at as updatedAt FROM person_info ORDER BY name')
    .all()
    .map((r) => ({ ...r, outsourced: r.outsourced === 1 }));
}

export function upsertPerson({ name, role, outsourced }) {
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT OR REPLACE INTO person_info (name, role, outsourced, updated_at) VALUES (@name, @role, @outsourced, @now)')
    .run({ name, role: role ?? '', outsourced: outsourced ? 1 : 0, now });
  return { name, role: role ?? '', outsourced: !!outsourced, updatedAt: now };
}

export function deletePerson(name) {
  const info = getDb().prepare('DELETE FROM person_info WHERE name = ?').run(name);
  return info.changes > 0;
}

export function replacePersonInfo(rows, filename, importedBy) {
  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(
    'INSERT OR REPLACE INTO person_info (name, role, outsourced, updated_at) VALUES (@name, @role, @outsourced, @now)'
  );
  db.transaction(() => {
    db.prepare('DELETE FROM person_info').run();
    for (const r of rows) {
      insert.run({ name: r.name, role: r.role ?? '', outsourced: r.outsourced ? 1 : 0, now });
    }
    db.prepare(`
      INSERT INTO import_batches (id, kind, filename, row_count, imported_by, imported_at)
      VALUES (@id, @kind, @filename, @row_count, @imported_by, @imported_at)
    `).run({
      id: `IB-${Date.now().toString(36)}`,
      kind: 'person_info',
      filename: filename ?? null,
      row_count: rows.length,
      imported_by: importedBy ?? 'PMO Admin',
      imported_at: now,
    });
  })();
  return rows.length;
}
