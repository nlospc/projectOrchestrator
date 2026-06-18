-- PMO Orchestrator — initial schema
-- Safe to re-run: all CREATE statements use IF NOT EXISTS

CREATE TABLE IF NOT EXISTS projects (
  id                 TEXT PRIMARY KEY,
  code               TEXT,
  category           TEXT,
  dept               TEXT,
  biz                TEXT,
  family             TEXT,
  name               TEXT NOT NULL,
  summary            TEXT,
  owner_name         TEXT,
  owner_avatar       TEXT,
  program_group      TEXT,
  planned_start_date TEXT,
  planned_end_date   TEXT,
  health             TEXT,
  override_health    TEXT NOT NULL DEFAULT '',
  override_note      TEXT NOT NULL DEFAULT '',
  override_by        TEXT NOT NULL DEFAULT '',
  override_at        TEXT NOT NULL DEFAULT '',
  gate               TEXT,
  complexity         INTEGER,
  status             TEXT,
  init               TEXT,
  level              TEXT,
  pm                 TEXT,
  product            TEXT,
  tech               TEXT,
  batch              TEXT,
  archived           INTEGER NOT NULL DEFAULT 0,
  rev                INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  sort_order         INTEGER NOT NULL,
  planned_start_date TEXT,
  planned_end_date   TEXT NOT NULL,
  actual_start_date  TEXT,
  actual_end_date    TEXT,
  rev                INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id, sort_order);

CREATE TABLE IF NOT EXISTS milestone_change_logs (
  id           TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  field        TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  reason       TEXT,
  changed_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_changelog_milestone ON milestone_change_logs(milestone_id, changed_at);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'PMO Admin',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id, created_at);

CREATE TABLE IF NOT EXISTS allocations (
  id           TEXT PRIMARY KEY,
  cat          TEXT,
  dept         TEXT,
  biz          TEXT,
  system       TEXT,
  project_key  TEXT,
  project_name TEXT,
  complexity   INTEGER,
  status       TEXT,
  role         TEXT,
  person       TEXT,
  outsourced   INTEGER NOT NULL DEFAULT 0,
  time_ratio   REAL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alloc_person ON allocations(person);
CREATE INDEX IF NOT EXISTS idx_alloc_project ON allocations(project_key);

CREATE TABLE IF NOT EXISTS import_batches (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,
  filename    TEXT,
  row_count   INTEGER,
  imported_by TEXT,
  imported_at TEXT NOT NULL
);
