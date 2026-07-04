import { $, escapeHtml, sectionHead, view } from "../dom.js";
import { postJson } from "../apiClient.js";
import { awardStamp, state } from "../state.js";

export async function renderPlanner() {
  view.innerHTML = sectionHead("AI Trip Planner", "Flights, lodging & a cultural day-by-day itinerary powered by Gemini.", "<button class='ghost' id='reloadPlanner'>Reload</button>") +
    `<div id="plannerView" class="view"><div class="status" role="status">Generating your personalised travel plan…</div></div>`;
  $("reloadPlanner").addEventListener("click", renderPlanner);
  try {
    const data = await postJson("/api/planner/itinerary", state.context);
    awardStamp(data.stamp);
    $("plannerView").innerHTML = renderPlannerContent(data);
  } catch (error) {
    $("plannerView").innerHTML = `<div class="status bad" role="alert">${escapeHtml(error.message)}</div>`;
  }
}

function renderPlannerContent(data) {
  const ctx = data.context;
  const sym = data.currencySymbol || "$";
  const cb = data.costBreakdown;
  return `
    <div class="planner-hero">
      <div class="planner-hero-inner">
        <div class="planner-route">${escapeHtml(ctx.origin)} <span class="route-arrow">→</span> ${escapeHtml(ctx.city)}</div>
        <p class="planner-summary-text">${escapeHtml(data.plan.tripSummary || "")}</p>
        <div class="planner-chips">
          <span class="pchip pchip-blue">🧳 ${escapeHtml(ctx.traveler)}</span>
          <span class="pchip pchip-green">💼 ${escapeHtml(ctx.budget)}</span>
          <span class="pchip pchip-rose">${sym} ${escapeHtml(ctx.currency)}</span>
          <span class="pchip pchip-amber">🗓 ${ctx.tripDaysTotal} days</span>
          <span class="pchip pchip-purple">${data.outboundDate} → ${data.returnDate}</span>
        </div>
        <small class="muted">Source: ${escapeHtml(data.source)}</small>
      </div>
    </div>

    ${cb ? renderCostViz(cb, sym) : ""}

    <div class="planner-sections">
      <section aria-labelledby="flightsTitle">
        <h3 id="flightsTitle" class="section-eyebrow">✈ Flights — ${data.originCode} → ${data.destCode}</h3>
        <div class="grid">${data.flights.map(f => flightCard(f, sym)).join("")}</div>
      </section>

      <section aria-labelledby="hotelsTitle">
        <h3 id="hotelsTitle" class="section-eyebrow">🏨 Lodging in ${escapeHtml(ctx.city)}</h3>
        <div class="grid">${data.hotels.map(h => hotelCard(h, sym)).join("")}</div>
      </section>

      <section aria-labelledby="itineraryTitle">
        <h3 id="itineraryTitle" class="section-eyebrow">📅 Day-by-Day Itinerary</h3>
        <div class="timeline-stack">${data.plan.itinerary.map(d => dayTimeline(d, sym)).join("")}</div>
      </section>
    </div>`;
}

function renderCostViz(cb, sym) {
  const total = cb.total || 1;
  const flightPct = Math.round((cb.flight / total) * 100);
  const lodgingPct = Math.round((cb.lodging / total) * 100);
  const actPct = Math.max(0, 100 - flightPct - lodgingPct);
  return `
    <div class="cost-viz card card-body">
      <h3 class="section-eyebrow" style="margin-bottom: 12px;">💰 Estimated Trip Cost Breakdown</h3>
      <div class="cost-bar-wrap" role="img" aria-label="Cost breakdown: Flights ${flightPct}%, Lodging ${lodgingPct}%, Activities ${actPct}%">
        <div class="cost-bar">
          <div class="cost-segment seg-flight" style="width:${flightPct}%" title="Flights: ${sym}${cb.flight.toLocaleString()}"></div>
          <div class="cost-segment seg-lodging" style="width:${lodgingPct}%" title="Lodging: ${sym}${cb.lodging.toLocaleString()}"></div>
          <div class="cost-segment seg-activities" style="width:${actPct}%" title="Activities: ${sym}${cb.activities.toLocaleString()}"></div>
        </div>
      </div>
      <div class="cost-legend">
        <span class="legend-item"><span class="legend-dot dot-flight"></span>Flights <strong>${sym}${cb.flight.toLocaleString()}</strong></span>
        <span class="legend-item"><span class="legend-dot dot-lodging"></span>Lodging <strong>${sym}${cb.lodging.toLocaleString()}</strong></span>
        <span class="legend-item"><span class="legend-dot dot-activities"></span>Activities ~<strong>${sym}${cb.activities.toLocaleString()}</strong></span>
        <span class="legend-item legend-total">Total ~<strong>${sym}${cb.total.toLocaleString()}</strong></span>
      </div>
    </div>`;
}

function flightCard(flight, sym) {
  const mins = flight.duration;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `
    <article class="card card-body flight-card">
      <div class="flight-top">
        <span class="airline-name">${escapeHtml(flight.airline)}</span>
        <span class="flight-price">${sym}${(flight.price || 0).toLocaleString()}</span>
      </div>
      <div class="flight-route-row">
        <span class="flight-time">${escapeHtml(flight.departure_time)}</span>
        <span class="flight-line"><span class="flight-dot"></span><span class="flight-dash"></span>✈<span class="flight-dash"></span><span class="flight-dot"></span></span>
        <span class="flight-time">${escapeHtml(flight.arrival_time)}</span>
      </div>
      <div class="flight-meta">
        <span>${escapeHtml(flight.flight_number)}</span>
        <span>${escapeHtml(flight.travel_class)}</span>
        <span>${hrs}h ${rem}m</span>
        <span>${escapeHtml(flight.airplane)}</span>
      </div>
    </article>`;
}

function hotelCard(hotel, sym) {
  const stars = Math.round(hotel.overall_rating || 4);
  const starStr = "★".repeat(stars) + "☆".repeat(5 - stars);
  return `
    <article class="card card-body hotel-card">
      <div class="hotel-top">
        <strong class="hotel-name">${escapeHtml(hotel.name)}</strong>
        <span class="hotel-rate">${sym}${(hotel.rate_per_night || 0).toLocaleString()}<small>/night</small></span>
      </div>
      <div class="hotel-stars" aria-label="${stars} stars">${starStr}</div>
      <p class="hotel-reviews muted">${hotel.reviews} reviews · Location ${hotel.location_rating?.toFixed(1) ?? "—"}/5</p>
      <div class="tag-list">${(hotel.amenities || []).map(a => `<span class="tag-pill">${escapeHtml(a)}</span>`).join("")}</div>
      <p class="hotel-total muted" style="margin-top: 8px; font-size: 0.8rem;">Total: ${sym}${(hotel.total_rate || 0).toLocaleString()}</p>
    </article>`;
}

function dayTimeline(day, sym) {
  return `
    <div class="timeline-day">
      <div class="timeline-badge">Day ${day.day}</div>
      <div class="timeline-content card card-body">
        <h4 class="day-theme">${escapeHtml(day.theme)}</h4>
        <ul class="schedule-list">
          ${(day.schedule || []).map(item => `
            <li class="schedule-item">
              <span class="sched-time">${escapeHtml(item.time)}</span>
              <div class="sched-detail">
                <strong class="sched-activity">${escapeHtml(item.activity)}</strong>
                <span class="sched-cost">${escapeHtml(item.cost)}</span>
                <p class="sched-notes">${escapeHtml(item.notes)}</p>
              </div>
            </li>`).join("")}
        </ul>
      </div>
    </div>`;
}
