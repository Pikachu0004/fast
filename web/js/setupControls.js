import { $ } from "./dom.js";
import { state } from "./state.js";

const interests = [
  ["food", "Food"],
  ["heritage", "History"],
  ["art", "Art"],
  ["nature", "Nature"],
  ["nightlife", "Nightlife"],
  ["craft", "Craft"]
];

export function renderInterestChips(selected) {
  $("interests").replaceChildren(...interests.map(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.value = value;
    button.setAttribute("aria-pressed", selected.has(value) ? "true" : "false");
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    });
    return button;
  }));
}

export function readContext() {
  const selected = [...document.querySelectorAll("#interests button[aria-pressed='true']")];
  return {
    city: $("city").value,
    tripDay: Number($("tripDay").value),
    tripDaysTotal: Number($("tripDaysTotal").value),
    interests: selected.map((button) => button.dataset.value),
    budget: $("budget").value,
    timeOfDay: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
    recentCategoriesShown: state.recentCategoriesShown
  };
}

export function syncTripRanges() {
  const tripDay = $("tripDay");
  const tripDaysTotal = $("tripDaysTotal");
  tripDay.max = tripDaysTotal.value;
  if (Number(tripDay.value) > Number(tripDaysTotal.value)) tripDay.value = tripDaysTotal.value;
  syncRangeText();
}

export function syncRangeText() {
  $("tripLengthText").textContent = `${$("tripDaysTotal").value} days`;
  $("tripDayText").textContent = $("tripDay").value;
}
