import { buildRuleReason, filterAndRankCandidates, hiddenGemScore } from "../decisionEngine.js";
import { askGemini, hasGemini } from "../services/gemini.js";
import { fetchPlaces, geocodeCity } from "../services/osm.js";
import { fetchWeather } from "../services/weather.js";
import { validateContext } from "../validators.js";

export async function smartPicks(raw) {
  const context = validateContext(raw);
  const city = await geocodeCity(context.city);
  const [places, weather] = await Promise.all([fetchPlaces(city), fetchWeather(city)]);
  const contextWithTime = {
    ...context,
    timeOfDay: context.timeOfDay || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
  };
  const ranked = filterAndRankCandidates({ places, context: contextWithTime, weather });
  const ai = await rankWithGemini({ ranked, context: contextWithTime, weather });
  const picks = ranked.slice(0, 5).map((place, index) => ({
    ...place,
    reason: ai.ranking?.[place.id] || buildRuleReason(place, contextWithTime, weather),
    reasonSource: ai.ranking?.[place.id] ? "gemini" : "rule-layer",
    rank: index + 1
  }));
  const hiddenGems = ranked
    .map((place) => ({ ...place, hiddenGemScore: hiddenGemScore(place) }))
    .sort((a, b) => b.hiddenGemScore - a.hiddenGemScore)
    .slice(0, 4)
    .map((place) => ({
      ...place,
      reason: `Lower-visibility ${place.category} pick from live OpenStreetMap data, selected for fit and proximity.`
    }));

  return {
    city,
    weather,
    context: contextWithTime,
    picks,
    hiddenGems,
    aiStatus: ai.status,
    sources: ["Nominatim", "Overpass", "Open-Meteo", ai.status === "ok" ? "Gemini" : null].filter(Boolean)
  };
}

async function rankWithGemini({ ranked, context, weather }) {
  if (!hasGemini()) return { status: "not_configured", ranking: null };
  try {
    const text = await askGemini({
      system: "Return JSON mapping each supplied id to one grounded sentence. Use only supplied JSON facts.",
      prompt: JSON.stringify({ context, weather, candidates: ranked.slice(0, 8) }),
      responseJson: true
    });
    return { status: "ok", ranking: JSON.parse(text) };
  } catch {
    return { status: "failed", ranking: null };
  }
}
