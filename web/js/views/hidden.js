import { escapeHtml, sectionHead, view } from "../dom.js";
import { setTab } from "../navigation.js";
import { state } from "../state.js";

export function renderHidden() {
  view.innerHTML = sectionHead("Off the Path", "Lower-visibility cultural places from the same live result set.") +
    `<div class="grid">${state.data.hiddenGems.map(hiddenGemButton).join("")}</div>`;
  view.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPlace = state.data.hiddenGems.find((item) => item.id === button.dataset.id);
      setTab("detail");
    });
  });
}

function hiddenGemButton(place) {
  return `
    <button class="card card-body" data-id="${escapeHtml(place.id)}">
      <span class="eyebrow">${escapeHtml(place.category)}</span>
      <strong>${escapeHtml(place.name)}</strong>
      <small>${escapeHtml(place.reason)}</small>
    </button>`;
}
