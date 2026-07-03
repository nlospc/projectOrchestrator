import { allocations, milestoneNames, milestones, projects, personInfo, appSettings } from "../core/data-store.js";
import { downloadCsvTemplate } from "../core/files.js";
import { milestoneTemplateSchema, overrideTemplateSchema, projectTemplateSchema, resourceTemplateSchema } from "../core/template-schemas.js";
import { badge, escapeHtml, getRoleWeights, getStatusWeights, loadFor } from "../core/utils.js";
import { gateDefinitions, gradeDefinitions, healthDefinitions } from "../config/definitions.js";
import { MILESTONE_TEMPLATE_TYPES, effectiveMilestoneTemplates } from "../core/milestone-templates.js";
import { state } from "../state/app-state.js";

export function uploadView() {
  return `<div class="upload-layout">
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>项目数据上传</h2>
          <p class="muted">两份文件按顺序导入：① 项目信息 → ② 里程碑（里程碑依赖项目 ID 关联）。</p>
        </div>
        <details class="export-menu">
          <summary class="ghost-button">导出数据 ▾</summary>
          <div class="export-menu-list">
            <button data-action="export-all-xlsx">全部导出 Excel</button>
            <button data-action="export-all-csv">全部导出 CSV</button>
            <button data-action="download-project-template">导出当前项目 CSV</button>
          </div>
        </details>
      </div>
      <div class="upload-step-pills">
        <span class="upload-step-pill">① 准备 xlsx 文件</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">② 选择或拖拽上传</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">③ 确认差异导入</span>
      </div>
      <div class="upload-import-grid">
        ${uploadImportSlot("项目信息 Excel", "27列项目主数据，含复杂度 / 阶段 / 人员 / 中文日期（如：2026年7月31日）。导入后全量替换项目表。", "project", "选择项目信息 Excel", "export-projects-csv")}
        ${uploadImportSlot("里程碑 Excel", "G0–G6 门禁宽表，日期为 Excel 序列整数（自动转换）。仅支持 .xlsx 格式。导入后全量替换里程碑表。", "milestone", "选择里程碑 Excel", "export-milestones-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("项目信息 Excel", `${projects.length} 行`, "必填：项目ID · 项目名称", "G")}
        ${uploadRow("里程碑 Excel", `${milestones.length} 行`, "必填：项目ID · 项目名称 · 仅 xlsx", "G")}
      </div>
    </section>
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>资源数据上传</h2>
          <p class="muted">矩阵宽表格式：行为项目，列为人员，单元格为工时占比（0–1）。人员角色 / 外包状态请先在 <a href="#person-info" style="color:var(--primary)">人员配置</a> 页完成配置。</p>
        </div>
        <button class="ghost-button" data-action="download-resource-template">导出当前资源 CSV</button>
      </div>
      <div class="upload-step-pills">
        <a href="#person-info" class="upload-step-pill clickable">① 人员配置页配置角色</a>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">② 导入项目信息</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">③ 上传资源分配 Excel</span>
      </div>
      <div class="upload-import-grid single">
        ${uploadImportSlot("资源分配 Excel", "矩阵宽表：第1行=项目基本信息分组，第2行=表头（项目ID / 项目名称 / 人员姓名...），第3行起=项目行，单元格为工时占比（0–1）。导入后替换当前资源分配表。", "resource", "选择资源分配 Excel", "export-allocations-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("人员配置", `${personInfo.length} 人已配置`, "在「人员配置」页添加人员及角色", personInfo.length ? "G" : "Y")}
        ${uploadRow("资源分配 Excel", `${allocations.length} 行`, "矩阵格式：行=项目，列=人员，值=工时占比", "G")}
        ${uploadRow("复杂度 / 状态", "自动关联", "从项目导入数据取值，用于负荷计算", "G")}
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

const kindIcons = { project: "📋", milestone: "🗓", override: "🔧", resource: "👥" };

function uploadImportSlot(title, description, kind, buttonText, exportAction) {
  const current = state.uploads[kind] || { tone: "idle", message: "等待选择文件，或拖拽至此" };
  const icon = kindIcons[kind] ?? "📁";
  return `<div class="dropzone upload-slot" data-upload-kind="${kind}">
    <div class="upload-slot-header">
      <span class="upload-slot-icon">${icon}</span>
      <strong>${escapeHtml(title)}</strong>
    </div>
    <p class="muted" style="font-size:12px;margin:0">${escapeHtml(description)}</p>
    <div class="upload-slot-actions">
      <label class="primary-button" style="cursor:pointer">
        ${escapeHtml(buttonText)}
        <input type="file" accept=".csv,.xlsx,.xls" data-import="${kind}" hidden>
      </label>
      <button class="ghost-button" data-action="${exportAction}">导出当前数据</button>
    </div>
    <div class="upload-status ${escapeHtml(current.tone)}" role="status">${escapeHtml(current.message)}</div>
  </div>`;
}

export function downloadResourceTemplate() {
  const statusWeights = getStatusWeights();
  const roleWeights = getRoleWeights();
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

export function downloadStatusWeightsCsv() {
  const rows = Object.entries(getStatusWeights()).map(([status, weight]) => ({ status, weight }));
  downloadCsvTemplate("PMO_StatusWeights_Export.csv", [
    { key: "status", label: "项目状态" },
    { key: "weight", label: "数值" },
  ], rows);
}

export function downloadRoleWeightsCsv() {
  const rows = [];
  Object.entries(getRoleWeights()).forEach(([role, statuses]) => {
    Object.entries(statuses).forEach(([status, weight]) => {
      rows.push({ role, status, weight, roleStatusKey: `${role}|${status}` });
    });
  });
  downloadCsvTemplate("PMO_RoleWeights_Export.csv", [
    { key: "role", label: "角色" },
    { key: "status", label: "项目状态" },
    { key: "weight", label: "权重" },
    { key: "roleStatusKey", label: "角色状态键" },
  ], rows);
}

export function settingsView() {
  const s = appSettings.payload;
  const hr = s.healthRules ?? {};
  const lt = s.loadThresholds ?? {};
  const sw = getStatusWeights();
  const rw = getRoleWeights();
  // Union with roleWeights' own status keys so a status introduced only via
  // a 角色权重表 import (not yet present in 项目状态权重) still renders as an
  // editable column instead of silently existing only in the saved data.
  const statusList = [...new Set([...Object.keys(sw), ...Object.values(rw).flatMap((statuses) => Object.keys(statuses))])];
  const roleList = Object.keys(rw);

  const liveTag = `<span class="settings-tag tag-live">影响计算</span>`;
  const storeTag = `<span class="settings-tag">仅记录</span>`;

  const select = (path, options, current) =>
    `<select data-settings-path="${path}">${options.map(o => `<option${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`).join("")}</select>`;

  const numInput = (path, value, step = "1", min = "") =>
    `<input type="number" data-settings-path="${path}" value="${value}" step="${step}"${min ? ` min="${min}"` : ""} style="width:90px">`;

  const importExportBar = (exportAction, weightImportKind) => `<div style="display:flex;gap:8px">
    <button class="ghost-button" data-action="${exportAction}">导出 CSV</button>
    <label class="ghost-button" style="cursor:pointer">导入并覆盖<input type="file" accept=".csv,.xlsx,.xls" data-weight-import="${weightImportKind}" hidden></label>
    <button class="primary-button" data-action="save-settings">保存设置</button>
  </div>`;

  return `<div class="settings-grid">

    <div class="settings-section-sep settings-wide">运行参数</div>

    <section class="panel settings-panel">
      <div class="settings-head"><h2>健康灯规则</h2></div>
      <div class="settings-form">
        <label>项目红灯规则 ${storeTag}
          ${select("healthRules.redRule",
            ["任一关键里程碑红灯即项目红灯","两个及以上延期里程碑才红灯"],
            hr.redRule)}
        </label>
        <label>项目黄灯规则 ${storeTag}
          ${select("healthRules.yellowRule",
            ["任一关键里程碑黄灯即项目黄灯","仅下一个里程碑黄灯才黄灯"],
            hr.yellowRule)}
        </label>
        <label>手动覆盖优先级 ${storeTag}
          ${select("healthRules.overridePriority",
            ["PMO 手动覆盖优先于系统计算","系统计算优先"],
            hr.overridePriority)}
        </label>
        <label>延期阈值（天） ${liveTag}
          ${numInput("healthRules.deviationDays", hr.deviationDays ?? 7, "1", "1")}
        </label>
      </div>
    </section>

    <section class="panel settings-panel">
      <div class="settings-head"><h2>资源负荷阈值 ${liveTag}</h2><span class="muted">当前值立即影响资源视图分类</span></div>
      <div class="settings-form">
        <label>低负载上限 ${liveTag}
          ${numInput("loadThresholds.low", lt.low ?? 0.6, "0.05", "0")}
        </label>
        <label>中负载上限 ${liveTag}
          ${numInput("loadThresholds.mid", lt.mid ?? 1.2, "0.05", "0")}
        </label>
        <label>Bus Factor 风险线 ${liveTag}
          ${numInput("loadThresholds.bfRisk", lt.bfRisk ?? 1, "1", "1")}
        </label>
        <label>Bus Factor 目标值 ${liveTag}
          ${numInput("loadThresholds.bfTarget", lt.bfTarget ?? 3, "1", "1")}
        </label>
      </div>
    </section>

    <div class="settings-section-sep settings-wide">权重配置</div>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>项目状态权重 ${liveTag}</h2>
        ${importExportBar("export-status-weights-csv", "statusWeights")}
      </div>
      <div class="table-wrap">
        <table class="def-table">
          <thead><tr>${statusList.map((status) => `<th>${escapeHtml(status)}</th>`).join("")}</tr></thead>
          <tbody><tr>${statusList.map((status) => `<td>${numInput(`statusWeights.${status}`, sw[status] ?? 0, "0.01", "0")}</td>`).join("")}</tr></tbody>
        </table>
      </div>
    </section>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>角色权重表 ${liveTag}</h2>
        ${importExportBar("export-role-weights-csv", "roleWeights")}
      </div>
      <div class="table-wrap benchmark-table">
        <table>
          <thead><tr><th>角色 / 阶段</th>${statusList.map((status) => `<th>${escapeHtml(status)}</th>`).join("")}</tr></thead>
          <tbody>${roleList.map((role) => `<tr><td><strong>${escapeHtml(role)}</strong></td>${statusList.map((status) => `<td>${numInput(`roleWeights.${role}.${status}`, rw[role]?.[status] ?? 0, "0.01", "0")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    </section>

    <div class="settings-section-sep settings-wide">模板配置</div>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>里程碑模板</h2><button class="ghost-button" data-action="add-milestone-template">新增节点</button></div>
      <div class="template-list" id="milestone-template-list">${effectiveMilestoneTemplates(s, milestoneNames).map((template, index) => milestoneTemplateRow(template, index)).join("")}</div>
      <p class="muted" style="font-size:12px;margin:10px 0 0">模板随「保存设置」一并保存；空名称的行保存时自动忽略，停用的节点保留配置备查。</p>
    </section>

    <div class="settings-save-bar settings-wide">
      <button class="primary-button" data-action="save-settings">保存设置</button>
      <span class="settings-hint">「影响计算」参数保存后立即生效；模板与「仅记录」参数保存后备查</span>
    </div>

    <div class="settings-section-sep settings-wide">参考定义（只读）</div>

    <section class="panel settings-panel settings-wide settings-panel-ref">
      <div class="settings-head"><h2>项目分级标准</h2><span class="muted">按复杂度和治理层级自动推荐分级</span></div>
      <table class="def-table">
        <thead><tr><th>分级</th><th>颜色</th><th>含义</th><th>门禁节奏</th></tr></thead>
        <tbody>${gradeDefinitions.map((g) => `<tr><td><span class="badge grade-${g.value}">${g.value}</span></td><td>${g.color}</td><td>${g.meaning}</td><td>${g.checkCycle}</td></tr>`).join("")}</tbody>
      </table>
    </section>
    <section class="panel settings-panel settings-wide settings-panel-ref">
      <div class="settings-head"><h2>健康度标准</h2><span class="muted">系统自动计算，PMO 可手动覆盖</span></div>
      <table class="def-table">
        <thead><tr><th>健康度</th><th>颜色</th><th>触发条件</th></tr></thead>
        <tbody>${healthDefinitions.map((h) => `<tr><td><span class="badge ${h.value}">${h.label}</span></td><td>${h.color}</td><td>${h.meaning}</td></tr>`).join("")}</tbody>
      </table>
    </section>
    <section class="panel settings-panel settings-wide settings-panel-ref">
      <div class="settings-head"><h2>门禁阶段定义</h2><span class="muted">G0–G6 阶段交付物清单</span></div>
      <table class="def-table">
        <thead><tr><th>门禁</th><th>名称</th><th>交付物</th></tr></thead>
        <tbody>${gateDefinitions.map((g) => `<tr><td><strong>${g.value}</strong></td><td>${g.label}</td><td>${g.deliverables}</td></tr>`).join("")}</tbody>
      </table>
    </section>
  </div>`;
}

export function milestoneTemplateRow(template, index) {
  return `<div class="template-row${template.enabled ? "" : " disabled"}" data-template-row data-enabled="${template.enabled}">
    <span>${index + 1}</span>
    <input data-template-field="name" value="${escapeHtml(template.name)}" placeholder="节点名称" />
    <select data-template-field="type">${MILESTONE_TEMPLATE_TYPES.map((type) => `<option${type === template.type ? " selected" : ""}>${type}</option>`).join("")}</select>
    <div class="template-row-actions">
      <button class="small-button" data-action="template-toggle">${template.enabled ? "停用" : "启用"}</button>
      <button class="small-button danger" data-action="template-delete">删除</button>
    </div>
  </div>`;
}

const KNOWN_ROLES = ['全栈开发工程师','产品经理','项目经理','前端','后端','测试','运维','Agent开发','UI/UX','模型','架构师'];

function roleOptions(selected, includeBlank = false) {
  const roles = [
    ...(includeBlank ? [''] : []),
    ...(selected && !KNOWN_ROLES.includes(selected) ? [selected] : []),
    ...KNOWN_ROLES,
  ];
  return roles.map((r) => `<option value="${escapeHtml(r)}"${r === selected ? ' selected' : ''}>${escapeHtml(r || '-- 角色 --')}</option>`).join('');
}

export function personInfoView() {
  const tableRows = personInfo.map((p) => `<tr data-person="${escapeHtml(p.name)}">
    <td>
      <span class="person-view-cells">${escapeHtml(p.name)}</span>
      <input class="person-edit-cells person-name-input" value="${escapeHtml(p.name)}" readonly>
    </td>
    <td>
      <span class="person-view-cells">${escapeHtml(p.role)}</span>
      <select class="person-edit-cells person-role-input">${roleOptions(p.role, true)}</select>
    </td>
    <td>
      <span class="person-view-cells">${p.outsourced ? '<span class="badge Y">外包</span>' : '<span class="badge G">内部</span>'}</span>
      <label class="person-edit-cells person-outsourced-label"><input type="checkbox" class="person-outsourced-input"${p.outsourced ? ' checked' : ''}> 外包</label>
    </td>
    <td>
      <span class="person-view-cells person-row-actions">
        <button class="ghost-button" data-action="person-edit-toggle" data-name="${escapeHtml(p.name)}">编辑</button>
        <button class="ghost-button danger" data-action="person-delete" data-name="${escapeHtml(p.name)}">删除</button>
      </span>
      <span class="person-edit-cells person-row-actions">
        <button class="ghost-button" data-action="person-save" data-name="${escapeHtml(p.name)}">保存</button>
        <button class="ghost-button" data-action="person-edit-toggle" data-name="${escapeHtml(p.name)}">取消</button>
      </span>
    </td>
  </tr>`).join('');

  const addRow = `<tr class="person-add-row">
    <td><input id="new-person-name" class="new-person-name-input" type="text" placeholder="姓名"></td>
    <td><select id="new-person-role">${roleOptions('', true)}</select></td>
    <td><label class="person-outsourced-label"><input id="new-person-outsourced" type="checkbox"> 外包</label></td>
    <td class="person-row-actions">
      <button class="ghost-button" data-action="person-add-save">保存</button>
      <button class="ghost-button" data-action="person-add-cancel">取消</button>
    </td>
  </tr>`;

  return `<div class="settings-grid">
    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>人员配置 <span class="badge G">${personInfo.length}</span></h2>
        <div style="display:flex;gap:8px">
          <button class="primary-button" data-action="person-add-toggle">+ 添加人员</button>
          <button class="ghost-button" data-action="export-person-info-csv">导出 CSV</button>
          <label class="ghost-button" style="cursor:pointer">导入并覆盖<input type="file" accept=".csv,.xlsx,.xls" data-import="person_info" hidden></label>
        </div>
      </div>
      <div class="table-wrap">
        <table class="def-table person-info-table${state.personAddOpen ? ' adding' : ''}">
          <thead><tr><th>姓名</th><th>角色</th><th>类型</th><th></th></tr></thead>
          <tbody>${addRow}${tableRows}</tbody>
        </table>
      </div>
    </section>
  </div>`;
}
