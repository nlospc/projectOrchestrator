/**
 * mutations.js — single write-path for all milestone and comment data.
 *
 * Each function does an optimistic local update first (instant UI response),
 * then persists via the REST API. On API failure the local change is rolled
 * back and the error is re-thrown so the shell.js try/catch → toast() shows it.
 *
 * v1.0: no auth; authorName is always "PMO Admin".
 */

import {
  milestoneChangeLogs,
  milestones,
  comments,
  projects,
  apiPatchMilestone,
  apiInsertMilestone,
  apiRemoveMilestone,
  apiReorderMilestones,
  apiAppendComment,
  apiPatchProject,
} from "./data-store.js";

const HEALTH_VALUES = new Set(["R", "Y", "G"]);

const PLANNED_FIELDS = new Set([
  "planned_start_date",
  "planned_end_date",
]);

let _nextId = Date.now();
function uid(prefix) {
  return `${prefix}-${(++_nextId).toString(36)}`;
}

function getMilestone(id) {
  const m = milestones.find((x) => x.id === id);
  if (!m) throw new Error(`Milestone not found: ${id}`);
  return m;
}

function prevMilestone(m) {
  const peers = milestones
    .filter((x) => x.projectId === m.projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = peers.findIndex((x) => x.id === m.id);
  return idx > 0 ? peers[idx - 1] : null;
}

/**
 * Update one or more fields on a milestone.
 * planned_* changes require a non-empty reason.
 * Optimistic: updates local cache instantly, then persists via API (rollback on failure).
 */
export async function updateMilestone(id, patch, reason = "") {
  const m = getMilestone(id);

  const touchesPlanned = Object.keys(patch).some((k) => PLANNED_FIELDS.has(k));
  if (touchesPlanned && !reason.trim()) {
    throw new Error(`planned 字段修改必须填写原因 (milestone: ${id})`);
  }

  if (patch.actual_end_date != null) {
    const prev = prevMilestone(m);
    if (prev?.actual_end_date) {
      if (new Date(patch.actual_end_date) < new Date(prev.actual_end_date)) {
        throw new Error(
          `actual_end_date (${patch.actual_end_date}) 不能早于上一里程碑的 actual_end_date (${prev.actual_end_date})`
        );
      }
    }
  }

  // Optimistic update
  const snapshot = { ...m };
  const now = new Date().toISOString();
  const addedLogs = [];
  for (const [field, newValue] of Object.entries(patch)) {
    const oldValue = m[field] ?? null;
    m[field] = newValue;
    const log = {
      id: uid("CL"),
      milestoneId: id,
      field,
      oldValue: oldValue === null ? null : String(oldValue),
      newValue: newValue === null ? null : String(newValue),
      reason: PLANNED_FIELDS.has(field) ? reason.trim() : (reason.trim() || ""),
      changedAt: now,
    };
    milestoneChangeLogs.push(log);
    addedLogs.push(log);
  }
  m.updatedAt = now;

  try {
    await apiPatchMilestone(id, patch, reason, snapshot.rev);
  } catch (err) {
    // Rollback
    Object.assign(m, snapshot);
    for (const log of addedLogs) {
      const i = milestoneChangeLogs.indexOf(log);
      if (i !== -1) milestoneChangeLogs.splice(i, 1);
    }
    throw err;
  }
}

/**
 * Insert a new milestone after `afterId` (null = append).
 * Delegates fully to the API — server returns authoritative sort orders.
 */
export async function insertMilestone(projectId, afterId, init) {
  if (!init.planned_start_date || !init.planned_end_date) {
    throw new Error("insertMilestone requires planned_start_date and planned_end_date");
  }
  return await apiInsertMilestone(projectId, afterId, init);
}

/**
 * Remove a milestone. Blocked if actual dates are present.
 */
export async function removeMilestone(id) {
  const m = getMilestone(id);
  if (m.actual_start_date || m.actual_end_date) {
    throw new Error(
      `里程碑「${m.name}」已有实际日期记录，无法删除。如需移除请先清除实际日期。`
    );
  }
  const idx = milestones.indexOf(m);
  milestones.splice(idx, 1);
  try {
    await apiRemoveMilestone(id);
  } catch (err) {
    milestones.splice(idx, 0, m);
    throw err;
  }
}

/**
 * Reorder milestones within a project. Dry-runs before applying.
 */
export async function reorderMilestones(projectId, newOrder) {
  const peers = milestones.filter((x) => x.projectId === projectId);
  const byId = Object.fromEntries(peers.map((x) => [x.id, x]));

  if (newOrder.length !== peers.length) {
    throw new Error("reorderMilestones: newOrder length mismatch");
  }

  let lastActualEnd = null;
  for (const id of newOrder) {
    const m = byId[id];
    if (!m) throw new Error(`Unknown milestone id in newOrder: ${id}`);
    if (m.actual_end_date) {
      if (lastActualEnd && new Date(m.actual_end_date) < new Date(lastActualEnd)) {
        throw new Error(
          `重排后「${m.name}」的实际完成日期 (${m.actual_end_date}) 早于前序里程碑 (${lastActualEnd})，请调整后重试。`
        );
      }
      lastActualEnd = m.actual_end_date;
    }
  }

  // Optimistic apply
  const prevOrders = peers.map(p => ({ id: p.id, sortOrder: p.sortOrder }));
  newOrder.forEach((id, i) => { byId[id].sortOrder = i + 1; });

  try {
    await apiReorderMilestones(projectId, newOrder);
  } catch (err) {
    for (const { id, sortOrder } of prevOrders) byId[id].sortOrder = sortOrder;
    throw err;
  }
}

/**
 * Append a comment to a project.
 */
export async function appendComment(projectId, body, authorName = "PMO Admin") {
  if (!body.trim()) throw new Error("评论内容不能为空");
  const optimistic = {
    id: uid("CM"),
    projectId,
    body: body.trim(),
    authorName,
    createdAt: new Date().toISOString(),
  };
  comments.push(optimistic);
  try {
    const confirmed = await apiAppendComment(projectId, body, authorName);
    const idx = comments.indexOf(optimistic);
    if (idx !== -1) comments[idx] = confirmed;
  } catch (err) {
    const idx = comments.indexOf(optimistic);
    if (idx !== -1) comments.splice(idx, 1);
    throw err;
  }
}

/**
 * Set (or clear) a project's manual health override.
 * `overrideHealth` is "R" | "Y" | "G", or "" to clear the override.
 * Optimistic: updates local cache instantly, then persists via API (rollback on failure).
 */
export async function setProjectOverride(projectId, overrideHealth, note = "", by = "PMO Admin") {
  const p = projects.find((x) => x.id === projectId);
  if (!p) throw new Error(`Project not found: ${projectId}`);
  const value = (overrideHealth || "").trim();
  if (value && !HEALTH_VALUES.has(value)) {
    throw new Error(`无效的覆盖健康度: ${value}（应为 R / Y / G）`);
  }

  // Optimistic update — cache uses `override` / `overrideNote`; DB uses the
  // override_* column names (see server/repositories/projects.js rowToProject).
  const snapshot = { override: p.override, overrideNote: p.overrideNote, rev: p.rev };
  const at = value ? new Date().toISOString() : "";
  p.override = value;
  p.overrideNote = value ? note.trim() : "";

  try {
    await apiPatchProject(projectId, {
      override_health: value,
      override_note: value ? note.trim() : "",
      override_by: value ? by : "",
      override_at: at,
    }, snapshot.rev);
  } catch (err) {
    Object.assign(p, snapshot);
    throw err;
  }
}
