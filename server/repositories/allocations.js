import { getDb } from '../db.js';

function rowToAllocation(row) {
  return {
    id: row.id,
    cat: row.cat,
    dept: row.dept,
    biz: row.biz,
    system: row.system,
    projectId: row.project_key,
    projectName: row.project_name,
    complexity: row.complexity,
    status: row.status,
    role: row.role,
    person: row.person,
    outsourced: row.outsourced === 1,
    timeRatio: row.time_ratio,
  };
}

export function listAllocations() {
  const db = getDb();
  return db.prepare('SELECT * FROM allocations ORDER BY id').all().map(rowToAllocation);
}

export function insertAllocationRaw(a) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO allocations (id, cat, dept, biz, system,
      project_key, project_name, complexity, status, role, person,
      outsourced, time_ratio, created_at, updated_at)
    VALUES (@id, @cat, @dept, @biz, @system,
      @project_key, @project_name, @complexity, @status, @role, @person,
      @outsourced, @time_ratio, @now, @now)
  `).run({
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
