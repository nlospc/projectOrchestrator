export function norm(value) {
  return String(value ?? '').toLowerCase().replace(/[\s\/（）()【】\-—·]/g, '');
}

function tokens(value) {
  return new Set([...norm(value)]);
}

export function jaccard(a, b) {
  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }
  return intersection / (aTokens.size + bTokens.size - intersection);
}

function scoreProject(name, project) {
  return Math.max(
    jaccard(name, project.name),
    jaccard(name, project.code ?? ''),
    jaccard(name, project.family ?? ''),
    jaccard(name, project.biz ?? ''),
  );
}

function scoredMatches(name, biz, dept, projects) {
  const matches = projects
    .map((project) => ({ project, score: scoreProject(name, project) }))
    .sort((a, b) => b.score - a.score);
  const [top] = matches;
  if (top && top.score >= 0.5 && (top.project.biz === biz || top.project.dept === dept)) {
    top.score = Math.min(1, top.score + 0.1);
  }
  return matches;
}

function bestMatch(name, biz, dept, projects) {
  const [best] = scoredMatches(name, biz, dept, projects);
  const topScore = best?.score ?? 0;
  return { project: topScore < 0.3 ? null : best.project, score: topScore };
}

export function proposeLinks(allocations, projects) {
  const uniqueAllocations = new Map(allocations.map((allocation) => [allocation.projectId, allocation]));
  const proposals = [];

  for (const allocation of uniqueAllocations.values()) {
    const match = bestMatch(allocation.projectName, allocation.biz, allocation.dept, projects);
    if (match.score < 0.3) continue;

    const candidates = scoredMatches(allocation.projectName, allocation.biz, allocation.dept, projects)
      .filter(({ score }) => score >= 0.1)
      .slice(0, 3)
      .map(({ project, score }) => ({ projectId: project.id, score }));
    proposals.push({
      resourceKey: String(allocation.projectId),
      projectId: match.project?.id ?? null,
      confidence: Math.round(match.score * 100) / 100,
      candidates,
    });
  }

  return proposals;
}
