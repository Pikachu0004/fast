const INTERESTS = new Set(["food", "heritage", "art", "nature", "nightlife", "craft"]);
const BUDGETS = new Set(["free", "$", "$$", "$$$"]);

export function validateContext(value) {
  assertObject(value, "Request body");
  const city = cleanText(value.city, 2, 80, "city");
  const tripDay = cleanInteger(value.tripDay, 1, 7, "tripDay");
  const tripDaysTotal = cleanInteger(value.tripDaysTotal, 1, 7, "tripDaysTotal");
  if (tripDay > tripDaysTotal) badRequest("tripDay cannot be greater than tripDaysTotal");
  const interests = cleanArray(value.interests, 1, 6, "interests").map((item) => {
    const interest = cleanText(item, 2, 20, "interest").toLowerCase();
    if (!INTERESTS.has(interest)) badRequest(`Unsupported interest: ${interest}`);
    return interest;
  });
  const budget = value.budget === undefined ? "$$" : cleanText(value.budget, 1, 4, "budget");
  if (!BUDGETS.has(budget)) badRequest("Unsupported budget");
  const timeOfDay = value.timeOfDay === undefined ? undefined : cleanTimeOfDay(value.timeOfDay);
  const recentCategoriesShown = (value.recentCategoriesShown || []).slice(-12).map((item) => cleanText(item, 1, 30, "recent category"));
  return { city, tripDay, tripDaysTotal, interests: [...new Set(interests)], budget, ...(timeOfDay ? { timeOfDay } : {}), recentCategoriesShown };
}

export function validatePlaceContext(value) {
  const context = validateContext(value);
  assertObject(value.place, "place");
  return {
    ...context,
    place: {
      id: cleanText(value.place.id, 1, 120, "place.id"),
      name: cleanText(value.place.name, 1, 160, "place.name"),
      category: cleanText(value.place.category, 1, 60, "place.category"),
      address: value.place.address ? cleanText(value.place.address, 0, 240, "place.address") : "",
      tags: cleanRecord(value.place.tags || {}, 60, 120)
    }
  };
}

export function validateConnectionRequest(value) {
  assertObject(value, "Request body");
  return {
    city: cleanText(value.city, 2, 80, "city"),
    hostId: cleanText(value.hostId, 1, 120, "hostId"),
    hostName: cleanText(value.hostName, 1, 160, "hostName"),
    travelerName: cleanText(value.travelerName, 2, 80, "travelerName"),
    email: cleanEmail(value.email),
    message: cleanText(value.message, 10, 600, "message")
  };
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = "BAD_REQUEST";
  throw error;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) badRequest(`${label} must be an object`);
}

function cleanArray(value, min, max, label) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    badRequest(`${label} must contain ${min}-${max} items`);
  }
  return value;
}

function cleanInteger(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) badRequest(`${label} must be an integer between ${min} and ${max}`);
  return value;
}

function cleanEmail(value) {
  const email = cleanText(value, 5, 120, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("email must be valid");
  return email;
}

function cleanTimeOfDay(value) {
  const time = cleanText(value, 5, 5, "timeOfDay");
  if (!/^\d{2}:\d{2}$/.test(time)) badRequest("timeOfDay must use HH:MM format");
  return time;
}

function cleanText(value, min, max, label) {
  if (typeof value !== "string") badRequest(`${label} must be a string`);
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (normalized.length < min || normalized.length > max) badRequest(`${label} must be ${min}-${max} characters`);
  return normalized;
}

function cleanRecord(value, maxKeys, maxValueLength) {
  assertObject(value, "tags");
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, maxKeys)
      .map(([key, item]) => [
        cleanText(String(key), 1, 80, "tag key"),
        cleanText(String(item), 0, maxValueLength, "tag value")
      ])
  );
}
