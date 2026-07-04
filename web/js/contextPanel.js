import { $, escapeHtml } from "./dom.js";

export function renderContextPanel(data) {
  const delta = 0.035;
  const { lat, lng } = data.city;
  $("contextPanel").innerHTML = `
    <strong>${escapeHtml(data.city.city)}</strong>
    <span>${escapeHtml(data.weather.label)}, ${Math.round(data.weather.temperatureC)} °C</span>
    <span>Day ${data.context.tripDay} of ${data.context.tripDaysTotal} · ${escapeHtml(data.context.timeOfDay)}</span>
    <iframe class="map-frame" title="OpenStreetMap view of ${escapeHtml(data.city.city)}" loading="lazy"
      src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}"></iframe>
    <small>Sources: ${data.sources.map(escapeHtml).join(", ")} · Gemini ${escapeHtml(data.aiStatus.replace("_", " "))}</small>
  `;
}
