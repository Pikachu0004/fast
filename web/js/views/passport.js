import { escapeHtml, sectionHead, view } from "../dom.js";
import { state } from "../state.js";

const slots = [
  ["smart", "Smart Picks"],
  ["hidden", "Off Path"],
  ["heritage", "Heritage"],
  ["story", "Story"],
  ["events", "Events"],
  ["threads", "Threads"]
];

export function renderPassport() {
  view.innerHTML = sectionHead("Culture Passport", "Stamps appear only after an endpoint succeeds.") +
    `<div class="passport">${slots.map(stampSlot).join("")}</div>`;
}

function stampSlot([id, label]) {
  const earned = state.passport.has(id);
  return `
    <div class="stamp ${earned ? "earned" : ""}" title="${earned ? "Completed" : `Complete ${label}`}">
      <strong>${escapeHtml(label)}</strong>
      <span>${earned ? "Earned" : "Pending"}</span>
    </div>`;
}
