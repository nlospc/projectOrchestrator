-- project_links: resource initiative ↔ canonical project reconciliation registry
-- Safe to re-run: CREATE TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS project_links (
  id            TEXT PRIMARY KEY,
  resource_key  TEXT NOT NULL,
  project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'proposed',
  match_source  TEXT NOT NULL DEFAULT 'auto',
  confidence    REAL,
  candidate_json TEXT,
  confirmed_by  TEXT,
  confirmed_at  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(resource_key)
);
CREATE INDEX IF NOT EXISTS idx_links_project ON project_links(project_id);
CREATE INDEX IF NOT EXISTS idx_links_status  ON project_links(status);
