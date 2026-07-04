import { $, renderStatus } from "./dom.js";
import { setTab } from "./navigation.js";
import { awardStamp, state } from "./state.js";
import { postJson } from "./apiClient.js";
import { renderContextPanel } from "./contextPanel.js";
import { readContext, renderInterestChips, syncRangeText, syncTripRanges } from "./setupControls.js";

export function initSetup() {
  renderInterestChips(new Set(["food", "heritage", "art"]));
  syncRangeText();
  $("tripDaysTotal").addEventListener("input", syncTripRanges);
  $("tripDay").addEventListener("input", syncRangeText);
  $("setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    loadSmartPicks(readContext());
  });
}

export async function loadSmartPicks(context) {
  state.context = context;
  renderStatus("Building live context from weather and local place data.");
  try {
    const data = await postJson("/api/context/smart-picks", context);
    state.data = data;
    state.selectedPlace = data.picks[0] || null;
    awardStamp("smart");
    if (data.hiddenGems.length) awardStamp("hidden");
    renderContextPanel(data);
    setTab("smart");
  } catch (error) {
    renderStatus(error.message, "bad");
  }
}

export { readContext };
