export const $ = (id) => document.getElementById(id);
export const view = $("view");

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

export function sectionHead(title, detail, action = "") {
  return `<header class="section-head"><div><h1>${escapeHtml(title)}</h1><p class="muted">${escapeHtml(detail)}</p></div>${action}</header>`;
}

export function renderStatus(message, tone = "") {
  const role = tone === "bad" ? "alert" : "status";
  view.innerHTML = `<div class="status ${tone}" role="${role}">${escapeHtml(message)}</div>`;
}
