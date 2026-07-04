import { $, escapeHtml, sectionHead, view } from "../dom.js";
import { setTab } from "../navigation.js";
import { loadSmartPicks } from "../setup.js";
import { rememberCategory, state } from "../state.js";
import { renderChallengeSummary } from "./challenge.js";

export function renderSmart() {
  view.innerHTML = sectionHead("Smart Picks", "Live OSM places ranked for weather, timing, trip stage, and interests.", "<button class='ghost' id='refresh'>Refresh</button>") +
    renderChallengeSummary() +
    `<div class="grid">${state.data.picks.map(placeCard).join("")}</div>`;
  $("refresh").addEventListener("click", () => loadSmartPicks(state.context));
  bindPlaceActions();
}

function placeCard(place) {
  return `
    <article class="card">
      <div class="visual"><strong>${escapeHtml(place.category)}</strong><span>${place.distanceKm.toFixed(1)} km</span></div>
      <div class="card-body">
        <p class="eyebrow">Rank ${place.rank}</p>
        <h2>${escapeHtml(place.name)}</h2>
        <p>${escapeHtml(place.reason)}</p>
        <small>Reason source: ${escapeHtml(place.reasonSource)}</small>
        <div class="actions">
          <button data-action="skip" data-id="${escapeHtml(place.id)}">Skip</button>
          <button data-action="save" data-id="${escapeHtml(place.id)}">Save</button>
        </div>
      </div>
    </article>`;
}

function bindPlaceActions() {
  view.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const place = state.data.picks.find((item) => item.id === button.dataset.id);
      if (!place) return;
      rememberCategory(place.category);
      if (button.dataset.action === "save") {
        state.selectedPlace = place;
        setTab("detail");
        return;
      }
      loadSmartPicks({ ...state.context, recentCategoriesShown: state.recentCategoriesShown });
    });
  });
}
