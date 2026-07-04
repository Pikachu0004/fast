import { state } from "./state.js";
import { renderDetail } from "./views/detail.js";
import { renderEvents } from "./views/events.js";
import { renderHidden } from "./views/hidden.js";
import { renderEmpty } from "./views/common.js";
import { renderPassport } from "./views/passport.js";
import { renderSmart } from "./views/smart.js";
import { renderThreads } from "./views/threads.js";
import { handleTabKeydown } from "./tabKeys.js";

const renderers = {
  smart: renderSmart,
  hidden: renderHidden,
  detail: renderDetail,
  events: renderEvents,
  threads: renderThreads,
  passport: renderPassport
};

export function initNavigation() {
  const tabs = document.querySelector(".tabs");
  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (button && !button.disabled) setTab(button.dataset.tab);
  });
  tabs.addEventListener("keydown", (event) => handleTabKeydown(event, [...tabs.querySelectorAll("button")], setTab));
}

export function setTab(tab) {
  state.activeTab = tab;
  const tabButtons = [...document.querySelectorAll(".tabs button")];
  tabButtons.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.disabled = !state.data;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
    button.setAttribute("aria-selected", String(active));
    if (active) button.focus({ preventScroll: true });
  });
  const view = document.getElementById("view");
  if (view) view.setAttribute("aria-labelledby", `tab-${tab}`);
  if (!state.data) {
    renderEmpty();
    return;
  }
  renderers[tab]();
}
