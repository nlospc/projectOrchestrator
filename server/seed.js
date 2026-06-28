import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';
import { syncAllocationPersonMetadata, upsertPersonInfoRows } from './repositories/person-info.js';
import { seedDefaultSettings } from './repositories/settings.js';
import { parseUserInfoCsv } from '../src/core/importers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USER_INFO_PATH = join(__dirname, '../docs/template/user_info.csv');

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

  seedDefaultSettings();
  const peopleCount = upsertPersonInfoRows(seedPeople);
  const allocationMatches = syncAllocationPersonMetadata(seedPeople);
  console.log(`[seed] Person info synced — ${peopleCount} people, ${allocationMatches} allocation rows matched`);
}
