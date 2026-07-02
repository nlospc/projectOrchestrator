import { roleWeights } from "../data/mock-data.js";
import { healthByValue } from "../config/definitions.js";
import { appSettings } from "./data-store.js";



export const $ = (selector) => document.querySelector(selector);

export function effectiveHealth(project) {
  return project.override || project.health;
}

export function loadFor(allocation) {
  const status = allocation.status;
  const complexity = allocation.complexity ?? 3;
  const roleWeight = roleWeights[allocation.role]?.[status] ?? 0;
  return allocation.timeRatio * Math.sqrt(complexity / 5) * roleWeight;
}

// Single source for the configured (or default) load/bus-factor thresholds.
// Read by loadClass() and by every view/selector that classifies or labels
// load or bus-factor risk.
export function getLoadThresholds() {
  const t = appSettings.payload.loadThresholds;
  const mid = (t?.mid != null && Number.isFinite(t.mid)) ? t.mid : 1.2;
  const low = (t?.low != null && Number.isFinite(t.low)) ? t.low : 0.6;
  const bfRisk = (t?.bfRisk != null && Number.isFinite(t.bfRisk)) ? t.bfRisk : 1;
  const bfTarget = (t?.bfTarget != null && Number.isFinite(t.bfTarget)) ? t.bfTarget : 3;
  return { low, mid, bfRisk, bfTarget };
}

export function loadClass(value) {
  const { low, mid } = getLoadThresholds();
  if (value >= mid) return "high";
  if (value >= low) return "medium";
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

export function weekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); // Monday-based
  return d;
}

export function weekEnd(date) {
  const s = weekStart(date);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
}

export function addWeeks(date, count) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + count * 7);
  return d;
}

export function weekLabel(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function quarterStart(date) {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

export function quarterEnd(date) {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3 + 3, 0);
}

export function addQuarters(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count * 3, 1);
}

export function quarterLabel(date) {
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
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

export function kpi(label, value, hint, status = "", action = "", actionValue = "") {
  return `<article class="kpi ${action ? "clickable" : ""}" ${action ? `data-action="${action}" data-value="${actionValue}"` : ""}>
    <span>${label}</span><strong>${value}</strong><small>${hint}</small>${status ? `<div style="margin-top:8px">${badge(status)}</div>` : ""}
  </article>`;
}
