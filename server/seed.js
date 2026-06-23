/**
 * Seeds the DB from mock-data.js on first boot or when SEED_VERSION changes.
 * Bump SEED_VERSION whenever mock-data.js content changes so that existing
 * deployments automatically re-seed on next server start.
 */
import { getDb } from './db.js';
import { insertProject } from './repositories/projects.js';
import { insertMilestoneRaw, insertChangeLogRaw } from './repositories/milestones.js';
import { insertCommentRaw } from './repositories/comments.js';
import { insertAllocationRaw } from './repositories/allocations.js';
import {
  projects,
  milestones,
  milestoneChangeLogs,
  comments,
  allocations,
} from '../src/data/mock-data.js';

const SEED_VERSION = 2;

export function seedIfEmpty() {
  const db = getDb();

  db.exec(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`);

  const row = db.prepare(`SELECT value FROM _meta WHERE key = 'seed_version'`).get();
  const currentVersion = row ? Number(row.value) : 0;

  if (currentVersion >= SEED_VERSION) return;

  const hasData = db.prepare('SELECT COUNT(*) as n FROM projects').get().n > 0;

  if (hasData) {
    console.log(`[seed] Seed version changed (${currentVersion} → ${SEED_VERSION}), re-seeding …`);
    db.exec(`DELETE FROM allocations`);
    db.exec(`DELETE FROM comments`);
    db.exec(`DELETE FROM milestone_change_logs`);
    db.exec(`DELETE FROM milestones`);
    db.exec(`DELETE FROM projects`);
  } else {
    console.log('[seed] First boot — seeding database from mock-data.js …');
  }

  db.transaction(() => {
    for (const p of projects) insertProject(p);
    for (const m of milestones) insertMilestoneRaw(m);
    for (const cl of milestoneChangeLogs) insertChangeLogRaw(cl);
    for (const c of comments) insertCommentRaw(c);
    for (const a of allocations) insertAllocationRaw(a);

    db.prepare(`INSERT OR REPLACE INTO _meta (key, value) VALUES ('seed_version', ?)`)
      .run(String(SEED_VERSION));
  })();

  console.log(`[seed] Done (v${SEED_VERSION}) — ${projects.length} projects, ${milestones.length} milestones, ${allocations.length} allocations`);
}
