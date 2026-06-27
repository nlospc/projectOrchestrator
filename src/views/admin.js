import { allocations, milestoneNames, milestones, projects, appSettings, confirmedLinks } from "../core/data-store.js";
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
          <p class="muted">三份文件按顺序导入：① 项目信息 → ② 里程碑 → ③ 资源分配（资源依赖项目数据计算负荷）。</p>
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
        <span class="upload-step-pill">② 选择并上传</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">③ 确认差异导入</span>
      </div>
      <div class="upload-import-grid">
        ${uploadImportSlot("项目信息 Excel", "27列项目主数据，含复杂度 / 阶段 / 人员 / 中文日期（如：2026年7月31日）。导入后全量替换项目表。", "project", "选择项目信息 Excel", "export-projects-csv")}
        ${uploadImportSlot("里程碑 Excel", "G0–G6 门禁宽表，日期为 Excel 序列整数（自动转换）。仅支持 .xlsx 格式。导入后全量替换里程碑表。", "milestone", "选择里程碑 Excel", "export-milestones-csv")}
        ${uploadImportSlot("PMO 覆盖 CSV", "PMO 手动健康度覆盖。导入前清空现有覆盖，再应用文件内容。", "override", "选择覆盖 CSV", "export-overrides-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("项目信息 Excel", `${projects.length} 行`, "必填：项目ID · 项目名称", "G")}
        ${uploadRow("里程碑 Excel", `${milestones.length} 行`, "必填：项目ID · 项目名称 · 仅 xlsx", "G")}
        ${uploadRow("PMO 覆盖 CSV", "可选", "手动健康度覆盖仍由系统保存", "Y")}
      </div>
    </section>
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>资源数据上传</h2>
          <p class="muted">7列精简模板：复杂度 / 状态由<strong>项目信息导入</strong>自动关联，请先完成项目导入。</p>
        </div>
        <button class="ghost-button" data-action="download-resource-template">导出当前资源 CSV</button>
      </div>
      <div class="upload-step-pills">
        <span class="upload-step-pill">① 先导入项目信息</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">② 选择 CSV / Excel</span>
        <span class="upload-step-sep">→</span>
        <span class="upload-step-pill">③ 确认差异导入</span>
      </div>
      <div class="upload-import-grid single">
        ${uploadImportSlot("资源分配 Excel", "7列：分配ID / 项目唯一键 / 项目 / 角色 / 人员 / 工时投入占比 / 是否外包。复杂度和状态由项目数据自动关联，导入后替换当前资源分配表。", "resource", "选择资源分配 Excel", "export-allocations-csv")}
      </div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("资源分配 Excel", `${allocations.length} 行`, "必填 6项：分配ID · 项目唯一键 · 项目 · 角色 · 人员 · 工时占比", "G")}
        ${uploadRow("复杂度 / 状态", "自动关联", "从项目导入数据取值，用于负荷计算", "G")}
        ${uploadRow("是否外包", "可选", "外包资源在 Bus Factor 分析中单独标记", "Y")}
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
  const current = state.uploads[kind] || { tone: "idle", message: "等待选择 CSV 或 Excel 文件" };
  const icon = kindIcons[kind] ?? "📁";
  return `<div class="dropzone upload-slot" data-upload-kind="${kind}">
    <div>
      <span class="upload-slot-icon">${icon}</span>
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
  const s = appSettings.payload;
  const hr = s.healthRules ?? {};
  const lt = s.loadThresholds ?? {};
  const tf = s.templateFields ?? {};

  const liveTag = `<span class="settings-tag tag-live">影响计算</span>`;
  const storeTag = `<span class="settings-tag">仅记录</span>`;

  const select = (path, options, current) =>
    `<select data-settings-path="${path}">${options.map(o => `<option${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`).join("")}</select>`;

  const numInput = (path, value, step = "1", min = "") =>
    `<input type="number" data-settings-path="${path}" value="${value}" step="${step}"${min ? ` min="${min}"` : ""} style="width:90px">`;

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

    <div class="settings-save-bar settings-wide">
      <button class="primary-button" data-action="save-settings">保存设置</button>
      <span class="settings-hint">「影响计算」参数保存后立即生效；「仅记录」参数保存后备查</span>
    </div>

    <div class="settings-section-sep settings-wide">模板配置</div>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>里程碑模板</h2><button class="ghost-button" data-action="add-milestone-template">新增节点</button></div>
      <div class="template-list">${milestoneNames.map((name, index) => `<div class="template-row"><span>${index + 1}</span><input value="${escapeHtml(name)}" /><select><option>关键节点</option><option>普通节点</option></select><button class="small-button">启用</button></div>`).join("")}</div>
    </section>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head"><h2>上传模板字段</h2><span class="muted">对应 docs/template/ 三份 xlsx 模板的必填列 ${storeTag}</span></div>
      <div class="settings-form two-col">
        <label>项目信息必填字段（project_info_template.xlsx）
          <textarea rows="2" data-settings-path="templateFields.projectRequired">${escapeHtml(tf.projectRequired ?? "")}</textarea>
        </label>
        <label>里程碑必填字段（milestone_info_template.xlsx）
          <textarea rows="2" data-settings-path="templateFields.milestoneRequired">${escapeHtml(tf.milestoneRequired ?? "")}</textarea>
        </label>
        <label>资源分配必填字段（PMO_ResourceAllocation_template.xlsx）
          <textarea rows="2" data-settings-path="templateFields.resourceRequired">${escapeHtml(tf.resourceRequired ?? "")}</textarea>
        </label>
      </div>
    </section>

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

export function reconciliationView() {
  const confirmedKeys = new Set(confirmedLinks.keys());
  const confirmedProjectIds = new Set(confirmedLinks.values());
  const allResourceKeys = [...new Set(allocations.map((a) => a.projectId).filter(Boolean))];
  const unmatchedKeys = allResourceKeys.filter((k) => !confirmedKeys.has(k));
  const unmatchedProjects = projects.filter((p) => !confirmedProjectIds.has(p.id));

  const unmatchedRows = unmatchedKeys.map((key) => {
    const sample = allocations.find((a) => a.projectId === key);
    const projectOptions = projects.map((p) =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
    return `<tr>
      <td><strong>${escapeHtml(sample?.projectName || key)}</strong><br>
          <span class="muted">${escapeHtml(key)}</span></td>
      <td>${escapeHtml(sample?.system || '—')}</td>
      <td>${escapeHtml(sample?.biz || '—')}</td>
      <td>
        <select class="link-project-select" data-resource-key="${escapeHtml(key)}">
          <option value="">选择项目…</option>${projectOptions}
        </select>
        <button class="ghost-button" data-action="link-manual" data-resource-key="${escapeHtml(key)}">关联</button>
      </td>
    </tr>`;
  }).join('');

  const noResourceRows = unmatchedProjects.map((p) =>
    `<tr><td>${escapeHtml(p.id)}</td><td><strong>${escapeHtml(p.name)}</strong></td>
     <td>${escapeHtml(p.biz || '—')}</td><td>${escapeHtml(p.status || '—')}</td></tr>`
  ).join('');

  return `<div class="settings-grid">
    <div class="settings-section-sep settings-wide">项目 ↔ 资源关联中心</div>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>待确认提案</h2>
        <button class="ghost-button" data-action="link-propose">运行匹配器</button>
      </div>
      <div id="link-proposed-list"><p class="muted">点击「运行匹配器」生成提案，或加载已有提案。</p></div>
      <button class="ghost-button" style="margin-top:8px" data-action="link-load">加载提案</button>
    </section>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>未关联资源 <span class="badge Y">${unmatchedKeys.length}</span></h2>
        <span class="muted">以下资源团队尚未关联到任何规范项目</span>
      </div>
      ${unmatchedKeys.length === 0
        ? '<p class="muted">全部资源已关联 ✓</p>'
        : `<div class="table-wrap"><table>
            <thead><tr><th>资源团队</th><th>系统</th><th>业务</th><th>手动关联</th></tr></thead>
            <tbody>${unmatchedRows}</tbody>
           </table></div>`}
    </section>

    <section class="panel settings-panel settings-wide">
      <div class="settings-head">
        <h2>无资源项目 <span class="badge Y">${unmatchedProjects.length}</span></h2>
        <span class="muted">以下项目尚无确认的资源分配</span>
      </div>
      ${unmatchedProjects.length === 0
        ? '<p class="muted">全部项目已有资源 ✓</p>'
        : `<div class="table-wrap"><table>
            <thead><tr><th>编号</th><th>项目名称</th><th>业务</th><th>阶段</th></tr></thead>
            <tbody>${noResourceRows}</tbody>
           </table></div>`}
    </section>
  </div>`;
}
