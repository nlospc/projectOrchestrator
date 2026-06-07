import { allocations, milestoneNames, milestones, projects, roleWeights, statusWeights } from "../data/mock-data.js";
import { downloadCsvTemplate } from "../core/files.js";
import { milestoneTemplateSchema, overrideTemplateSchema, projectTemplateSchema, resourceTemplateSchema } from "../core/template-schemas.js";
import { badge, loadFor } from "../core/utils.js";

export function uploadView() {
  return `<div class="upload-layout">
    <section class="panel upload-card">
      <div class="upload-card-head">
        <div>
          <h2>项目数据上传</h2>
          <p class="muted">用于项目主数据和关键里程碑，不包含任务颗粒度。</p>
        </div>
        <button class="ghost-button" data-action="download-project-template">下载项目模板</button>
      </div>
      <div class="dropzone"><div><strong>上传项目 Excel</strong><p class="muted">建议包含 Project 与 Milestone 两张表；模板内已放入当前设计案例。</p><button class="primary-button" data-action="mock-project-upload">模拟解析项目文件</button></div></div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("Project Sheet", `${projects.length} 行样例`, "项目主数据字段完整", "G")}
        ${uploadRow("Milestone Sheet", `${milestones.length} 行样例`, "按项目编号关联里程碑", "G")}
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
      <div class="dropzone"><div><strong>上传资源 Excel</strong><p class="muted">用于人员 x 项目、人员负载和 Bus Factor 统计。</p><button class="primary-button" data-action="mock-resource-upload">模拟解析资源文件</button></div></div>
      <div class="stack" style="margin-top:14px">
        ${uploadRow("ResourceAllocation Sheet", `${allocations.length} 行 R2 数据`, "可直接用于当前资源视图", "G")}
        ${uploadRow("必填字段", "项目 / 角色 / 人员 / 工时投入占比", "缺失会阻断导入", "Y")}
        ${uploadRow("计算字段", "负荷值 / 角色状态键", "系统根据模板字段自动计算", "G")}
      </div>
    </section>
  </div>`;
}

export function uploadRow(name, rows, status, health) {
  return `<div class="upload-row"><span><strong>${name}</strong><br><span class="muted">${rows} · ${status}</span></span>${badge(health)}</div>`;
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
  </div>`;
}
