import { $, escapeHtml, renderStatus, sectionHead, view } from "../dom.js";
import { postJson } from "../apiClient.js";
import { awardStamp, state } from "../state.js";

export function renderDetail() {
  const place = state.selectedPlace;
  if (!place) {
    renderStatus("Select a place first.", "bad");
    return;
  }
  view.innerHTML = sectionHead(place.name, `${place.category} · ${(place.distanceKm || 0).toFixed(1)} km · grounded cultural context`) +
    `<div class="detail">
      <article class="card card-body">
        <p class="eyebrow">Live place facts</p>
        ${place.reason ? `<p>${escapeHtml(place.reason)}</p>` : ""}
        <dl class="fact-list">
          <div class="fact-row">
            <dt>Address</dt>
            <dd>${escapeHtml(place.address || "Address unavailable in OpenStreetMap data")}</dd>
          </div>
          <div class="fact-row">
            <dt>Source</dt>
            <dd>OpenStreetMap + OpenStreetMap tags</dd>
          </div>
          <div class="fact-row">
            <dt>Tags</dt>
            <dd>${renderTags(place.tags || {})}</dd>
          </div>
        </dl>
      </article>
      <article class="card card-body">
        <div class="actions">
          <button id="heritage">Heritage Note</button>
          <button id="story">Story Mode</button>
        </div>
        <div id="generated" class="status" role="status">Choose a generated mode. Transcript text appears here for accessibility.</div>
      </article>
    </div>`;
  $("heritage").addEventListener("click", () => loadGenerated("heritage"));
  $("story").addEventListener("click", () => loadGenerated("story"));
}

function renderTags(tags) {
  const entries = Object.entries(tags).slice(0, 8);
  if (!entries.length) return `<span class="muted">No extra tags available.</span>`;
  return `<div class="tag-list">${entries.map(([key, value]) => `
    <span class="tag-pill"><strong>${escapeHtml(key)}</strong> ${escapeHtml(String(value))}</span>
  `).join("")}</div>`;
}

async function loadGenerated(kind) {
  $("generated").className = "status";
  $("generated").textContent = "Calling Gemini with selected place facts.";
  try {
    const data = await postJson(`/api/place/${kind}`, { ...state.context, place: state.selectedPlace });
    awardStamp(data.stamp);
    $("generated").textContent = data.note || data.transcript;
  } catch (error) {
    $("generated").className = "status bad";
    $("generated").setAttribute("role", "alert");
    $("generated").textContent = error.message;
  }
}
