/**
 * mutations.js — single write-path for all milestone and comment data.
 *
 * ALL UI code must go through these exports. Direct assignment to
 * milestone.planned_* or milestone.actual_* fields is a bug (no audit trail).
 *
 * // TODO(audit): PR review checklist — grep for `milestone\.planned_` or
 * // `milestone\.actual_` followed by `=` outside this file and mock-data.js.
 *
 * v1.0 identity: no auth system. authorName is always "PMO Admin".
 * changedBy is intentionally absent from milestoneChangeLogs (deferred to v1.1).
 */

import { milestoneChangeLogs, milestones, comments } from "../data/mock-data.js";

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
 * Any change to a `planned_*` field requires a non-empty reason.
 *
 * @param {string} id
 * @param {object} patch
 * @param {string} reason  — required when patch touches planned_* fields
 * @throws {Error} if reason is empty for planned_* changes
 * @throws {Error} if actual_end_date would precede previous milestone's actual_end_date
 */
export function updateMilestone(id, patch, reason = "") {
  const m = getMilestone(id);

  const touchesPlanned = Object.keys(patch).some((k) => PLANNED_FIELDS.has(k));
  if (touchesPlanned && !reason.trim()) {
    throw new Error(`planned 字段修改必须填写原因 (milestone: ${id})`);
  }

  // actual_end_date ordering check
  if (patch.actual_end_date != null) {
    const prev = prevMilestone(m);
    if (prev?.actual_end_date) {
      const prevEnd = new Date(prev.actual_end_date);
      const newEnd = new Date(patch.actual_end_date);
      if (newEnd < prevEnd) {
        throw new Error(
          `actual_end_date (${patch.actual_end_date}) 不能早于上一里程碑的 actual_end_date (${prev.actual_end_date})`
        );
      }
    }
  }

  const now = new Date().toISOString();
  for (const [field, newValue] of Object.entries(patch)) {
    const oldValue = m[field] ?? null;
    m[field] = newValue;
    milestoneChangeLogs.push({
      id: uid("CL"),
      milestoneId: id,
      field,
      oldValue: oldValue === null ? null : String(oldValue),
      newValue: newValue === null ? null : String(newValue),
      reason: PLANNED_FIELDS.has(field) ? reason.trim() : (reason.trim() || ""),
      changedAt: now,
    });
  }
  m.updatedAt = now;
}

/**
 * Insert a new milestone into a project, after the milestone with id `afterId`.
 * Pass `afterId = null` to append at the end.
 *
 * @param {string}      projectId
 * @param {string|null} afterId
 * @param {object}      init  — must include planned_start_date and planned_end_date
 */
export function insertMilestone(projectId, afterId, init) {
  if (!init.planned_start_date || !init.planned_end_date) {
    throw new Error("insertMilestone requires planned_start_date and planned_end_date");
  }

  const peers = milestones
    .filter((x) => x.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const insertAfterIdx = afterId == null
    ? peers.length - 1
    : peers.findIndex((x) => x.id === afterId);

  const newSortOrder = insertAfterIdx < 0
    ? 1
    : (peers[insertAfterIdx]?.sortOrder ?? 0) + 1;

  // Shift sortOrder of milestones that follow the insertion point
  for (const peer of peers) {
    if (peer.sortOrder >= newSortOrder) {
      peer.sortOrder += 1;
    }
  }

  const now = new Date().toISOString();
  milestones.push({
    id: uid("M"),
    projectId,
    name: init.name ?? "新里程碑",
    sortOrder: newSortOrder,
    planned_start_date: init.planned_start_date,
    planned_end_date: init.planned_end_date,
    actual_start_date: null,
    actual_end_date: null,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Remove a milestone. Blocked if actual_start_date or actual_end_date is present.
 *
 * @param {string} id
 * @throws {Error} if milestone has any actual dates recorded
 */
export function removeMilestone(id) {
  const m = getMilestone(id);
  if (m.actual_start_date || m.actual_end_date) {
    throw new Error(
      `里程碑「${m.name}」已有实际日期记录，无法删除。如需移除请先清除实际日期。`
    );
  }
  const idx = milestones.indexOf(m);
  milestones.splice(idx, 1);
}

/**
 * Reorder milestones within a project. Dry-runs the new order against the
 * actual_end_date chain before applying. Throws on violation (blocks the drop).
 *
 * @param {string}   projectId
 * @param {string[]} newOrder  — ordered array of milestone ids
 * @throws {Error} if the new order violates the actual_end_date chain
 */
export function reorderMilestones(projectId, newOrder) {
  const peers = milestones.filter((x) => x.projectId === projectId);
  const byId = Object.fromEntries(peers.map((x) => [x.id, x]));

  if (newOrder.length !== peers.length) {
    throw new Error("reorderMilestones: newOrder length mismatch");
  }

  // Dry-run: validate actual_end_date chain in proposed new order
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

  // Apply — only reached if dry-run passed
  newOrder.forEach((id, i) => {
    byId[id].sortOrder = i + 1;
  });
}

/**
 * Append a comment to a project. No @mention parsing in v1.0.
 *
 * @param {string} projectId
 * @param {string} body
 * @param {string} [authorName]
 */
export function appendComment(projectId, body, authorName = "PMO Admin") {
  if (!body.trim()) throw new Error("评论内容不能为空");
  comments.push({
    id: uid("CM"),
    projectId,
    body: body.trim(),
    authorName,
    createdAt: new Date().toISOString(),
  });
}
