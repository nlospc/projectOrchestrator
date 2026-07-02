import { cockpitMetrics } from "../core/selectors.js";
import { escapeHtml, getLoadThresholds } from "../core/utils.js";

export function cockpitView() {
  const m = cockpitMetrics();
  const { confidence, actNow, wave, concentration, orgHeatmap, phases, workforce } = m;
  const confPct = Math.round(confidence.index * 100);
  const ragTotal = confidence.red + confidence.yellow + confidence.green;
  const waveMax = Math.max(wave.d30, wave.d60, wave.d90, 1);
  const totalPeople = workforce.low + workforce.mid + workforce.high;
  const loadThresholds = getLoadThresholds();

  return `
    <div class="hero-strip">
      <div class="hero-card confidence">
        <span class="hero-label">交付信心指数</span>
        <div class="confidence-main">
          <span class="hero-value">${confPct}<small>%</small></span>
          <div class="confidence-ring">${ragDonut(confidence, ragTotal)}</div>
        </div>
        <span class="hero-delta"><span class="placeholder"></span> vs 上批次</span>
        <div class="rag-legend horizontal">
          <span class="rag-legend-item clickable" data-action="health-filter" data-value="R"><span class="rag-dot R"></span>${confidence.red} 红灯</span>
          <span class="rag-legend-item clickable" data-action="health-filter" data-value="Y"><span class="rag-dot Y"></span>${confidence.yellow} 黄灯</span>
          <span class="rag-legend-item clickable" data-action="health-filter" data-value="G"><span class="rag-dot G"></span>${confidence.green} 绿灯</span>
        </div>
      </div>
      <div class="hero-card clickable" data-route="projects">
        <span class="hero-label">管理项目</span>
        <span class="hero-value">${ragTotal}</span>
        <span class="hero-sub">${wave.d90} 个里程碑</span>
      </div>
      <div class="hero-card clickable${wave.d30 > 0 ? " hero-alert" : ""}" data-route="projects">
        <span class="hero-label">30天内到期</span>
        <span class="hero-value${wave.d30 > 0 ? " text-urgent" : ""}">${wave.d30}</span>
        <span class="hero-sub">里程碑交付</span>
      </div>
      <div class="hero-card clickable" data-route="workload">
        <span class="hero-label">超负荷人员</span>
        <span class="hero-value${concentration.overloaded > 0 ? " text-danger" : ""}">${concentration.overloaded}</span>
        <span class="hero-sub">负荷 ≥ ${loadThresholds.mid} / ${totalPeople} 人</span>
      </div>
      <div class="hero-card clickable" data-route="busfactor">
        <span class="hero-label">单点故障项目</span>
        <span class="hero-value${concentration.bf1Count > 0 ? " text-danger" : ""}">${concentration.bf1Count}</span>
        <span class="hero-sub">Bus Factor = 1</span>
      </div>
    </div>

    <div class="panel-row">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">立即行动 · 风险项目</span>
          <span class="panel-badge warn">${actNow.length} 个需关注</span>
        </div>
        ${actNow.length ? `<table class="risk-table">
          <thead><tr><th>项目</th><th>里程碑</th><th class="text-right">滑点天数</th></tr></thead>
          <tbody>${actNow.map((r, i) => `<tr class="clickable" data-open-project="${escapeHtml(r.projectId)}">
              <td><span class="risk-rank">${i + 1}</span><span class="rag-tag ${r.rag}"></span><span class="project-name">${escapeHtml(r.projectName)}</span><br><span class="owner">${escapeHtml(r.owner)} · ${escapeHtml(r.dept)}</span></td>
              <td><span class="milestone-name">${escapeHtml(r.milestoneName)}</span></td>
              <td class="text-right"><span class="slip-chip">${r.slipDays}d</span></td>
            </tr>`).join("")}</tbody>
        </table>` : '<div class="empty-state"><span class="empty-icon">✓</span><p>当前筛选范围内暂无风险项目</p></div>'}
      </div>

      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">交付波次 · 未来里程碑</span>
          <span class="panel-badge info">未完成里程碑</span>
        </div>
        <div class="wave-bars">
          <div class="wave-row">
            <span class="wave-label">≤ 30 天</span>
            <div class="wave-track"><div class="wave-fill urgent" style="width: ${Math.round((wave.d30 / waveMax) * 100)}%;"></div></div>
            <span class="wave-count">${wave.d30}</span>
          </div>
          <div class="wave-row">
            <span class="wave-label">≤ 60 天</span>
            <div class="wave-track"><div class="wave-fill soon" style="width: ${Math.round((wave.d60 / waveMax) * 100)}%;"></div></div>
            <span class="wave-count">${wave.d60}</span>
          </div>
          <div class="wave-row">
            <span class="wave-label">≤ 90 天</span>
            <div class="wave-track"><div class="wave-fill planned" style="width: ${Math.round((wave.d90 / waveMax) * 100)}%;"></div></div>
            <span class="wave-count">${wave.d90}</span>
          </div>
        </div>
        <div class="cockpit-divider"></div>
        <div class="panel-header"><span class="panel-title">项目阶段分布</span></div>
        <div class="phase-grid">
          ${phases.map(ph => `<div class="phase-stat"><div class="phase-value">${ph.count}</div><div class="phase-label">${escapeHtml(ph.label)}</div></div>`).join("")}
        </div>
      </div>
    </div>

    <div class="panel-row">
      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">集中度风险</span>
          ${concentration.bf1Count > 0 ? '<span class="panel-badge warn">需关注</span>' : '<span class="panel-badge info">正常</span>'}
        </div>
        <div class="conc-stats">
          <div class="conc-stat clickable" data-route="busfactor"><div class="conc-stat-value${concentration.bf1Count > 0 ? " danger" : ""}">${concentration.bf1Count}</div><div class="conc-stat-label">BF=1 项目<br>(单点故障)</div></div>
          <div class="conc-stat clickable" data-route="workload"><div class="conc-stat-value${concentration.overAllocated > 0 ? " warning" : ""}">${concentration.overAllocated}</div><div class="conc-stat-label">超分配人员<br>(投入 &gt; 100%)</div></div>
          <div class="conc-stat clickable" data-route="workload"><div class="conc-stat-value${concentration.overloaded > 0 ? " danger" : ""}">${concentration.overloaded}</div><div class="conc-stat-label">超负荷人员<br>(负荷 ≥ ${loadThresholds.mid})</div></div>
        </div>
        <div class="cockpit-divider"></div>
        <div class="panel-header"><span class="panel-title sub-title">高风险关键人员</span></div>
        <div class="key-person-list">
          ${concentration.keyPersons.length ? concentration.keyPersons.map(kp => `<div class="key-person-row clickable" data-open-person="${escapeHtml(kp.person)}">
            <span><span class="key-person-name">${escapeHtml(kp.person)}</span> <span class="key-person-role">· ${escapeHtml(kp.role)}</span></span>
            <span class="key-person-ratio">${Math.round(kp.ratio * 100)}%</span>
            <span class="key-person-load ${kp.load >= loadThresholds.mid ? "load-high" : kp.load >= loadThresholds.low ? "load-med" : ""}">${kp.load.toFixed(2)}</span>
          </div>`).join("") : '<div class="empty-state small"><span class="empty-icon">✓</span><p>暂无高风险关键人员</p></div>'}
        </div>
      </div>

      <div class="panel cockpit-panel">
        <div class="panel-header">
          <span class="panel-title">业务线健康热力图</span>
        </div>
        ${orgHeatmap.length ? `<div class="heatmap-grid">
          <div class="heatmap-cell header">业务线</div>
          <div class="heatmap-cell header"><span class="rag-dot R" style="display:inline-block;"></span> 红灯</div>
          <div class="heatmap-cell header"><span class="rag-dot Y" style="display:inline-block;"></span> 黄灯</div>
          <div class="heatmap-cell header"><span class="rag-dot G" style="display:inline-block;"></span> 绿灯</div>
          ${orgHeatmap.map(row => `<div class="heatmap-cell label">${escapeHtml(row.biz)}</div>
            <div class="heatmap-cell${row.red > 0 ? " hot" : ""}"><span class="count${row.red > 0 ? " R" : ""}">${row.red}</span></div>
            <div class="heatmap-cell${row.yellow > 0 ? " warm" : ""}"><span class="count${row.yellow > 0 ? " Y" : ""}">${row.yellow}</span></div>
            <div class="heatmap-cell${row.green > 0 ? " cool" : ""}"><span class="count${row.green > 0 ? " G" : ""}">${row.green}</span></div>`).join("")}
        </div>` : '<div class="empty-state small"><p>暂无业务域健康数据</p></div>'}
        <div class="cockpit-divider"></div>
        <div class="panel-header"><span class="panel-title">人力利用率</span></div>
        <div class="workforce-grid">
          <div class="workforce-stat"><div class="workforce-value" style="color: var(--green);">${workforce.low}</div><div class="workforce-bar"><div class="workforce-fill G" style="width: ${totalPeople ? Math.round((workforce.low / totalPeople) * 100) : 0}%;"></div></div><div class="workforce-label">正常负荷<br><span>&lt; ${loadThresholds.low}</span></div></div>
          <div class="workforce-stat"><div class="workforce-value" style="color: var(--yellow);">${workforce.mid}</div><div class="workforce-bar"><div class="workforce-fill Y" style="width: ${totalPeople ? Math.round((workforce.mid / totalPeople) * 100) : 0}%;"></div></div><div class="workforce-label">中等负荷<br><span>${loadThresholds.low} – ${loadThresholds.mid}</span></div></div>
          <div class="workforce-stat"><div class="workforce-value" style="color: var(--red);">${workforce.high}</div><div class="workforce-bar"><div class="workforce-fill R" style="width: ${totalPeople ? Math.round((workforce.high / totalPeople) * 100) : 0}%;"></div></div><div class="workforce-label">超负荷<br><span>≥ ${loadThresholds.mid}</span></div></div>
        </div>
      </div>
    </div>`;
}

function ragDonut(confidence, total) {
  if (!total) return "";
  const r = 15.915;
  const redPct = (confidence.red / total) * 100;
  const yellowPct = (confidence.yellow / total) * 100;
  const greenPct = (confidence.green / total) * 100;
  const offset = 25;
  return `<svg class="rag-donut" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--gray-bg)" stroke-width="3.5"></circle>
    ${redPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--red)" stroke-width="3.5" stroke-dasharray="${redPct} ${100 - redPct}" stroke-dashoffset="${offset}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${yellowPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--yellow)" stroke-width="3.5" stroke-dasharray="${yellowPct} ${100 - yellowPct}" stroke-dashoffset="${offset - redPct}" transform="rotate(-90 18 18)"></circle>` : ""}
    ${greenPct > 0 ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-dasharray="${greenPct} ${100 - greenPct}" stroke-dashoffset="${offset - redPct - yellowPct}" transform="rotate(-90 18 18)"></circle>` : ""}
  </svg>`;
}
