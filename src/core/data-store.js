/**
 * Live runtime cache — populated by bootstrap() before app starts.
 * Views/selectors read these arrays; mutations update them optimistically.
 */

export const projects = [];
export const milestones = [];
export const milestoneChangeLogs = [];
export const comments = [];
export const allocations = [];
export const milestoneNames = [];

export async function bootstrap() {
  const res = await fetch('/api/bootstrap');
  if (!res.ok) throw new Error(`Bootstrap failed: ${res.status}`);
  const data = await res.json();

  projects.length = 0;
  projects.push(...data.projects);

  milestones.length = 0;
  milestones.push(...data.milestones);

  milestoneChangeLogs.length = 0;
  milestoneChangeLogs.push(...data.changeLogs);

  comments.length = 0;
  comments.push(...data.comments);

  allocations.length = 0;
  allocations.push(...data.allocations);

  milestoneNames.length = 0;
  milestoneNames.push(...[...new Set(data.milestones.map(m => m.name))]);
}

// ── API helpers called by mutations.js ───────────────────────────────────────

/**
 * Turn a non-ok response into an Error. A `REV_CONFLICT` (optimistic-concurrency
 * clash — someone else saved first) is flagged on the error AND broadcast as a
 * `pmo:stale` window event so the shell can re-sync the whole cache from the DB.
 */
async function readApiError(res) {
  const body = await res.json().catch(() => ({ error: res.statusText }));
  const err = new Error(body.error || res.statusText);
  if (body.code === 'REV_CONFLICT') {
    err.conflict = true;
    window.dispatchEvent(new CustomEvent('pmo:stale'));
  }
  return err;
}

export async function apiPatchMilestone(id, patch, reason, rev = null) {
  const res = await fetch(`/api/milestones/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch, reason, rev }),
  });
  if (!res.ok) throw await readApiError(res);
  const { milestone, changeLog } = await res.json();
  const idx = milestones.findIndex(m => m.id === id);
  if (idx !== -1) milestones[idx] = milestone;
  if (changeLog) {
    // `changeLog` is the authoritative set for THIS milestone's project only.
    // Replace just that project's logs in the global cache — keep every other
    // project's logs intact (otherwise editing project A wipes B's history).
    const projectId = milestone.projectId;
    const idsInProject = new Set(
      milestones.filter(m => m.projectId === projectId).map(m => m.id)
    );
    for (let i = milestoneChangeLogs.length - 1; i >= 0; i--) {
      if (idsInProject.has(milestoneChangeLogs[i].milestoneId)) {
        milestoneChangeLogs.splice(i, 1);
      }
    }
    milestoneChangeLogs.push(...changeLog);
  }
  return milestone;
}

export async function apiInsertMilestone(projectId, afterId, init) {
  const res = await fetch('/api/milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, afterId, ...init }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const { milestone } = await res.json();
  milestones.push(milestone);
  return milestone;
}

export async function apiRemoveMilestone(id) {
  const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
}

export async function apiReorderMilestones(projectId, order) {
  const res = await fetch(`/api/projects/${projectId}/milestone-order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
}

export async function apiAppendComment(projectId, body, authorName) {
  const res = await fetch(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, authorName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const { comment } = await res.json();
  comments.push(comment);
  return comment;
}

export async function apiImportProjects(rows, filename) {
  const res = await fetch('/api/import/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const { count } = await res.json();
  await bootstrap(); // refresh whole cache from authoritative DB
  return count;
}

export async function apiImportAllocations(rows, filename) {
  const res = await fetch('/api/import/allocations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, filename }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const { count } = await res.json();
  await bootstrap();
  return count;
}

export async function apiPatchProject(id, patch, rev = null) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...patch, rev }),
  });
  if (!res.ok) throw await readApiError(res);
  const { project } = await res.json();
  const idx = projects.findIndex(p => p.id === id);
  if (idx !== -1) projects[idx] = project;
  return project;
}
