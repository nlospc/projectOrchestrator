/**
 * reason-modal.js — Promise-based overlay for collecting change reasons.
 *
 * Usage:
 *   const result = await openReasonModal({ field, oldValue, newValue, required: true });
 *   if (!result) return; // user cancelled
 *   await updateMilestone(id, patch, result.reason);
 *
 * Mount point: #reason-modal (must exist in index.html).
 * Reuses #drawer-backdrop for dimming — adds/removes .open class.
 */

const FIELD_LABELS = {
  planned_start_date: "计划开始日期",
  planned_end_date:   "计划完成日期",
  actual_start_date:  "实际开始日期",
  actual_end_date:    "实际完成日期",
  name:               "里程碑名称",
  sortOrder:          "排序",
};

/**
 * @param {{ field: string, oldValue: string|null, newValue: string|null, required: boolean }} opts
 * @returns {Promise<{ reason: string } | null>}  null = cancelled
 */
export function openReasonModal({ field, oldValue, newValue, required = false }) {
  return new Promise((resolve) => {
    const mount = document.getElementById("reason-modal");
    const backdrop = document.getElementById("drawer-backdrop");
    if (!mount) {
      resolve(null);
      return;
    }

    const label = FIELD_LABELS[field] ?? field;
    const oldDisplay = oldValue ?? "—";
    const newDisplay = newValue ?? "—";

    mount.innerHTML = `
      <div class="reason-modal-panel panel" role="dialog" aria-modal="true" aria-labelledby="reason-modal-title">
        <div class="panel-header">
          <span id="reason-modal-title" class="panel-title">修改原因</span>
          <button class="icon-btn" data-reason-cancel aria-label="取消">✕</button>
        </div>
        <div class="panel-body">
          <p class="reason-modal-meta">
            <strong>${label}</strong>：${oldDisplay} → ${newDisplay}
          </p>
          <label class="field-label" for="reason-input">
            原因${required ? " <span class='required'>*</span>" : "（选填）"}
          </label>
          <textarea
            id="reason-input"
            class="reason-textarea"
            rows="3"
            placeholder="请简述修改原因…"
            autocomplete="off"
          ></textarea>
        </div>
        <div class="panel-footer">
          <button class="btn btn-ghost" data-reason-cancel>取消</button>
          <button class="btn btn-primary" data-reason-confirm ${required ? "disabled" : ""}>确认</button>
        </div>
      </div>
    `;

    mount.classList.add("open");
    if (backdrop) backdrop.classList.add("open");

    const textarea = mount.querySelector("#reason-input");
    const confirmBtn = mount.querySelector("[data-reason-confirm]");

    if (required) {
      textarea.addEventListener("input", () => {
        confirmBtn.disabled = !textarea.value.trim();
      });
    }

    requestAnimationFrame(() => textarea.focus());

    function close(result) {
      mount.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
      mount.innerHTML = "";
      resolve(result);
    }

    mount.addEventListener("click", (e) => {
      if (e.target.closest("[data-reason-cancel]")) {
        close(null);
      } else if (e.target.closest("[data-reason-confirm]") && !confirmBtn.disabled) {
        close({ reason: textarea.value.trim() });
      }
    });

    function onKeydown(e) {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKeydown);
        close(null);
      }
    }
    document.addEventListener("keydown", onKeydown);
  });
}
