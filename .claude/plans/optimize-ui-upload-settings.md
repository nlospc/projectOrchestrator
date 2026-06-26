# Plan: Optimize #upload & #settings for operator ease-of-use

**Source**: free-form request — "optimize UI of #upload and #setting for system operator; design mock by claude-design; execute by /codex:rescue; Claude reviews & audits"
**Complexity**: Medium (settings now persists → touches server/DB layer)
**Decided with user**: (1) settings gets **real persistence**; (2) mojibake toast fix is **step 1**.

## Summary
Make the two operator-facing views genuinely easy to use. `#upload` gets a guided
workflow (numbered steps, clearer status, kind-tagged history). `#settings` becomes
**functional** — values load from and save to a new `app_settings` table via a
rev-safe API, with each control honestly tagged "影响计算" (drives engine) or "仅记录"
(stored only). First fix the corrupted toast strings.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Repo | `server/repositories/comments.js` | `getDb()`, `rowToX` mapper, prepared statements |
| Route | `server/routes/comments.js` | Router, try/catch → 500, 409 on conflict |
| Concurrency | `server/db.js:revConflict` | optimistic rev → HTTP 409 `REV_CONFLICT` → client re-sync |
| Bootstrap | `server/routes/bootstrap.js` | aggregate read payload; add `settings` key |
| Migration | `server/migrations/001_init.sql` | `CREATE TABLE IF NOT EXISTS` idempotent DDL |
| Seed defaults | `server/seed.js` imports `src/data/mock-data.js` | server may import from `src/` |
| Client API | `src/core/data-store.js` | `apiPatch*`, `bootstrap()` repopulates caches |
| View | `src/views/admin.js` | template-literal view fns, `escapeHtml`, `badge` |

## Migration approach
`server/db.js` currently execs only `001_init.sql`. Evolve it to read **all** `migrations/*.sql`
sorted, then add `002_app_settings.sql`. (Correct versioned pattern; ~3-line db.js change.)

## Settings storage shape (singleton document + rev)
```
app_settings ( id TEXT PK DEFAULT 'singleton', payload TEXT (JSON), rev INTEGER, updated_at TEXT )
```
One cohesive document edited on one page → JSON blob is KISS. `payload` shape (synthetic defaults):
```
{
  healthRules:   { redRule, yellowRule, overridePriority, deviationDays },   // deviationDays live-applies
  loadThresholds:{ low: 0.6, mid: 1.2, bfRisk: 1, bfTarget: 3 },             // live-applies (defaults = canonical)
  milestoneTemplates: [ { name, type, active } ],                            // store+restore
  templateFields:{ projectRequired, resourceRequired }                       // store+restore only
}
```
Defaults live in new `src/config/settings-defaults.js` (single source; seeded on first boot).

## Persistence depth — RECOMMENDED (confirm or adjust)
| Control group | Depth | Rationale |
|---|---|---|
| Load thresholds (low/mid) | **Live-apply** | `loadClass` reads settings; defaults = canonical 0.6/1.2 → no behavior change. Amend `data-sequences.md §2` to note "operator-configurable, canonical default". |
| Bus-factor risk/target | **Live-apply** | self-contained in `busFactorRows` |
| Deviation days (default 7) | **Live-apply** | self-contained in segment/health calc |
| Milestone template names | **Store + restore** | feeds `milestoneNames`; live-wiring to new-milestone deferred |
| Health red/yellow rule dropdowns, override priority, required-field textareas | **Store + restore only** | honoring prose rules needs a rule-engine branch = separate spec |
| grade/health/gate definition tables | **Read-only reference** | unchanged; canonical reference |

Each UI control group is tagged **「影响计算」** or **「仅记录」** so the operator knows what each does — turns the limitation into honest guidance.

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/ui/shell.js` | UPDATE | **Step 1**: fix mojibake toasts (`mock-upload`, `save-settings`, `add-milestone-template`); wire `save-settings` → `apiSaveSettings` |
| `server/migrations/002_app_settings.sql` | CREATE | settings table |
| `server/db.js` | UPDATE | run all `migrations/*.sql` sorted |
| `server/repositories/settings.js` | CREATE | `getSettings()`, `saveSettings(payload, rev)` (rev-safe) |
| `server/routes/settings.js` | CREATE | `GET /api/settings`, `PUT /api/settings` |
| `server/routes/bootstrap.js` | UPDATE | add `settings` to payload |
| `server/seed.js` | UPDATE | seed default settings row on first boot |
| `server/index.js` | UPDATE | register `settingsRouter` |
| `src/config/settings-defaults.js` | CREATE | default settings document (shared by seed + client) |
| `src/core/data-store.js` | UPDATE | `settings` cache + `apiSaveSettings`; populate from bootstrap |
| `src/core/utils.js` | UPDATE | `loadClass` reads thresholds from settings (canonical fallback) |
| `src/views/admin.js` | UPDATE | rewrite `uploadView()` (workflow steps, kind badges) + `settingsView()` (bound inputs, tags, real save) |
| `styles.css` | UPDATE | new classes only: `.upload-step-pills`, `.upload-slot-icon`, `.history-kind-badge`, `.settings-section-sep`, `.settings-tag`, `.settings-save-bar` |
| `docs/data-sequences.md` | UPDATE | note thresholds now operator-configurable, canonical defaults |

## Slices (Codex execution order)
1. **S0 — toast fix** (`shell.js` strings only). Tiny, own commit.
2. **S1 — backend persistence**: migration, db.js, repo, route, bootstrap, seed, defaults. Self-contained; testable via curl before any UI.
3. **S2 — client wiring**: data-store cache + `apiSaveSettings`; `utils.loadClass` reads settings.
4. **S3 — #settings view**: bind inputs to `state.settings`, add tags, real save bar.
5. **S4 — #upload view**: workflow steps, status polish, kind-tagged history (no logic change).
6. **S5 — CSS**: new classes for S3+S4.

## Design (claude-design mock)
Before S3/S4, produce a hi-fi HTML mock of both views; lock with user. S1/S2 (backend) can
start in parallel since they're behind the API and independent of final pixels.

## Validation
```bash
node server/index.js            # boots, runs both migrations, seeds settings
curl localhost:3000/api/settings            # returns seeded defaults + rev
curl -X PUT .../api/settings -d '{...}'     # 200 + bumped rev; stale rev → 409
curl localhost:3000/api/bootstrap | jq .settings   # present
# chrome-devtools: screenshot #upload + #settings at 1280 & 1180; edit a threshold, save, reload → persists
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Live threshold edit silently changes every resource view | Med | Defaults = canonical (no change until operator edits); "影响计算" tag warns; doc amended |
| Operator edits prose rule but engine ignores it | Med | "仅记录" tag is explicit; no false implication of effect |
| db.js multi-migration change breaks boot | Low | `IF NOT EXISTS` idempotent; test boot on fresh + existing `pmo.sqlite` |
| Codex touches engine logic in a view slice | Med | S3/S4 specs say "no engine change"; engine change isolated to S2 |
| Settings save race (multi-user) | Low | rev-based 409 → `pmo:stale` re-sync, mirrors existing pattern |

## Acceptance
- [ ] Mojibake toasts read correct Chinese
- [ ] Settings persist across reload; rev conflict → 409 + re-sync
- [ ] Editing load threshold changes resource view classification; default leaves it identical
- [ ] Each settings control tagged 影响计算 / 仅记录
- [ ] #upload shows numbered workflow + kind-tagged history; all imports/exports still fire
- [ ] No layout overflow at 1280/1180; `code-reviewer` no HIGH findings
- [ ] `data-sequences.md` reflects configurable thresholds
