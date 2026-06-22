import { allocations, milestoneNames, milestones, projects } from "../core/data-store.js";
import { roleWeights, statusWeights } from "../data/mock-data.js";
import { downloadCsvTemplate } from "../core/files.js";
import { milestoneTemplateSchema, overrideTemplateSchema, projectTemplateSchema, resourceTemplateSchema } from "../core/template-schemas.js";
import { badge, escapeHtml, loadFor } from "../core/utils.js";
import { gateDefinitions, gradeDefinitions, healthDefinitions } from "../config/definitions.js";
import { state } from "../state/app-state.js";

export function uploadView() {
  return `<div class="upload-layout">
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>项目数据上传</h2>
          <p class="muted">用于项目主数据和关键里程碑，不包含任务颗粒度。</p>
        </div>
        <div>
          <button class="ghost-button" data-action="export-all-xlsx">全部导出 Excel</button>
          <button class="ghost-button" data-action="export-all-csv">全部导出</button>
          <button class="ghost-button" data-action="download-project-template">下载项目模板</button>
        </div>
      </div>
      <div class="upload-import-grid">
        ${uploadImportSlot("Project CSV", "项目主数据。导入后全量替换当前项目表，并清理旧项目关联数据。", "project", "解析并导入 Project CSV", "export-projects-csv")}
        ${uploadImportSlot("Milestone CSV", "里程碑计划与实际日期。导入后全量替换当前里程碑表。", "milestone", "解析并导入 Milestone CSV", "export-milestones-csv")}
        ${uploadImportSlot("Override CSV", "PMO 手动健康度覆盖。导入前清空现有覆盖，再应用 CSV。", "override", "解析并导入 Override CSV", "export-overrides-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("Project Sheet", `${projects.length} 行`, "项目主数据字段完整", "G")}
        ${uploadRow("Milestone Sheet", `${milestones.length} 行`, "按项目编号关联里程碑", "G")}
        ${uploadRow("PMO Override", "可选", "手动健康度覆盖仍由系统保存", "Y")}
      </div>
    </section>
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>资源数据上传</h2>
          <p class="muted">字段参考 R2 Workforce Dashboard，当前模板包含 R2 提取的资源记录。</p>
        </div>
        <button class="ghost-button" data-action="download-resource-template">下载资源模板</button>
      </div>
      <div class="upload-import-grid single">
        ${uploadImportSlot("ResourceAllocation CSV", "人员 x 项目、人员负载和 Bus Factor 统计。导入后替换当前资源分配表。", "resource", "解析并导入资源 CSV", "export-allocations-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("ResourceAllocation Sheet", `${allocations.length} 行 R2 数据`, "可直接用于当前资源视图", "G")}
        ${uploadRow("必填字段", "项目 / 角色 / 人员 / 工时投入占比", "缺失会阻断导入", "Y")}
        ${uploadRow("计算字段", "负荷值 / 角色状态键", "系统根据模板字段自动计算", "G")}
      </div>
    </section>
    <section class="panel upload-card" style="grid-column:1/-1">
      <div class="upload-card-head">
        <div>
          <h2>导入批次历史</h2>
          <p class="muted">最近 50 次已提交的导入。</p>
        </div>
      </div>
      <div id="import-history-list"><p class="muted">正在加载...</p></div>
    </section>
  </div>`;
}

export function uploadRow(name, rows, status, health) {
  return `<div class="upload-row"><span><strong>${name}</strong><br><span class="muted">${rows} · ${status}</span></span>${badge(health)}</div>`;
}

function uploadImportSlot(title, description, kind, buttonText, exportAction) {
  const current = state.uploads[kind] || { tone: "idle", message: "等待选择 CSV 或 Excel 文件" };
  return `<div class="dropzone upload-slot" data-upload-kind="${kind}">
    <div>
      <strong>${escapeHtml(title)}</strong>
      <p class="muted">${escapeHtml(description)}</p>
      <label class="primary-button" style="cursor:pointer">
        ${escapeHtml(buttonText)}
        <input type="file" accept=".csv,.xlsx,.xls" data-import="${kind}" hidden>
      </label>
      <button class="ghost-button" data-action="${exportAction}">导出当前数据</button>
      <div class="upload-status ${escapeHtml(current.tone)}" role="status">${escapeHtml(current.message)}</div>
    </div>
  </div>`;
}

export function downloadResourceTemplate() {
  const rows = allocations.map((allocation) => {
    const statusWeight = statusWeights[allocation.status] ?? 0.5;
    const roleWeight = roleWeights[allocation.role]?.[allocation.status] ?? statusWeight;
    return {
      ...allocation,
      allocationId: allocation.id,
      personKey: allocation.person,
      outsourced: allocation.outsourced ? "是" : "否",
      statusWeight,
      roleWeight,
      load: loadFor(allocation).toFixed(4),
      roleStatusKey: `${allocation.role}|${allocation.status}`,
    };
  });
  downloadCsvTemplate("PMO_ResourceAllocation_Template.csv", resourceTemplateSchema, rows);
}

export function downloadProjectTemplate() {
  const projectRows = projects.map((project) => ({ ...project, projectId: project.id, projectName: project.name }));
  const milestoneRows = milestones.map((milestone) => {
    return { ...milestone, milestoneId: milestone.id, milestoneName: milestone.name };
  });
  const overrideRows = projects
    .filter((project) => project.override || project.overrideNote)
    .map((project) => ({
      projectId: project.id,
      overrideHealth: project.override || project.health,
      overrideNote: project.overrideNote,
      updatedBy: "PMO Admin",
      updatedAt: "2026-06-06",
    }));
  downloadCsvTemplate("PMO_Project_Template.csv", projectTemplateSchema, projectRows);
  window.setTimeout(() => downloadCsvTemplate("PMO_Milestone_Template.csv", milestoneTemplateSchema, milestoneRows), 80);
  window.setTimeout(() => downloadCsvTemplate("PMO_Project_Override_Template.csv", overrideTemplateSchema, overrideRows), 160);
}

export function settingsView() {
  return `<div class="settings-grid">
    <section class="panel settings-panel">
      <div class="settings-head"><h2>健康灯规则</h2><button class="primary-button" data-action="save-settings">保存设置</button></div>
      <div class="settings-form">
        <label>项目红灯规则<select><option>任一关键里程碑红灯即项目红灯</option><option>两个及以上延期里程碑才红灯</option></select></label>
        <label>项目黄灯规则<select><option>任一关键里程碑黄灯即项目黄灯</option><option>仅下一个里程碑黄灯才黄灯</option></select></label>
        <label>手动覆盖优先级<select><option>PMO 手动覆盖优先于系统计算</option><option>系统计算优先</option></select></label>
        <label>延期阈值 天<input type="number" value="7" min="1" /></label>
      </div>
    </section>
    <section class="panel settings-panel">
      <div class="settings-head"><h2>资源负荷阈值</h2><span class="muted">R2 workload</span></div>
      <div class="settings-form">
        <label>低负载上限<input type="number" value="0.6" step="0.1" /></label>
        <label>中负载上限<input type="number" value="1.2" step="0.1" /></label>
        <label>Bus Factor 风险线<input type="number" value="1" min="1" /></label>
        <label>Bus Factor 目标值<input type="number" value="3" min="1" /></label>
      </div>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>里程碑模板</h2><button class="ghost-button" data-action="add-milestone-template">新增节点</button></div>
      <div class="template-list">${milestoneNames.map((name, index) => `<div class="template-row"><span>${index + 1}</span><input value="${name}" /><select><option>关键节点</option><option>普通节点</option></select><button class="small-button">启用</button></div>`).join("")}</div>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>上传模板字段</h2><span class="muted">用于模板下载和导入校验</span></div>
      <div class="settings-form two-col">
        <label>项目模板必填字段<textarea rows="3">项目编号、项目名称、健康度、复杂度、项目状态、当前PM</textarea></label>
        <label>资源模板必填字段<textarea rows="3">系统、项目、项目复杂度、项目状态、角色、人员、工时投入占比</textarea></label>
      </div>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>项目分级标准</h2><span class="muted">按复杂度和治理层级自动推荐分级</span></div>
      <table class="def-table">
        <thead><tr><th>分级</th><th>颜色</th><th>含义</th><th>门禁节奏</th></tr></thead>
        <tbody>${gradeDefinitions.map((g) => `<tr><td><span class="badge grade-${g.value}">${g.value}</span></td><td>${g.color}</td><td>${g.meaning}</td><td>${g.checkCycle}</td></tr>`).join("")}</tbody>
      </table>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>健康度标准</h2><span class="muted">系统自动计算，PMO 可手动覆盖</span></div>
      <table class="def-table">
        <thead><tr><th>健康度</th><th>颜色</th><th>触发条件</th></tr></thead>
        <tbody>${healthDefinitions.map((h) => `<tr><td><span class="badge ${h.value}">${h.label}</span></td><td>${h.color}</td><td>${h.meaning}</td></tr>`).join("")}</tbody>
      </table>
    </section>
    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>门禁阶段定义</h2><span class="muted">G0–G6 阶段交付物清单</span></div>
      <table class="def-table">
        <thead><tr><th>门禁</th><th>名称</th><th>交付物</th></tr></thead>
        <tbody>${gateDefinitions.map((g) => `<tr><td><strong>${g.value}</strong></td><td>${g.label}</td><td>${g.deliverables}</td></tr>`).join("")}</tbody>
      </table>
    </section>
  </div>`;
}
