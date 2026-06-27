import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/pmo.sqlite');

let _db;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      _db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (err) {
      // ALTER TABLE ADD COLUMN fails if column already exists; safe to ignore.
      if (!err.message.includes('duplicate column name')) throw err;
    }
  }
  return _db;
}

/**
 * Build an optimistic-concurrency conflict error. The route layer maps any
 * error carrying `code === 'REV_CONFLICT'` to HTTP 409 with that code so the
 * frontend can tell a stale-write conflict apart from a validation failure
 * and re-sync instead of just toasting.
 */
export function revConflict(message = '数据已被他人修改，请刷新后重试') {
  const err = new Error(message);
  err.code = 'REV_CONFLICT';
  return err;
}
