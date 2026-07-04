import { askGemini } from "../services/gemini.js";
import { getCurrencySymbol, searchFlights, searchHotels } from "../services/serpapi.js";
import { validateContext } from "../validators.js";

const AIRPORT_MAP = {
  "new delhi": "DEL", "delhi": "DEL", "mumbai": "BOM", "bangalore": "BLR",
  "london": "LHR", "new york": "JFK", "tokyo": "HND", "paris": "CDG",
  "singapore": "SIN", "dubai": "DXB", "sydney": "SYD", "rome": "FCO",
  "toronto": "YYZ", "beijing": "PEK", "shanghai": "PVG", "bangkok": "BKK",
  "amsterdam": "AMS", "frankfurt": "FRA", "barcelona": "BCN", "madrid": "MAD"
};

async function getIataCode(city) {
  const normalized = city.trim().toLowerCase();
  if (AIRPORT_MAP[normalized]) return AIRPORT_MAP[normalized];
  try {
    const code = await askGemini({
      system: "Return ONLY the 3-letter IATA airport code for the city. Exactly 3 uppercase letters, nothing else.",
      prompt: city,
      responseJson: false
    });
    const parsed = code.trim().slice(0, 3).toUpperCase();
    if (/^[A-Z]{3}$/.test(parsed)) return parsed;
  } catch {}
  return normalized.slice(0, 3).toUpperCase();
}

export async function tripPlan(raw) {
  const context = validateContext(raw);
  const currencySymbol = getCurrencySymbol(context.currency);

  const originCode = await getIataCode(context.origin);
  const destCode = await getIataCode(context.city);

  const outbound = new Date();
  outbound.setDate(outbound.getDate() + 1);
  const outboundStr = outbound.toISOString().split("T")[0];

  const returnDt = new Date(outbound);
  returnDt.setDate(returnDt.getDate() + context.tripDaysTotal);
  const returnStr = returnDt.toISOString().split("T")[0];

  const [flights, hotels] = await Promise.all([
    searchFlights(originCode, destCode, outboundStr, returnStr, context.currency),
    searchHotels(context.city, outboundStr, returnStr, context.budget, context.currency)
  ]);

  const cheapestFlight = flights.length ? Math.min(...flights.map(f => f.price)) : 0;
  const cheapestHotel = hotels.length ? hotels[0].rate_per_night * context.tripDaysTotal : 0;

  const itineraryPrompt = `
    Destination: ${context.city} (${destCode})
    Origin: ${context.origin} (${originCode})
    Days: ${context.tripDaysTotal}
    Traveler Style: ${context.traveler}
    Budget Category: ${context.budget}
    Currency: ${context.currency} (symbol: ${currencySymbol})
    Interests: ${context.interests.join(", ")}
    Flights Found: ${JSON.stringify(flights)}
    Hotels Found: ${JSON.stringify(hotels)}

    Generate a detailed day-by-day travel itinerary for ${context.tripDaysTotal} days.
    Integrate the flight times/airline details and lodging selection logically.
    Focus on authentic local discovery, cultural landmarks, and hidden gems matching: ${context.interests.join(", ")}.
    Ensure activities align with traveler style: ${context.traveler}.
    All prices in cost fields MUST use the currency symbol ${currencySymbol}.
    Output strictly in JSON format:
    {
      "tripSummary": "A concise summary of the trip's cultural vibe",
      "estimatedActivityCost": 120,
      "itinerary": [
        {
          "day": 1,
          "theme": "Vibe or theme of the day",
          "schedule": [
            {
              "time": "09:00",
              "activity": "Activity or Place name",
              "cost": "${currencySymbol}15 or Free",
              "notes": "Cultural context or practical tip"
            }
          ]
        }
      ]
    }
  `;

  let planJson = {};
  try {
    const aiResponse = await askGemini({
      system: "You are a professional cultural travel planner. Return only valid JSON. No markdown code blocks.",
      prompt: itineraryPrompt,
      responseJson: true
    });
    planJson = JSON.parse(aiResponse);
  } catch {
    planJson = {
      tripSummary: `A beautiful ${context.tripDaysTotal}-day cultural trip to ${context.city}.`,
      estimatedActivityCost: Math.round(80 * context.tripDaysTotal),
      itinerary: Array.from({ length: context.tripDaysTotal }, (_, i) => ({
        day: i + 1,
        theme: "Cultural Exploration",
        schedule: [
          { time: "09:00", activity: `Morning at ${context.city} heritage sites`, cost: `${currencySymbol}10`, notes: `Heritage and cultural immersion.` },
          { time: "13:00", activity: `Local food experience`, cost: `${currencySymbol}15`, notes: `Taste authentic local cuisine.` },
          { time: "17:00", activity: `Evening at a cultural landmark`, cost: "Free", notes: `Wind down with local atmosphere.` }
        ]
      }))
    };
  }

  const activityCost = planJson.estimatedActivityCost || Math.round(80 * context.tripDaysTotal);

  return {
    context,
    currencySymbol,
    originCode,
    destCode,
    outboundDate: outboundStr,
    returnDate: returnStr,
    flights,
    hotels,
    plan: planJson,
    costBreakdown: {
      flight: cheapestFlight,
      lodging: cheapestHotel,
      activities: activityCost,
      total: cheapestFlight + cheapestHotel + activityCost
    },
    stamp: "planner",
    source: "gemini + serpapi"
  };
}
