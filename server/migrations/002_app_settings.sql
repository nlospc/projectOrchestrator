-- PMO Orchestrator — operator settings (singleton row, rev-safe)
-- Safe to re-run: IF NOT EXISTS
CREATE TABLE IF NOT EXISTS app_settings (
  id         TEXT PRIMARY KEY DEFAULT 'singleton',
  payload    TEXT NOT NULL,   -- JSON document
  rev        INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
