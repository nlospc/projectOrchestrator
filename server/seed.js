/**
 * Seeds the DB from mock-data.js on first boot (only if projects table is empty).
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

export function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM projects').get().n;
  if (count > 0) return;

  console.log('[seed] Seeding database from mock-data.js …');

  db.transaction(() => {
    for (const p of projects) insertProject(p);
    for (const m of milestones) insertMilestoneRaw(m);
    for (const cl of milestoneChangeLogs) insertChangeLogRaw(cl);
    for (const c of comments) insertCommentRaw(c);
    for (const a of allocations) insertAllocationRaw(a);
  })();

  console.log(`[seed] Done — ${projects.length} projects, ${milestones.length} milestones, ${allocations.length} allocations`);
}
