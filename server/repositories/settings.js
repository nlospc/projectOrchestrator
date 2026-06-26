import { getDb, revConflict } from '../db.js';
import { DEFAULT_SETTINGS } from '../../src/config/settings-defaults.js';

function rowToSettings(row) {
  return {
    payload: JSON.parse(row.payload),
    rev: row.rev,
    updatedAt: row.updated_at,
  };
}

export function getSettings() {
  const db = getDb();
  const row = db.prepare('SELECT * FROM app_settings WHERE id = ?').get('singleton');
  if (!row) return { payload: DEFAULT_SETTINGS, rev: 0, updatedAt: null };
  return rowToSettings(row);
}

export function saveSettings(payload, clientRev) {
  const db = getDb();
  const existing = db.prepare('SELECT rev FROM app_settings WHERE id = ?').get('singleton');
  const currentRev = existing?.rev ?? 0;

  if (clientRev !== currentRev) throw revConflict();

  const nextRev = currentRev + 1;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO app_settings (id, payload, rev, updated_at)
    VALUES ('singleton', @payload, @rev, @updated_at)
    ON CONFLICT(id) DO UPDATE SET payload = @payload, rev = @rev, updated_at = @updated_at
  `).run({ payload: JSON.stringify(payload), rev: nextRev, updated_at: now });

  return { payload, rev: nextRev, updatedAt: now };
}

export function seedDefaultSettings() {
  const db = getDb();
  const exists = db.prepare('SELECT id FROM app_settings WHERE id = ?').get('singleton');
  if (exists) return;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO app_settings (id, payload, rev, updated_at) VALUES ('singleton', @payload, 1, @updated_at)
  `).run({ payload: JSON.stringify(DEFAULT_SETTINGS), updated_at: now });
}
