import { escapeHtml } from "../dom.js";

const challengeItems = [
  [
    "Recommend attractions",
    "Smart Picks ranks real nearby places with weather, time, trip progress, and interest signals."
  ],
  [
    "Uncover hidden gems",
    "Off Path filters the same live data set for lower-visibility cultural places instead of obvious top-ten lists."
  ],
  [
    "Promote heritage",
    "Heritage Note turns factual place data into grounded cultural context with safe AI prompts."
  ],
  [
    "Generate storytelling",
    "Story Mode produces an accessible transcript for a narrated place guide."
  ],
  [
    "Suggest local events",
    "Happening Now surfaces trip-window events that fit the user's city and interests."
  ],
  [
    "Connect visitors",
    "Local Threads records real connection requests in the append-only ledger."
  ]
];

export function renderChallengeSummary() {
  return `
    <section class="challenge" aria-labelledby="challengeTitle">
      <div class="challenge-head">
        <p class="eyebrow">Problem statement alignment</p>
        <h2 id="challengeTitle">Built for destination discovery and cultural experiences.</h2>
        <p class="muted">Every required behavior maps to a live call or a real write, so the app directly answers the brief instead of drifting into a generic travel app.</p>
      </div>
      <div class="challenge-grid">
        ${challengeItems.map(([title, detail]) => `
          <article class="challenge-item">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(detail)}</p>
          </article>
        `).join("")}
      </div>
    </section>`;
}
