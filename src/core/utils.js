import { projects } from "./data-store.js";
import { roleWeights, statusWeights } from "../data/mock-data.js";
import { healthByValue } from "../config/definitions.js";



export const $ = (selector) => document.querySelector(selector);

export function effectiveHealth(project) {
  return project.override || project.health;
}

export function loadFor(allocation) {
  const project = projects.find((item) => item.id === allocation.projectId);
  const status = project?.status || allocation.status;
  const complexity = project?.complexity || allocation.complexity || 3;
  const statusWeight = statusWeights[status] ?? 0.5;
  const roleWeight = roleWeights[allocation.role]?.[status] ?? statusWeight;
  return allocation.timeRatio * Math.sqrt(complexity / 5) * roleWeight;
}

export function loadClass(value) {
  if (value >= 1.2) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

export function healthLabel(value) {
  return healthByValue[value]?.label ?? "未设置";
}

export function badge(value) {
  return `<span class="badge ${value || "gray"}">${healthLabel(value)}</span>`;
}

export function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

export function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function monthLabel(date) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function detail(label, value) {
  return `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`;
}
