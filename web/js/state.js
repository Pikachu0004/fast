export const state = {
  context: null,
  data: null,
  selectedPlace: null,
  activeTab: "smart",
  recentCategoriesShown: [],
  passport: new Set()
};

export function awardStamp(stamp) {
  if (stamp) state.passport.add(stamp);
}

export function rememberCategory(category) {
  state.recentCategoriesShown = [...state.recentCategoriesShown, category].slice(-8);
}
