export function hasSerpApi() {
  return Boolean(process.env.SERPAPI_API_KEY);
}

export function getCurrencySymbol(currency) {
  switch (currency) {
    case "EUR": return "€";
    case "GBP": return "£";
    case "INR": return "₹";
    case "JPY": return "¥";
    default: return "$";
  }
}

export function getCurrencyMultiplier(currency) {
  switch (currency) {
    case "EUR": return 0.92;
    case "GBP": return 0.79;
    case "INR": return 83.5;
    case "JPY": return 160.0;
    default: return 1.0;
  }
}

export async function searchFlights(departureCode, arrivalCode, outboundDate, returnDate, currency = "USD") {
  if (!hasSerpApi()) {
    return generateMockFlights(departureCode, arrivalCode, outboundDate, returnDate, currency);
  }

  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_flights");
  url.searchParams.set("departure_id", departureCode);
  url.searchParams.set("arrival_id", arrivalCode);
  url.searchParams.set("outbound_date", outboundDate);
  url.searchParams.set("return_date", returnDate);
  url.searchParams.set("currency", currency);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SerpAPI flight search failed with status ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);

  const best = data.best_flights || [];
  const other = data.other_flights || [];
  const flights = [...best, ...other];
  const simplified = [];

  for (const group of flights) {
    if (!group.flights) continue;
    for (const flight of group.flights) {
      simplified.push({
        departure_airport: flight.departure_airport?.name || departureCode,
        departure_time: flight.departure_airport?.time || outboundDate + " 08:00",
        arrival_airport: flight.arrival_airport?.name || arrivalCode,
        arrival_time: flight.arrival_airport?.time || outboundDate + " 12:00",
        duration: flight.duration || 240,
        airplane: flight.airplane || "Boeing 737",
        airline: flight.airline || "Carrier",
        flight_number: flight.flight_number || "FL100",
        travel_class: flight.travel_class || "Economy",
        price: group.price || 350
      });
    }
  }
  return simplified.slice(0, 3);
}

export async function searchHotels(destination, checkInDate, checkOutDate, budget, currency = "USD") {
  if (!hasSerpApi()) {
    return generateMockHotels(destination, checkInDate, checkOutDate, budget, currency);
  }

  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_hotels");
  url.searchParams.set("q", `${destination} hotels`);
  url.searchParams.set("check_in_date", checkInDate);
  url.searchParams.set("check_out_date", checkOutDate);
  url.searchParams.set("currency", currency);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SerpAPI hotel search failed with status ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);

  const properties = data.properties || [];
  return properties.slice(0, 3).map((prop) => ({
    name: prop.name || "Destination Stay",
    latitude: prop.gps_coordinates?.latitude,
    longitude: prop.gps_coordinates?.longitude,
    check_in_time: prop.check_in_time || "15:00",
    check_out_time: prop.check_out_time || "11:00",
    rate_per_night: prop.rate_per_night?.lowest || 120,
    total_rate: prop.total_rate?.lowest || 240,
    overall_rating: prop.overall_rating || 4.2,
    reviews: prop.reviews || 100,
    location_rating: prop.location_rating || 4.0,
    amenities: prop.amenities || ["Free Wi-Fi", "Air conditioning"]
  }));
}

function generateMockFlights(dep, arr, depDate, retDate, currency) {
  const mult = getCurrencyMultiplier(currency);
  return [
    {
      departure_airport: `${dep} Airport`,
      departure_time: `${depDate} 08:30`,
      arrival_airport: `${arr} Airport`,
      arrival_time: `${depDate} 12:45`,
      duration: 255,
      airplane: "Airbus A320neo",
      airline: "AeroGlobal",
      flight_number: "AG-402",
      travel_class: "Economy",
      price: Math.round(240 * mult)
    },
    {
      departure_airport: `${dep} Airport`,
      departure_time: `${depDate} 14:15`,
      arrival_airport: `${arr} Airport`,
      arrival_time: `${depDate} 18:30`,
      duration: 255,
      airplane: "Boeing 737 MAX 8",
      airline: "StarFlyer Express",
      flight_number: "SF-883",
      travel_class: "Economy",
      price: Math.round(190 * mult)
    },
    {
      departure_airport: `${dep} Airport`,
      departure_time: `${depDate} 21:00`,
      arrival_airport: `${arr} Airport`,
      arrival_time: `${retDate} 01:15`,
      duration: 255,
      airplane: "Boeing 787-9",
      airline: "Summit Air",
      flight_number: "SA-901",
      travel_class: "Premium Economy",
      price: Math.round(450 * mult)
    }
  ];
}

function generateMockHotels(dest, checkIn, checkOut, budget, currency) {
  const mult = getCurrencyMultiplier(currency);
  let rate = 75;
  let amenities = ["Free Wi-Fi", "AC"];
  let hotelNames = [
    `${dest} Cozy Eco-Lodge`,
    `${dest} Central Plaza Inn`,
    `${dest} Grand Heritage Resort`
  ];

  if (budget === "free" || budget === "$") {
    rate = 45;
    amenities.push("Shared Kitchen", "Bicycle Rental");
  } else if (budget === "$$") {
    rate = 110;
    amenities.push("Free Breakfast", "Fitness Center", "Pool");
  } else if (budget === "$$$") {
    rate = 320;
    amenities.push("Luxury Spa", "24/7 Butler Service", "Rooftop Lounge", "Michelin Dining");
  }

  const checkInDays = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 3;

  return hotelNames.map((name, index) => {
    const nightRate = Math.round((rate + index * 15) * mult);
    return {
      name,
      latitude: 0,
      longitude: 0,
      check_in_time: "14:00",
      check_out_time: "11:00",
      rate_per_night: nightRate,
      total_rate: nightRate * checkInDays,
      overall_rating: 4.1 + index * 0.2,
      reviews: 140 + index * 85,
      location_rating: 4.3 + index * 0.1,
      amenities
    };
  });
}
