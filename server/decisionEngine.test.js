import test from "node:test";
import assert from "node:assert/strict";
import { filterAndRankCandidates, inferCategory, weatherSeverity } from "./decisionEngine.js";

test("infers categories from OSM tags and names", () => {
  assert.equal(inferCategory({ tags: { tourism: "museum" } }), "heritage");
  assert.equal(inferCategory({ tags: { amenity: "cafe" } }), "food");
  assert.equal(inferCategory({ name: "Craft workshop", tags: {} }), "craft");
});

test("filters outdoor categories during rain", () => {
  const ranked = filterAndRankCandidates({
    places: [
      { id: "1", name: "City Garden", tags: { leisure: "park" } },
      { id: "2", name: "Old Museum", tags: { tourism: "museum" } }
    ],
    context: { timeOfDay: "14:00", interests: ["nature"] },
    weather: { code: 63 }
  });
  assert.deepEqual(ranked.map((place) => place.name), ["Old Museum"]);
});

test("down-weights repetitive categories", () => {
  const ranked = filterAndRankCandidates({
    places: [
      { id: "1", name: "Cafe One", tags: { amenity: "cafe" } },
      { id: "2", name: "Gallery One", tags: { tourism: "gallery" } }
    ],
    context: { timeOfDay: "18:00", interests: ["food", "art"], recentCategoriesShown: ["food", "food"] },
    weather: { code: 0 }
  });
  assert.equal(ranked[0].category, "art");
});

test("classifies weather severity codes", () => {
  assert.equal(weatherSeverity(95), "storm");
  assert.equal(weatherSeverity(61), "rain");
  assert.equal(weatherSeverity(0), "clear");
});
