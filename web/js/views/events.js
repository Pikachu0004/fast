import { $, escapeHtml, sectionHead, view } from "../dom.js";
import { postJson } from "../apiClient.js";
import { awardStamp, state } from "../state.js";

export async function renderEvents() {
  view.innerHTML = sectionHead("Happening Now", "Trip-window events matched to the visitor's schedule and interests.", "<button class='ghost' id='reloadEvents'>Reload</button>") +
    `<div id="eventList" class="view"><div class="status" role="status">Loading events.</div></div>`;
  $("reloadEvents").addEventListener("click", renderEvents);
  try {
    const data = await postJson("/api/events", state.context);
    awardStamp(data.stamp);
    $("eventList").innerHTML = data.events.length ? data.events.map(eventCard).join("") : `<div class="status">No events found for this trip window.</div>`;
  } catch (error) {
    $("eventList").innerHTML = `<div class="status bad" role="alert">${escapeHtml(error.message)}</div>`;
  }
}

function eventCard(event) {
  return `
    <article class="card card-body">
      <strong>${escapeHtml(event.name)}</strong>
      <span>${escapeHtml(event.venue)} · ${escapeHtml(event.date || "")} ${escapeHtml(event.time || "")}</span>
      <p>${escapeHtml(event.why)}</p>
    </article>`;
}
