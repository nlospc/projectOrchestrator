export function tableSheet(title, columns, rows) {
  return `<h2>${escapeHtml(title)}</h2><table border="1"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

export function downloadExcelTemplate(filename, sheets) {
  const html = `<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,"Microsoft YaHei",sans-serif}table{border-collapse:collapse;margin-bottom:24px}th{background:#f4f1eb}th,td{padding:6px 10px;border:1px solid #d8d2ca;white-space:nowrap}</style></head><body>${sheets.join("")}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function csvFromRows(columns, rows) {
  const header = columns.map((column) => csvValue(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => csvValue(row[column.key] ?? row[column.targetKey] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCsvTemplate(filename, columns, rows) {
  downloadTextFile(filename, csvFromRows(columns, rows));
}
