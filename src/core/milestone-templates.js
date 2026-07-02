export const MILESTONE_TEMPLATE_TYPES = ["关键节点", "普通节点"];

export function normalizeMilestoneTemplates(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      name: String(row?.name ?? "").trim(),
      type: MILESTONE_TEMPLATE_TYPES.includes(row?.type) ? row.type : MILESTONE_TEMPLATE_TYPES[0],
      enabled: row?.enabled !== false,
    }))
    .filter((row) => row.name);
}

export function effectiveMilestoneTemplates(payload, fallbackNames = []) {
  const saved = normalizeMilestoneTemplates(payload?.milestoneTemplates);
  if (saved.length) return saved;
  return [...new Set(fallbackNames.filter(Boolean))].map((name) => ({
    name,
    type: MILESTONE_TEMPLATE_TYPES[0],
    enabled: true,
  }));
}
