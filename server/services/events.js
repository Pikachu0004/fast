export async function fetchEvents({ city, interests, tripDaysTotal }) {
  if (!process.env.EVENTS_API_KEY) {
    const error = new Error("Events API key is not configured");
    error.status = 503;
    error.code = "EVENTS_NOT_CONFIGURED";
    throw error;
  }

  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + tripDaysTotal);
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", process.env.EVENTS_API_KEY);
  url.searchParams.set("city", city);
  url.searchParams.set("startDateTime", start.toISOString().replace(/\.\d{3}Z$/, "Z"));
  url.searchParams.set("endDateTime", end.toISOString().replace(/\.\d{3}Z$/, "Z"));
  url.searchParams.set("size", "12");
  url.searchParams.set("sort", "date,asc");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Events lookup failed with ${response.status}`);
  const data = await response.json();
  const events = data._embedded?.events || [];
  const interestText = interests.join(", ");
  return events.slice(0, 8).map((event) => ({
    id: event.id,
    name: event.name,
    venue: event._embedded?.venues?.[0]?.name || "Venue pending",
    date: event.dates?.start?.localDate,
    time: event.dates?.start?.localTime,
    url: event.url,
    why: `Matched against your interests: ${interestText}.`
  }));
}
