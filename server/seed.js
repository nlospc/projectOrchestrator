/**
 * Seeds the DB from mock-data.js on first boot or when SEED_VERSION changes.
 * Bump SEED_VERSION whenever mock-data.js content changes so that existing
 * deployments automatically re-seed on next server start.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import { insertProject } from './repositories/projects.js';
import { insertMilestoneRaw, insertChangeLogRaw } from './repositories/milestones.js';
import { insertCommentRaw } from './repositories/comments.js';
import { insertAllocationRaw } from './repositories/allocations.js';
import { syncAllocationPersonMetadata, upsertPersonInfoRows } from './repositories/person-info.js';
import { seedDefaultSettings } from './repositories/settings.js';
import { parseUserInfoCsv } from '../src/core/importers.js';
import {
  projects,
  milestones,
  milestoneChangeLogs,
  comments,
  allocations,
} from '../src/data/mock-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_INFO_PATH = join(__dirname, '../docs/template/user_info.csv');
const SEED_VERSION = 2;

function loadSeedPersonInfo() {
  const csv = readFileSync(USER_INFO_PATH, 'utf8');
  const parsed = parseUserInfoCsv(csv);
  if (parsed.errors.length) {
    const details = parsed.errors.map((e) => `row ${e.row} ${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid user_info.csv: ${details}`);
  }
  for (const warning of parsed.warnings) {
    console.warn(`[seed] user_info.csv row ${warning.row} ${warning.field}: ${warning.message}`);
  }
  return parsed.validRows;
}

export function seedIfEmpty() {
  const db = getDb();
  const seedPeople = loadSeedPersonInfo();

  db.exec(`CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`);

  const row = db.prepare(`SELECT value FROM _meta WHERE key = 'seed_version'`).get();
  const currentVersion = row ? Number(row.value) : 0;

  seedDefaultSettings();
  if (currentVersion >= SEED_VERSION) {
    const peopleCount = upsertPersonInfoRows(seedPeople);
    const allocationMatches = syncAllocationPersonMetadata(seedPeople);
    console.log(`[seed] Person info synced from user_info.csv - ${peopleCount} people, ${allocationMatches} allocation rows matched`);
    return;
  }

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
    upsertPersonInfoRows(seedPeople);
    syncAllocationPersonMetadata(seedPeople);

    db.prepare(`INSERT OR REPLACE INTO _meta (key, value) VALUES ('seed_version', ?)`)
      .run(String(SEED_VERSION));
  })();

  console.log(`[seed] Done (v${SEED_VERSION}) - ${projects.length} projects, ${milestones.length} milestones, ${allocations.length} allocations, ${seedPeople.length} people`);
}
