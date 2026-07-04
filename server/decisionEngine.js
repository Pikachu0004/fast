const CATEGORY_WEIGHTS = {
  heritage: 5,
  food: 4,
  art: 4,
  nature: 3,
  nightlife: 3,
  craft: 4,
  landmark: 3
};

export function inferCategory(place) {
  const tags = place.tags || {};
  const values = Object.values(tags).join(" ").toLowerCase();
  const name = (place.name || "").toLowerCase();
  const haystack = `${values} ${name}`;

  if (/museum|monument|historic|archaeological|temple|mosque|church|fort|palace/.test(haystack)) return "heritage";
  if (/restaurant|cafe|food|bakery|marketplace|bar|pub/.test(haystack)) return "food";
  if (/gallery|art|theatre|cinema|mural|studio/.test(haystack)) return "art";
  if (/park|garden|viewpoint|nature|river|lake/.test(haystack)) return "nature";
  if (/nightclub|bar|pub|music_venue/.test(haystack)) return "nightlife";
  if (/craft|artisan|handicraft|workshop|shop/.test(haystack)) return "craft";
  return "landmark";
}

export function weatherSeverity(weatherCode) {
  if ([95, 96, 99].includes(weatherCode)) return "storm";
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) return "rain";
  if ([71, 73, 75, 85, 86].includes(weatherCode)) return "snow";
  return "clear";
}

export function filterAndRankCandidates({ places, context, weather }) {
  const hour = Number((context.timeOfDay || "12:00").split(":")[0]);
  const recent = context.recentCategoriesShown || [];
  const severeWeather = weatherSeverity(weather?.code);
  const interestSet = new Set((context.interests || []).map((item) => item.toLowerCase()));

  return places
    .map((place) => ({ ...place, category: place.category || inferCategory(place) }))
    .filter((place) => {
      if (severeWeather === "storm" && ["nature", "landmark"].includes(place.category)) return false;
      if (severeWeather === "rain" && place.category === "nature") return false;
      if (hour < 17 && place.category === "nightlife") return false;
      return Boolean(place.name);
    })
    .map((place) => {
      let score = CATEGORY_WEIGHTS[place.category] || 1;
      if (interestSet.has(place.category)) score += 4;
      if (recent.slice(-2).every((category) => category === place.category)) score -= 3;
      if (place.rating) score += Number(place.rating) / 2;
      if (place.distanceKm) score += Math.max(0, 2 - place.distanceKm / 3);
      return { ...place, score: Number(score.toFixed(2)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export function buildRuleReason(place, context, weather) {
  const bits = [];
  const weatherText = weather?.label ? weather.label.toLowerCase() : "the current weather";
  bits.push(`It is ${context.timeOfDay} with ${weatherText}, so the choice stays tied to live travel context instead of a generic top-ten list`);
  if (context.tripDay && context.tripDaysTotal) bits.push(`day ${context.tripDay} of ${context.tripDaysTotal}`);
  if (place.category) bits.push(`matching your ${place.category} interest`);
  if (place.distanceKm) bits.push(`${place.distanceKm.toFixed(1)} km from the selected center`);
  return `${bits.join(", ")}.`;
}

export function hiddenGemScore(place) {
  const knownReviews = Number(place.reviewCount || 0);
  const visibilityBonus = knownReviews === 0 ? 1 : Math.max(0, 150 - knownReviews) / 150;
  return Number(((place.score || 1) + visibilityBonus + (place.category === "craft" ? 1.5 : 0)).toFixed(2));
}
