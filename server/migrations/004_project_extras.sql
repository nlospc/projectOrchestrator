-- PMO Orchestrator — project extras column
-- Stores unmapped project_info fields as a JSON blob.
-- Idempotency handled by db.js catching "duplicate column name" on ALTER TABLE.
ALTER TABLE projects ADD COLUMN extras TEXT;
