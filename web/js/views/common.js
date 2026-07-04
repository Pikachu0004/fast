import { view } from "../dom.js";
import { renderChallengeSummary } from "./challenge.js";

export function renderEmpty() {
  view.innerHTML = `<div class="empty"><h1>Build a live cultural route from context.</h1><p class="muted">Choose a city and interests, then run the decision engine. The app shows real sources, honest failures, and explicit coverage of the challenge brief.</p>${renderChallengeSummary()}</div>`;
}
